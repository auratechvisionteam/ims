#!/bin/bash
set -e

echo "🔧 Installing dependencies..."
npm install

echo "📁 Creating necessary directories..."
mkdir -p uploads/complaints

echo "🗄️ Initializing database..."
node scripts/init-db.js

echo "✅ Build complete!"
