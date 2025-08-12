const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for TensorFlow.js and other native modules
config.resolver.assetExts.push('bin');
config.resolver.sourceExts.push('cjs');

// Handle react-native-fs and other native modules
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configure transformer for better compatibility
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;


