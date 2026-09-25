#!/usr/bin/env bash
# Encodes the sponsored story-ad media (src/lib/webStories/storyAds.ts) for the
# web: 9:16 portrait, 720x1280 H.264 (CRF 28, faststart so playback starts
# before the whole file downloads), 64 kbps mono AAC, plus a first-frame JPEG
# poster; the image ad becomes a 1080x1920 WebP. Needs ffmpeg.
#
#   scripts/compress-story-ads.sh <timeless-video> <faithful-to-nature-video> <youthology-image>
#
# Writes to public/stories-media/ads/ with the exact names storyAds.ts expects.
set -euo pipefail

if [ "$#" -ne 3 ]; then
  echo "usage: $0 <timeless-video> <faithful-to-nature-video> <youthology-image>" >&2
  exit 1
fi
command -v ffmpeg >/dev/null || { echo "ffmpeg is required" >&2; exit 1; }

OUT="$(cd "$(dirname "$0")/.." && pwd)/public/stories-media/ads"
mkdir -p "$OUT"

# Scale to cover 720x1280, then centre-crop, so any source aspect fills the story frame.
FILL_720='scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1'
FILL_1080='scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1'

encode_video() {
  local src="$1" name="$2"
  ffmpeg -y -loglevel error -i "$src" -t 60 \
    -vf "$FILL_720,fps=30" -c:v libx264 -preset slow -crf 28 -profile:v high -pix_fmt yuv420p \
    -c:a aac -b:a 64k -ac 1 -movflags +faststart "$OUT/$name.mp4"
  ffmpeg -y -loglevel error -ss 0.5 -i "$OUT/$name.mp4" -frames:v 1 -q:v 5 "$OUT/$name-poster.jpg"
}

encode_video "$1" timeless-skin
encode_video "$2" faithful-to-nature
ffmpeg -y -loglevel error -i "$3" -vf "$FILL_1080" -c:v libwebp -quality 80 "$OUT/youthology.webp"

ls -lh "$OUT"
