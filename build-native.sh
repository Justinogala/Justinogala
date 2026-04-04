#!/bin/bash
# ─── Munal AI — Native Mobile Build Script ───
# This script builds the web app and syncs it to native platforms.
# Run on a machine with Node.js 18+ and Android SDK / Xcode installed.

set -e

echo "🔨 Munal AI — Native Build Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Build web assets
echo -e "\n${GREEN}[1/4]${NC} Building web assets..."
npm run build
echo -e "${GREEN}✓${NC} Web build complete → ./dist/"

# Step 2: Sync to native projects
echo -e "\n${GREEN}[2/4]${NC} Syncing Capacitor..."
npx cap sync
echo -e "${GREEN}✓${NC} Native projects synced"

# Step 3: Build Android (if ANDROID_HOME is set)
if [ -n "$ANDROID_HOME" ]; then
    echo -e "\n${GREEN}[3/4]${NC} Building Android APK..."
    cd android
    
    if [ "$1" = "--release" ]; then
        echo "Building release APK..."
        ./gradlew assembleRelease
        APK_PATH="app/build/outputs/apk/release/app-release.apk"
        echo -e "${GREEN}✓${NC} Release APK: android/$APK_PATH"
    else
        echo "Building debug APK..."
        ./gradlew assembleDebug
        APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
        echo -e "${GREEN}✓${NC} Debug APK: android/$APK_PATH"
    fi
    
    cd ..
else
    echo -e "\n${YELLOW}[3/4]${NC} Skipping Android build (ANDROID_HOME not set)"
    echo "  Install Android Studio and set ANDROID_HOME to build APK"
fi

# Step 4: iOS info
if [ "$(uname)" = "Darwin" ]; then
    echo -e "\n${GREEN}[4/4]${NC} Opening Xcode for iOS build..."
    npx cap open ios
else
    echo -e "\n${YELLOW}[4/4]${NC} Skipping iOS (requires macOS + Xcode)"
fi

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Build complete!${NC}"
echo ""
echo "Next steps:"
echo "  • Android: Install APK on device/emulator"
echo "  • iOS: Open Xcode and run on simulator/device"
echo "  • For Play Store: ./build-native.sh --release"
