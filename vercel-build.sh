#!/bin/bash
set -e

# Build the Vite frontend
BASE_PATH=/ pnpm --filter @workspace/donghua-stream run build

# Copy output to root dist/ where Vercel expects it
mkdir -p dist
cp -r artifacts/donghua-stream/dist/. dist/
