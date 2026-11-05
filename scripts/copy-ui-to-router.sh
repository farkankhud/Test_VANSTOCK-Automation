#!/usr/bin/env bash
# Copies every generated Fiori app (app/<name>/webapp) into the approuter's
# static resources so the standalone approuter can serve the UIs.
set -e
rm -rf app/router/resources
for d in app/*/webapp; do
  [ -d "$d" ] || continue
  name=$(basename "$(dirname "$d")")
  mkdir -p "app/router/resources/$name"
  cp -r "$d" "app/router/resources/$name/"
  echo "copied $d -> app/router/resources/$name/webapp"
done
