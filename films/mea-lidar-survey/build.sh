#!/bin/sh
# One command: KHẢO SÁT MEA (LiDAR Survey, 40 s, no narration)
#   sh build.sh            data, events, picture, score+mix, master, poster, checks
# Run from anywhere; LIB must point at the lemo-opuscar library root.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=mea-lidar-survey
cd "$LIB"

# data: deterministic point cloud from Mea's inventory (data/inventory.json;
# regenerate the inventory itself with the measuring script described in FACTS.md)
"$PY" "$HERE/data/build_data.py"

# events from the page, then the synthesized score + mix
node core/render/events.mjs "$HERE"
"$PY" "$HERE/mix.py"

# picture (SS=1: this machine renders WebGL on CPU; 2x supersampling is
# available with --q 'ss=2' on a GPU machine). Uses the project's own
# tools/render.mjs: core video.mjs has a fixed 30 s screenshot timeout
# that shared-CPU spikes exceed on this VM; the local driver keeps the
# same page contract/output but retries frames and resumes from
# out/frames/ after an interruption.
node "$HERE/tools/render.mjs" "$HERE" --fps 24 --q 'ss=1'

# master: mux + loudnorm to -14 LUFS, then a delivery encode (dense point
# detail: CRF 26 looks the same on the points and keeps the file small)
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/out/master.mp4" 24 0
ffmpeg -v error -y -i "$HERE/out/master.mp4" -map 0 -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -c:a copy -movflags +faststart "$HERE/$NAME.mp4"

# poster: the signature shot (first reading over the condensed surface)
ffmpeg -v error -y -ss 29.0 -i "$HERE/$NAME.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"

# checks
node core/render/readcheck.mjs "$HERE" --step 0.25 --q 'ss=1' | tail -3
echo "done: $HERE/$NAME.mp4"
