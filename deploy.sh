#!/bin/bash

echo "🚀 Starting deployment process..."

# Pull latest changes
echo "📥 Pulling latest changes from repository..."
git pull origin main

# Check if pull was successful
if [ $? -ne 0 ]; then
    echo "❌ Failed to pull changes. Please check for conflicts."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Clean build cache
echo "🧹 Cleaning build cache..."
rm -rf .next

# Build the application
echo "🔨 Building the application..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi

# Restart the application (using PM2)
echo "🔄 Restarting application..."
if command -v pm2 &> /dev/null; then
    pm2 restart visitor-counter
else
    echo "⚠️  PM2 not found. Please restart your application manually."
fi

# Display deployment status
echo "✅ Deployment completed successfully!"
echo "🌐 Your application should be running now."

# Display log for debugging
echo ""
echo "📋 Recent commits:"
git log --oneline -5

echo ""
echo "🔍 If you're still experiencing issues, please check:"
echo "   - Browser cache (try Ctrl+F5 or incognito mode)"
echo "   - Server logs: pm2 logs visitor-counter"
echo "   - Environment variables in .env.local"