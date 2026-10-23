#!/bin/sh
# make_card.sh — turn one still image into a silent video segment
# matching the hybrid concat target.
# Usage: sh make_card.sh <image> <output> [duration_seconds, default 2]
# Video: looped still, 1920x1080, 24 fps, H.264 yuv420p.
# Audio: silent stereo AAC at 48 kHz, so concat with clips works.
set -eu
if [ "$#" -lt 2 ] || [ "$#" -gt 3 ]; then echo "usage: sh make_card.sh <image> <output> [duration]" >&2; exit 2; fi
IMG="$1"; OUT="$2"; DUR="${3:-2}"
timeout 300 ffmpeg -y -v error -loop 1 -i "$IMG" -f lavfi -i "anullsrc=r=48000:cl=stereo" \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=24" \
  -c:v libx264 -preset veryfast -pix_fmt yuv420p -r 24 -video_track_timescale 24 \
  -c:a aac -b:a 128k -ar 48000 -ac 2 -t "$DUR" -shortest "$OUT"
