#!/usr/bin/env bash
# Builds the Agensi skill ZIP from skills/<name>/.
#
#   ./skills/build.sh                # builds every skill found
#   ./skills/build.sh podcast-studio # builds one
#
# The ZIP must have SKILL.md at its root (not inside a folder), no __MACOSX,
# no __pycache__, no .DS_Store. Agensi's upload rejects those or counts them.

set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
target="${1:-}"

build_one() {
  local dir="$1"
  local name
  name="$(basename "$dir")"
  local out="$root/$name.zip"

  if [ ! -f "$dir/SKILL.md" ]; then
    echo "skip $name: no SKILL.md at $dir" >&2
    return 1
  fi

  find "$dir" -name '__pycache__' -type d -prune -exec rm -rf {} + 2>/dev/null || true
  find "$dir" -name '.DS_Store' -delete 2>/dev/null || true
  rm -f "$out"

  ( cd "$dir" && zip -r -X "$out" . \
      -x '*/__pycache__/*' -x '*.pyc' -x '*.DS_Store' -x '*/._*' -x '__MACOSX/*' >/dev/null )

  # SKILL.md must sit at the archive root.
  if ! unzip -Z1 "$out" | grep -qx 'SKILL.md'; then
    echo "FAIL $name: SKILL.md is not at the ZIP root" >&2
    return 1
  fi

  echo "$out  $(du -h "$out" | cut -f1)  $(unzip -l "$out" | tail -1 | awk '{print $2}') files"
}

if [ -n "$target" ]; then
  build_one "$root/$target"
else
  status=0
  for dir in "$root"/*/; do
    [ -f "${dir}SKILL.md" ] || continue
    build_one "${dir%/}" || status=1
  done
  exit "$status"
fi
