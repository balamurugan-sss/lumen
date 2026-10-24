"""Whisper line-by-line check: python core/tts/asr_check.py lines.json voices_dir [--lang en|zh|auto] [--model base|small|…] [--threshold 0.92]
Compares each line's text with its transcription (0.6 s of silence is padded on both sides first; short lines are misheard without it) and
writes per-word timestamps to voices_dir/words.json (for lip sync and line breaks).
A line in lines.json may carry an "asr" field that overrides the expected text (proper names, onomatopoeia, numbers the comparison does not convert, e.g. "3.5" for 三点五).
--lang  auto (default) decides by whether the text contains CJK characters. en requires an exact word-by-word match after dropping punctuation
        and case (whole numbers 0–999 are turned into words on both sides, so "forty" and "40" match; larger numbers, years, ordinals like 3rd and
        numbers with punctuation (3.5, 1:30, 1,000, 40%) are not, so write the expected transcription in the "asr" field). zh (also ja / ko) compares
        characters: after dropping punctuation, folding full-width to half-width and turning Chinese numerals into the digits Whisper writes
        (十九 → 19, 一千三百 → 1300, 六百万 → 600万; a digit-by-digit reading such as 一九四九 stays 1949), a difflib similarity ≥ --threshold
        (default 0.92) passes. Decimals, percentages and fractions are not converted (三点五 vs 3.5).
Model: --model (or the WHISPER_MODEL environment variable; a model name, or a local folder for offline use); default en → base.en, zh → small (base mishears too many Chinese lines), other languages → base (multilingual).
      If the default mishears a line that sounds right to you, check again with a larger model (base → small, about 480 MB; small → medium), more accurate and several times slower.
      The first run downloads from Hugging Face (base / base.en ≈ 145 MB, small ≈ 480 MB); behind a firewall set HF_ENDPOINT=https://hf-mirror.com,
      or download the model beforehand and pass --model /path/to/model-dir.
Exit codes: 0 all lines pass; 1 some lines differ; 2 the check could not run (model failed to load, etc.).
"""
import sys, json, re, os, argparse, difflib, unicodedata

CJK = re.compile('[㐀-鿿豈-﫿぀-ヿ가-힯]')
CHAR_LANGS = {'zh', 'ja', 'ko'}           # these languages are compared by character, the rest by word
_DIGITS = str.maketrans('零〇一二三四五六七八九', '00123456789')
_UNIT = {'十': 10, '百': 100, '千': 1000}


_ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
_TENS = 'x x twenty thirty forty fifty sixty seventy eighty ninety'.split()


