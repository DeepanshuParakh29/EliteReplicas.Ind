#!/bin/bash
set -e

echo "🚀 Starting production deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Build the application
echo "🔨 Building application..."
npm run build

# Run database migrations if needed
echo "🔄 Running database migrations..."
npm run db:push

echo "✅ Build completed successfully!"
echo "🚀 Starting the application..."

# Start the application
npm start
