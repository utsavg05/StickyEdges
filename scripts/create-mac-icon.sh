#!/usr/bin/env bash
set -euo pipefail

source_icon="public/tray-icon.png"
output_dir=".icon-build"
iconset_dir="${output_dir}/app-icon.iconset"

if [[ ! -f "${source_icon}" ]]; then
  echo "Missing ${source_icon}; cannot create the macOS application icon." >&2
  exit 1
fi

rm -rf "${iconset_dir}"
mkdir -p "${iconset_dir}"

for size in 16 32 128 256 512; do
  sips -z "${size}" "${size}" "${source_icon}" --out "${iconset_dir}/icon_${size}x${size}.png" >/dev/null
  double_size=$((size * 2))
  sips -z "${double_size}" "${double_size}" "${source_icon}" --out "${iconset_dir}/icon_${size}x${size}@2x.png" >/dev/null
done

iconutil -c icns "${iconset_dir}" -o "${output_dir}/app-icon.icns"
echo "Created ${output_dir}/app-icon.icns"
