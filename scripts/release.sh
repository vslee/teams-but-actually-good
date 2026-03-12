#!/bin/bash

VERSION=$1  # ex: ./scripts/release.sh 1.2.0

# Met à jour Cargo.toml
sed -i '' "s/^version = .*/version = \"$VERSION\"/" src-tauri/Cargo.toml

# Commit + tag
git add src-tauri/Cargo.toml
git commit -m "chore: release v$VERSION"
git tag "v$VERSION"
git push origin main --tags