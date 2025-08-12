#!/bin/bash

echo "🚀 Setting up SecureBank - AI-Powered Banking App"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Install Expo CLI globally if not installed
if ! command -v expo &> /dev/null; then
    echo "📦 Installing Expo CLI globally..."
    npm install -g @expo/cli
fi

echo "✅ Expo CLI version: $(expo --version)"

# Clean install dependencies
echo "📦 Installing dependencies..."
rm -rf node_modules package-lock.json
npm install

# Install specific TensorFlow.js dependencies
echo "🤖 Installing TensorFlow.js dependencies..."
npm install react-native-fs@^2.20.0

# Clear Metro cache
echo "🧹 Clearing Metro cache..."
npx expo start --clear

echo ""
echo "✅ Setup complete! You can now run the app with:"
echo "   npm start"
echo ""
echo "📱 To run on device:"
echo "   1. Install Expo Go on your mobile device"
echo "   2. Scan the QR code that appears"
echo "   3. The app will load with fraud detection features"
echo ""
echo "🔧 Development commands:"
echo "   npm start          - Start development server"
echo "   npm run android    - Run on Android emulator"
echo "   npm run ios        - Run on iOS simulator"
echo "   npm test           - Run tests"
echo "   npm run lint       - Run linting"
echo ""
echo "🎯 Test Credentials:"
echo "   Email: any email"
echo "   Password: any password"
echo "   PIN: 123456"
echo ""
echo "🚀 SecureBank is ready to run!"
