#!/bin/bash

echo "🔄 Downgrading from React 19 to React 18..."

# Stop any running dev server
echo "Stopping development server..."
pkill -f "next dev" || true

# Remove React 19 compatibility patch
echo "Removing React 19 patch..."
npm uninstall @ant-design/v5-patch-for-react-19

# Downgrade React packages
echo "Downgrading React packages..."
npm install react@^18.3.1 react-dom@^18.3.1

# Update React types
echo "Updating TypeScript types..."
npm install --save-dev @types/react@^18.3.0 @types/react-dom@^18.3.0

# Clean cache
echo "Cleaning cache..."
rm -rf .next
rm -rf node_modules/.cache

echo "✅ Downgrade complete! Please update your code:"
echo "1. Remove the import '@ant-design/v5-patch-for-react-19' from app/providers.tsx"
echo "2. Remove getValueProps and normalize from DatePicker/TimePicker in BasicSessionInfo.tsx"
echo "3. Run 'npm run dev' to start the server"