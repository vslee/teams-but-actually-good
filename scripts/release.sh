#!/bin/bash

set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: ./scripts/release.sh <version>"
  exit 1
fi

sed -i '' "s/^version = .*/version = \"$VERSION\"/" src-tauri/Cargo.toml
sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" src-tauri/tauri.conf.json
sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package.json

git add src-tauri/Cargo.toml src-tauri/tauri.conf.json package.json
git commit -m "chore: release v$VERSION"
git tag "v$VERSION"
git push origin main "v$VERSION"