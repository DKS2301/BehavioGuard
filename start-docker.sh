#!/bin/bash

# Force unset CI to enable interactive features like QR codes
unset CI
export CI=""

# Set environment variables for Docker networking
# Use the actual host IP address that your phone can reach
export REACT_NATIVE_PACKAGER_HOSTNAME=192.168.42.54
export REACT_NATIVE_PACKAGER_PORT=8081

# Start Expo directly with the binary to avoid npm script issues
exec npx expo start --lan --no-dev --minify
