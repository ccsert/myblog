#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source_dir="$repo_root/public/game/signal-archive/characters/archivist/source"
runtime_dir="$repo_root/public/game/signal-archive/characters/archivist/runtime"

command -v ffmpeg >/dev/null 2>&1 || {
  echo "ffmpeg is required" >&2
  exit 1
}

mkdir -p "$runtime_dir"

normalize_sprite() {
  local source_file="$1"
  local output_file="$runtime_dir/$(basename "$source_file")"
  local crop_box

  crop_box="$({
    ffmpeg -hide_banner -i "$source_file" -vf "alphaextract,bbox" -f null - 2>&1 || true
  } | sed -n 's/.*crop=\([^ ]*\).*/\1/p' | tail -n 1)"

  if [[ -z "$crop_box" ]]; then
    echo "Could not detect visible bounds for $source_file" >&2
    exit 1
  fi

  ffmpeg -loglevel error -y \
    -i "$source_file" \
    -vf "crop=$crop_box,scale=48:80:force_original_aspect_ratio=decrease:flags=neighbor,format=rgba,pad=64:96:(ow-iw)/2:92-ih:color=0x00000000" \
    "$output_file"
}

while IFS= read -r source_file; do
  normalize_sprite "$source_file"
done < <(find "$source_dir" -maxdepth 1 -type f -name '*.png' | sort)

echo "Normalized sprites written to $runtime_dir"
