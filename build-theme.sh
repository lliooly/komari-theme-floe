#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "Building Floe Komari theme package..."

for command_name in node npm jq zip unzip; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Error: required command not found: $command_name" >&2
    exit 1
  fi
done

npm ci --no-audit --no-fund
npm run build

test -f preview.png
test -f komari-theme.json
test -d dist
test -f dist/index.html
jq empty komari-theme.json

manifest_version="$(jq -r '.version // empty' komari-theme.json)"
manifest_short="$(jq -r '.short // empty' komari-theme.json)"
manifest_url="$(jq -r '.url // empty' komari-theme.json)"
manifest_configuration_type="$(jq -r '.configuration.type // empty' komari-theme.json)"
manifest_configuration_data="$(jq -r '.configuration.data // empty' komari-theme.json)"

[[ "$manifest_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || {
  echo "Error: komari-theme.json version must be MAJOR.MINOR.PATCH" >&2
  exit 1
}
test "$manifest_short" = "floe"
test "$manifest_url" = "https://github.com/lliooly/komari-theme-floe"
test "$manifest_configuration_type" = "raw"
grep -Fq '/settings?embedded=1' <<<"$manifest_configuration_data"

package_dir="$(mktemp -d "${TMPDIR:-/tmp}/floe-theme.XXXXXX")"
trap 'rm -rf "$package_dir"' EXIT

cp preview.png komari-theme.json "$package_dir/"
cp -R dist "$package_dir/"
rm -f dist-release.zip
(
  cd "$package_dir"
  zip -qr "$ROOT_DIR/dist-release.zip" .
)

unzip -tq dist-release.zip
unzip -Z1 dist-release.zip | grep -Fxq "komari-theme.json"
unzip -Z1 dist-release.zip | grep -Fxq "preview.png"
unzip -Z1 dist-release.zip | grep -q '^dist/'

if command -v sha256sum >/dev/null 2>&1; then
  sha256sum dist-release.zip
else
  shasum -a 256 dist-release.zip
fi

echo "Floe theme package created: $ROOT_DIR/dist-release.zip"
