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
sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" extension/manifest.json
sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" extension/manifest.chrome.json
sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" extension/manifest.firefox.json
sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" extension/manifest.safari.json

git add src-tauri/Cargo.toml src-tauri/tauri.conf.json package.json extension/manifest.json extension/manifest.chrome.json extension/manifest.firefox.json extension/manifest.safari.json
git commit -m "chore: release v$VERSION"
git tag "v$VERSION"
git push origin main "v$VERSION"