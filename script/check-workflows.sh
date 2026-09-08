#!/usr/bin/env bash
set -euo pipefail

# Keep the executable version and release SHA-256 together. CI uses Linux x64.
version='1.7.12'
if command -v actionlint >/dev/null 2>&1; then
  actionlint .github/workflows/*.y*ml
  exit 0
fi
if [[ "$(uname -s)-$(uname -m)" != 'Linux-x86_64' ]]; then
  echo 'Install actionlint to validate workflows on this platform.' >&2
  exit 1
fi
work_dir="$(mktemp -d)"
trap 'rm -rf "$work_dir"' EXIT
archive="actionlint_${version}_linux_amd64.tar.gz"
curl --fail --silent --show-error --location --retry 3 --max-time 60 \
  "https://github.com/rhysd/actionlint/releases/download/v${version}/${archive}" \
  --output "$work_dir/$archive"
(
  cd "$work_dir"
  echo "8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8  $archive" | sha256sum --check --strict
  tar -xzf "$archive" actionlint
)
"$work_dir/actionlint" .github/workflows/*.y*ml
