#!/bin/sh
# Build SNOW WHITE end to end. Note: the frame render uses this
# project's tools/render.mjs (a resumable driver written for this
# VM: core video.mjs's fixed 30 s screenshot timeout dies on
# SwiftShader under load; the driver keeps the same page contract,
# uses a 240 s timeout with retries, writes one JPEG per frame into
# out/frames/ and resumes where it stopped).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
cd "$LIB"
.venv/bin/python "$HERE/data/build_timeline.py"
node core/render/events.mjs "$HERE"
.venv/bin/python "$HERE/music/score.py"
.venv/bin/python "$HERE/mix.py"
node "$HERE/tools/render.mjs" "$HERE"   # writes out/frames/*.jpg + out/video.mp4
# Loudnorm two-pass + mux. (core/render/mux.sh does the same in one
# call; on 2026-10-21 VM restarts killed it mid-write twice, so the
# delivered master was made with these equivalent short steps:
# measure mix.wav, apply to mix_norm.wav, stream-copy mux.)
ffmpeg -y -v error -i "$HERE/out/mix.wav" -af loudnorm=I=-14:TP=-1.2:LRA=11:measured_I=-15.06:measured_TP=-2.66:measured_LRA=19.60:measured_thresh=-26.07:offset=1.22:linear=false -ar 48000 "$HERE/out/mix_norm.wav"
ffmpeg -y -v error -i "$HERE/out/video.mp4" -i "$HERE/out/mix_norm.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "$HERE/out/master.mp4"
# delivery encode: CRT texture wants a light grain tune; CRF 23 (STYLE §9)
ffmpeg -y -v error -i "$HERE/out/master.mp4" -c:v libx264 -crf 23 -preset slow -tune grain -movflags +faststart -c:a copy "$HERE/snow-white.mp4"
.venv/bin/python core/render/srt.py "$HERE/data/cues.json" "$HERE/snow-white.srt"
ffmpeg -y -v error -ss 152 -i "$HERE/snow-white.mp4" -frames:v 1 "$HERE/poster.jpg"
echo "done: $HERE/snow-white.mp4"
