#!/bin/bash

echo "🧪 Testing SecureBank App"
echo "========================="

# Check if app is running
if pgrep -f "expo start" > /dev/null; then
    echo "✅ Expo development server is running"
else
    echo "❌ Expo development server is not running"
    echo "   Run: npm start"
    exit 1
fi

# Check if Metro bundler is accessible
if curl -s http://localhost:8081 > /dev/null; then
    echo "✅ Metro bundler is accessible"
else
    echo "❌ Metro bundler is not accessible"
    echo "   Check if the app is running properly"
    exit 1
fi

echo ""
echo "📱 App Status: READY"
echo ""
echo "🎯 Next Steps:"
echo "1. Install Expo Go on your mobile device"
echo "2. Scan the QR code from the terminal"
echo "3. Test the app with these credentials:"
echo "   - Email: user@securebank.com"
echo "   - Password: password"
echo "   - PIN: 123456"
echo ""
echo "🔍 Test Features:"
echo "• Login and PIN entry"
echo "• Dashboard with fraud detection"
echo "• Transfer screen with risk assessment"
echo "• Security dashboard"
echo "• Settings and configuration"
echo ""
echo "🚀 SecureBank is ready for testing!"
