#!/bin/bash

# Exit on error
set -e

echo "🔧 Installing dependencies..."
npm install

echo "🚀 Starting Expo app..."
npx expo start
