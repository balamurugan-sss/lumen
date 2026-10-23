#!/bin/sh
# normalize.sh — normalize one video to the hybrid concat target.
# Usage: sh normalize.sh <input> <output>
# Target (demo choice, not a tool limit): 1920x1080, 24 fps, H.264
# yuv420p, AAC 48 kHz stereo, video track timescale 24.
# Assumes the input has an audio stream (generated clips do:
# synthesized sound). Exits non-zero on failure.
set -eu
if [ "$#" -ne 2 ]; then echo "usage: sh normalize.sh <input> <output>" >&2; exit 2; fi
IN="$1"; OUT="$2"
timeout 300 ffmpeg -y -v error -i "$IN" \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=24" \
  -c:v libx264 -preset veryfast -pix_fmt yuv420p -r 24 -video_track_timescale 24 \
  -c:a aac -b:a 128k -ar 48000 -ac 2 \
  -movflags +faststart "$OUT"