def num_words(n):
    """0–999 → list of words for the English reading: 40 → ['forty'], 105 → ['one', 'hundred', 'five']"""
    out = []
    if n >= 100: out += [_ONES[n // 100], 'hundred']; n %= 100
    if n >= 20: out.append(_TENS[n // 10]); n %= 10
    if n or not out: out.append(_ONES[n])   # whole hundreds (100, 200…) don't get a trailing zero; 0 itself is read as zero
    return out


_SENTENCE_PUNCT = '.,;:!?"()[]{}\u2026\u201c\u201d\u2018\u2019'   # punctuation at either end of a word (full stops, commas, brackets…); the percent sign isn't included


def _is_formatted_number(raw):
    """Numbers written with punctuation between digits: decimals 3.5, times 1:30, dates 12/25, thousands separators 1,000, and percentages such as 40%.
    With the punctuation removed they would look like a different number (3.5 → 35), so they can't be converted to a reading."""
    core = raw.strip(_SENTENCE_PUNCT)
    return bool(re.search(r'\d[.,:/]\d', core) or ('%' in core and re.search(r'\d', core)))


def norm_en(s):
    """Word list for English comparison: lowercase, punctuation removed; integers 0–999 (whisper often writes forty as 40) replaced by their reading; the "and" in "hundred and" isn't counted.
    Kept as is (punctuation removed only, not converted to a reading): larger numbers, years, ordinals (3rd), and numbers with punctuation (decimals 3.5, times 1:30, thousands separators 1,000, percentages 40%) —
    otherwise 3.5 would become 35 and be confused with "thirty five". For their reading, write the expected transcription in the asr field of lines.json."""
    out = []
    for raw in s.lower().replace("'", '').replace('-', ' ').split():
        w = re.sub(r"[^a-z0-9]", '', raw)
        if not w: continue
        if re.fullmatch(r'0|[1-9]\d{0,2}', w) and not _is_formatted_number(raw): out += num_words(int(w))
        elif w == 'and' and out and out[-1] == 'hundred': pass
        else: out.append(w)
    return out


def _section(t):   # 0..9999 from digits and 十百千; None unless t is a well-formed number
    if not t or re.search('[^0-9十百千]', t): return None
    if not re.search('[十百千]', t): return int(t) if len(t) <= 4 and (len(t) == 1 or t[0] != '0') else None
    v, prev, last, zero, i = 0, 10000, None, False, 0
    while i < len(t):
        c, n = t[i], t[i + 1:i + 2]
        if c == '0':
            if i == 0 or t[i - 1] == '0' or not n: return None   # leading, doubled or trailing zero
            zero = True
        elif c in '百千': return None   # no coefficient (百姓, 千年)
        else:
            if c == '十': d, u = 1, 10
            elif n in _UNIT: d, u = int(c), _UNIT[n]; i += 1
            elif not n: v += int(c) * (last // 10 if not zero and last in (100, 1000) else 1); break   # 三百五 = 350
            else: return None
            if u >= prev: return None
            v += d * u; prev = last = u; zero = False
        i += 1
    return v


def _value(r):   # value of a run like 一千三百 or 六百万; None if it is not a complete number (万一, 千万别)
    total = 0
    for ch, mult in (('亿', 10**8), ('万', 10**4)):
        if ch not in r: continue
        hi, r = r.split(ch, 1); c = _section(hi)
        if not c: return None
        total += c * mult
        if r[:1] == '0':
            r = r[1:]
            if not r: return None
        elif len(r) == 1 and r in '123456789': return total + int(r) * (mult // 10)   # 一万五 = 15000
    s = _section(r) if r else 0
    return None if s is None else total + s


def _num(m):   # a run with 十百千万亿 → the number as Whisper writes it (十九 → 19, 六百万 → 600万, 三亿 → 3亿); other runs (一九四九) stay
    v = _value(m.group()) if re.search('[十百千万亿]', m.group()) else None
    if v is None: return m.group()
    if v >= 10**8 and v % 10**8 == 0: return f'{v // 10**8}亿'
    if v >= 10**4 and v % 10**4 == 0: return f'{v // 10**4}万'
    return str(v)


def norm_zh(s):
    s = unicodedata.normalize('NFKC', s).lower().translate(_DIGITS)   # NFKC: full-width → half-width, compatibility forms normalised
    s = ''.join(c for c in s if unicodedata.category(c)[0] in 'LN')   # keep only letters/hanzi/digits; strip all punctuation and whitespace
    return re.sub('[0-9十百千万亿]+', _num, re.sub('两(?=[百千万亿])', '2', s))   # then numbers, after punctuation is gone, so strings that matched before still match


def detect_lang(texts):
    cjk = sum(len(CJK.findall(t)) for t in texts); latin = sum(len(re.findall('[A-Za-z]', t)) for t in texts)
    return 'zh' if cjk and cjk >= 0.3 * (cjk + latin) else 'en'


def compare(want, got, lang, threshold=0.92):
    """Returns (passed or not, similarity 0..1)"""
    if lang in CHAR_LANGS:
        a, b = norm_zh(want), norm_zh(got)
        r = difflib.SequenceMatcher(None, a, b).ratio() if (a or b) else 1.0
        return r >= threshold, r
    a, b = norm_en(want), norm_en(got)
    return a == b, 1.0 if a == b else difflib.SequenceMatcher(None, a, b).ratio()


def load_model(name):
    try: from faster_whisper import WhisperModel
    except ImportError: sys.exit('asr_check.py: faster-whisper is missing: install the voice tier: sh plugin/skills/lemo-opuscar/scripts/setup.sh deps voice')
    try:
        return WhisperModel(name, device='cpu', compute_type='int8')
    except Exception as e:
        msg = f'{type(e).__name__}: {e}'
        print(f"asr_check.py: cannot load the whisper model '{name}'.\n  {msg[:300]}", file=sys.stderr)
        if not os.path.isdir(name):
            print("  The model is downloaded from huggingface.co on first use. If that site is blocked or you are offline:\n"
                  "    set HF_ENDPOINT=https://hf-mirror.com (a mirror), or download the model once and pass --model /path/to/model-dir", file=sys.stderr)
        sys.exit(2)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('lines'); ap.add_argument('voices_dir')
    ap.add_argument('--lang', default='auto'); ap.add_argument('--model'); ap.add_argument('--threshold', type=float, default=0.92)
    a = ap.parse_args()
    lines = json.load(open(a.lines, encoding='utf-8'))
    want = {L['id']: L.get('asr', L['text']) for L in lines}
    lang = detect_lang(list(want.values())) if a.lang == 'auto' else a.lang
    name = a.model or os.environ.get('WHISPER_MODEL') or {'en': 'base.en', 'zh': 'small'}.get(lang, 'base')
    if lang != 'en' and os.path.basename(name.rstrip('/')).endswith('.en'):
        print(f"asr_check.py: model '{name}' is English-only but the lines are '{lang}'. Use a multilingual model (e.g. --model base or --model small).", file=sys.stderr); sys.exit(2)
    import numpy as np, soundfile as sf, soxr
    m = load_model(name)
    bad, words = 0, {}
    for L in lines:
        y, sr = sf.read(os.path.join(a.voices_dir, L['id'] + '.wav'))
        if y.ndim > 1: y = y.mean(1)
        y = soxr.resample(y, sr, 16000, quality='HQ'); pad = np.zeros(int(.6 * 16000))   # same as librosa's default soxr_hq
        kw = dict(initial_prompt='以下是普通话的句子。') if lang == 'zh' else {}          # prompt in Simplified Chinese so the transcription doesn't come out in Traditional
        segs, _ = m.transcribe(np.concatenate([pad, y, pad]).astype(np.float32), beam_size=5, language=lang, word_timestamps=True, **kw)
        tail = (len(y) + len(pad)) / 16000 - .5   # Whisper sometimes repeats the line inside the trailing pad: drop such no-speech segments
        segs = [s for s in segs if not (s.no_speech_prob > .5 and s.start > tail)]; got = ' '.join(s.text.strip() for s in segs)
        words[L['id']] = [(w.word.strip(), round(w.start - .6, 3), round(w.end - .6, 3)) for s in segs for w in s.words]
        ok, r = compare(want[L['id']], got, lang, a.threshold); bad += not ok
        print(('OK  ' if ok else 'DIFF'), L['id'], '|', want[L['id']], '→', got, ('' if ok or lang == 'en' else f'   (similarity {r:.2f} < {a.threshold})'))
    json.dump(words, open(os.path.join(a.voices_dir, 'words.json'), 'w', encoding='utf-8'), indent=0, ensure_ascii=False)
    print('mismatches:', bad, f'(lang={lang}, model={name})')
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
