#!/usr/bin/env bash
set -euo pipefail

docker compose up -d --build db cache ctfd

outfile="/tmp/ctfd_home.html"

deadline=$((SECONDS+180))
while true; do
  if curl -fsSL http://localhost:8000/ >"$outfile"; then
    break
  fi
  if [ $SECONDS -gt $deadline ]; then
    echo "CTFd did not start in time"
    exit 1
  fi
  sleep 2
done

grep -q 'data-theme="win95"' "$outfile"
grep -q 'win95.css' "$outfile"

echo "Smoke test passed"
