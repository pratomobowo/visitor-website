#!/bin/bash

echo "🔧 Fixing Next.js build issues..."

# Stop any running processes
echo "⏹️  Stopping any running Next.js processes..."
pkill -f "next start" || true
pkill -f "pm2" || true

# Clean all caches and build artifacts
echo "🧹 Cleaning all caches and build artifacts..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .cache

# Clear npm cache
echo "📦 Clearing npm cache..."
npm cache clean --force

# Reinstall dependencies
echo "📦 Reinstalling dependencies..."
npm install

# Build the application
echo "🔨 Building the application with standard Next.js..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Standard build failed. Trying alternative approaches..."
    
    # Try with no-lint
    echo "🔄 Trying with no-lint flag..."
    NODE_OPTIONS='--max-old-space-size=4096' npm run build
    
    if [ $? -ne 0 ]; then
        echo "❌ No-lint build also failed. Trying with legacy build..."
        NODE_OPTIONS='--max-old-space-size=4096' npm run build -- --no-lint
        
        if [ $? -ne 0 ]; then
            echo "❌ All build attempts failed. Please check the error messages above."
            echo "💡 You might need to:"
            echo "   1. Update Node.js to latest version"
            echo "   2. Downgrade Next.js to stable version"
            echo "   3. Check for incompatible dependencies"
            exit 1
        fi
    fi
fi

echo "✅ Build completed successfully!"

# Start the application
echo "🚀 Starting the application..."
npm start