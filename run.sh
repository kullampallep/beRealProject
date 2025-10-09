#!/usr/bin/env bash
set -e
echo "Installing dependencies..."
npm install --legacy-peer-deps
echo "Starting Expo..."
npx expo start
