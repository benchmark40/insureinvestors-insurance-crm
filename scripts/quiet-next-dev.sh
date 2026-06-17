#!/usr/bin/env bash
# Wraps `next dev` to silence the known-bad lockfile-patcher noise that fires
# when Next.js invokes yarn to patch SWC native modules into the lockfile.
# Yarn chokes on bun's `packageManager` spec and prints a huge stack each time.
# None of it is fatal — the dev server still runs — but it drowns out real logs.
#
# Usage: quiet-next-dev.sh <port>
# Filter only matches lines that are clearly part of the yarn-spam blob.

set -euo pipefail

PORT="${1:-3000}"

next dev --port "$PORT" 2>&1 | grep --line-buffered -v -E \
  -e '"packageManager":' \
  -e 'Corepack must currently be enabled' \
  -e 'Presence of the "packageManager" field' \
  -e 'Found lockfile missing swc dependencies' \
  -e 'Failed to (patch lockfile|get registry from)' \
  -e 'Command failed: yarn config get registry' \
  -e '^\[Error: ' \
  -e '^\s*\[cause\]:' \
  -e '^\s*(status|signal|output|pid|stdout|stderr):' \
  -e '^\s*<Buffer ' \
  -e '^\s*null,\s*$' \
  -e '^\s*\],?\s*$' \
  -e '^\s*\},?\s*$' \
  -e 'error This project'\''s package.json defines' \
  -e 'For more information, check out https://yarnpkg.com'
