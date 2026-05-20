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
sed -i '' "/^name = \"teams-but-actually-good\"/{n;s/^version = .*/version = \"$VERSION\"/;}" src-tauri/Cargo.lock

BRANCH="release/v$VERSION"

git checkout -b "$BRANCH"
git add src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/tauri.conf.json package.json extension/manifest.json extension/manifest.chrome.json extension/manifest.firefox.json extension/manifest.safari.json
git commit -m "chore: release v$VERSION"
git push origin "$BRANCH"

gh pr create --title "chore: release v$VERSION" --body "Release v$VERSION" --base main --head "$BRANCH"
gh pr checks --watch
gh pr merge --merge --delete-branch

git checkout main
git pull origin main
git tag "v$VERSION"
git push origin "v$VERSION"