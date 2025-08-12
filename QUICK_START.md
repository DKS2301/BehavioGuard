# 🚀 SecureBank Quick Start Guide

## Prerequisites

- **Node.js 18+** and npm
- **Expo CLI** (`npm install -g @expo/cli`)
- **Mobile device** with Expo Go app installed

## 🛠️ Setup & Installation

### Option 1: Automated Setup (Recommended)
```bash
# Run the automated setup script
./setup.sh
```

### Option 2: Manual Setup
```bash
# 1. Install dependencies
npm install

# 2. Install TensorFlow.js dependencies
npm install react-native-fs@^2.20.0

# 3. Clear Metro cache
npx expo start --clear
```

## 📱 Running the App

### Start Development Server
```bash
npm start
```

### Run on Device
1. **Install Expo Go** on your mobile device
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Scan QR Code**
   - Open Expo Go app
   - Scan the QR code displayed in your terminal
   - The app will load automatically

### Run on Emulator/Simulator
```bash
# iOS Simulator (macOS only)
npm run ios

# Android Emulator
npm run android
```

## 🎯 Test Credentials

Use these credentials to test the app:

- **Email**: `user@securebank.com` (or any email)
- **Password**: `password` (or any password)
- **PIN**: `123456`

## 🔍 Testing Fraud Detection

### Normal Usage (Low Risk)
1. Login with test credentials
2. Enter PIN normally (123456)
3. Navigate through the app normally
4. Check dashboard for "LOW RISK" status

### Simulate High Risk
1. Try entering PIN with unusual timing
2. Make large transactions (>₹50,000)
3. Use app from unusual locations
4. Check security dashboard for alerts

### Test Features
- **PIN Entry**: Real-time fraud detection during PIN entry
- **Transactions**: Risk assessment during money transfers
- **Security Dashboard**: View fraud alerts and risk factors
- **Settings**: Configure security preferences

## 🐛 Troubleshooting

### Common Issues

#### 1. Metro Bundler Issues
```bash
# Clear Metro cache
npx expo start --clear

# Reset cache completely
rm -rf node_modules package-lock.json
npm install
```

#### 2. TensorFlow.js Issues
```bash
# Reinstall TensorFlow dependencies
npm install @tensorflow/tfjs@^4.20.0 @tensorflow/tfjs-react-native@1.0.0 react-native-fs@^2.20.0
```

#### 3. Device Connection Issues
- Ensure device and computer are on same network
- Try using tunnel mode: `expo start --tunnel`
- Check firewall settings

#### 4. Permission Issues
- Grant location permissions when prompted
- Enable biometric authentication if available
- Allow sensor access for fraud detection

### Error Messages

#### "Unable to resolve react-native-fs"
```bash
npm install react-native-fs@^2.20.0
npx expo start --clear
```

#### "TensorFlow initialization failed"
- This is normal during development
- The app will use fallback fraud detection
- Check console for detailed error messages

#### "Location permission denied"
- Grant location permissions in device settings
- Location is used for fraud detection patterns

## 📊 Understanding the App

### Fraud Detection Features
- **Real-time Monitoring**: Continuous behavioral analysis
- **100+ Features**: Motion, touch, timing, location patterns
- **AI Inference**: Neural network risk assessment
- **Risk Levels**: LOW (green), MEDIUM (yellow), HIGH (red)

### Key Screens
1. **Login**: Email/password authentication
2. **PIN Entry**: 6-digit PIN with fraud detection
3. **Dashboard**: Account overview with security status
4. **Transfer**: Money transfer with risk assessment
5. **Transactions**: History with fraud indicators
6. **Security**: Comprehensive security analytics
7. **Settings**: User preferences and configuration

### Behavioral Monitoring
- **Device Motion**: Accelerometer and gyroscope
- **Touch Patterns**: Pressure, duration, area analysis
- **Timing Analysis**: PIN entry and transaction timing
- **Location Tracking**: Geographic pattern analysis
- **Device State**: Battery, network, orientation

## 🔧 Development Commands

```bash
# Start development server
npm start

# Run on specific platform
npm run ios
npm run android
npm run web

# Testing
npm test
npm run lint
npm run typecheck

# Code formatting
npm run format
```

## 📱 App Features

### Banking Features
- ✅ Account balance display
- ✅ Transaction history
- ✅ Money transfers
- ✅ Security settings

### Fraud Detection
- ✅ Real-time behavioral monitoring
- ✅ AI-powered risk assessment
- ✅ Risk-based authentication
- ✅ Fraud alerts and notifications

### Security Features
- ✅ PIN authentication
- ✅ Biometric integration
- ✅ Location tracking
- ✅ Device fingerprinting

## 🚀 Next Steps

1. **Explore the App**: Navigate through all screens
2. **Test Fraud Detection**: Try different behavioral patterns
3. **Review Security Dashboard**: Understand risk factors
4. **Configure Settings**: Adjust security preferences
5. **Test Transactions**: Experience risk-based authentication

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review console logs for error messages
3. Ensure all dependencies are properly installed
4. Try clearing cache and reinstalling

---

**🎉 Enjoy exploring SecureBank with BehaviorGuard AI!**
