#!/bin/bash

VERSION=$1  # ex: ./scripts/release.sh 1.2.0

sed -i '' "s/^version = .*/version = \"$VERSION\"/" src-tauri/Cargo.toml

sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" src-tauri/tauri.conf.json

# Commit + tag
git add src-tauri/Cargo.tom src-tauri/tauri.conf.json
git commit -m "chore: release v$VERSION"
git tag "v$VERSION"
git push origin main "v$VERSION"