#!/bin/bash
# ─── Generate Android Release Keystore for Munal AI ───
# Run this on a machine with Java JDK installed.
# The generated keystore is required to sign release APKs/AABs for Play Store.

set -e

KEYSTORE_FILE="android/munal-release.keystore"
KEY_ALIAS="munal"
VALIDITY_DAYS=10000  # ~27 years

echo "======================================"
echo "  Munal AI — Release Keystore Setup"
echo "======================================"
echo ""

# Check if keytool is available
if ! command -v keytool &> /dev/null; then
    echo "ERROR: keytool not found. Install Java JDK first."
    echo "  macOS:   brew install openjdk"
    echo "  Ubuntu:  sudo apt install default-jdk"
    echo "  Windows: Install from https://adoptium.net/"
    exit 1
fi

# Check if keystore already exists
if [ -f "$KEYSTORE_FILE" ]; then
    echo "WARNING: Keystore already exists at $KEYSTORE_FILE"
    read -p "Overwrite? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
fi

echo "Generating release keystore..."
echo ""
echo "IMPORTANT: Remember the passwords you enter!"
echo "You will need them for every release build."
echo ""

keytool -genkey -v \
    -keystore "$KEYSTORE_FILE" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity "$VALIDITY_DAYS" \
    -dname "CN=Munal AI, OU=Mobile, O=Munal AI, L=Toronto, ST=Ontario, C=CA"

echo ""
echo "======================================"
echo "  Keystore generated successfully!"
echo "======================================"
echo ""
echo "Location: $KEYSTORE_FILE"
echo "Alias:    $KEY_ALIAS"
echo ""
echo "Next steps:"
echo "1. Create keystore.properties (see template below)"
echo "2. Uncomment signingConfig in android/app/build.gradle"
echo "3. Build release: ./gradlew bundleRelease"
echo ""
echo "keystore.properties template:"
echo "  storeFile=munal-release.keystore"
echo "  storePassword=YOUR_STORE_PASSWORD"
echo "  keyAlias=munal"
echo "  keyPassword=YOUR_KEY_PASSWORD"
echo ""
echo "KEEP THIS KEYSTORE SAFE! If you lose it, you cannot"
echo "update your app on the Play Store."
