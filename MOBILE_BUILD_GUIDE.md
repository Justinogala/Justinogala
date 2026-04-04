# Munal AI — Mobile App Build Guide

## Prerequisites

### All Platforms
- Node.js 18+ and npm
- Capacitor CLI: `npm install -g @capacitor/cli`

### Android
- [Android Studio](https://developer.android.com/studio) with:
  - Android SDK (API 33+)
  - Android SDK Build-Tools
  - Android SDK Platform-Tools
- Set `ANDROID_HOME` environment variable
- Java 17+ (bundled with Android Studio)

### iOS (macOS only)
- Xcode 15+
- CocoaPods: `sudo gem install cocoapods`
- Apple Developer Account (for device testing/distribution)

---

## Quick Build

```bash
# 1. Build web assets
npm run build

# 2. Sync to native projects
npx cap sync

# 3a. Android — Debug APK
cd android && ./gradlew assembleDebug
# APK at: android/app/build/outputs/apk/debug/app-debug.apk

# 3b. iOS — Open in Xcode
npx cap open ios
```

Or use the build script:
```bash
chmod +x build-native.sh
./build-native.sh          # Debug build
./build-native.sh --release # Release build
```

---

## Android: Step-by-Step

### Debug Build (for testing)
```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```
Install on device: `adb install app/build/outputs/apk/debug/app-debug.apk`

### Release Build (for Play Store)

1. **Generate signing key** (one-time):
```bash
keytool -genkey -v -keystore munal-release.keystore -alias munal \
  -keyalg RSA -keysize 2048 -validity 10000
```

2. **Configure signing** in `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('munal-release.keystore')
            storePassword 'YOUR_STORE_PASSWORD'
            keyAlias 'munal'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

3. **Build signed APK / AAB**:
```bash
./gradlew assembleRelease  # APK
./gradlew bundleRelease     # AAB (preferred for Play Store)
```

4. **Upload to Play Store**: Go to [Google Play Console](https://play.google.com/console) → Create app → Upload AAB

---

## iOS: Step-by-Step

### Development Build
```bash
npm run build
npx cap sync ios
npx cap open ios
```
In Xcode: Select your device → Run (Cmd+R)

### App Store Release

1. In Xcode: Product → Archive
2. Distribute App → App Store Connect
3. Go to [App Store Connect](https://appstoreconnect.apple.com) → Submit for review

---

## Firebase Push Notifications Setup

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project → Enable Cloud Messaging

### Step 2: Android
1. Download `google-services.json` from Firebase
2. Place it in `android/app/google-services.json`
3. The Capacitor push plugin handles the rest

### Step 3: iOS
1. Download `GoogleService-Info.plist` from Firebase
2. Place it in `ios/App/App/GoogleService-Info.plist`
3. Enable Push Notifications capability in Xcode

### Step 4: Backend
1. Get your FCM Server Key from Firebase Console → Project Settings → Cloud Messaging
2. Add to `backend/.env`:
```
FCM_SERVER_KEY=your_fcm_server_key_here
```

---

## Capacitor Configuration

The app is configured in `capacitor.config.ts`:

| Setting | Value |
|---------|-------|
| App ID | `com.munal.ai` |
| App Name | `Munal AI` |
| Web Dir | `dist` |
| Android Scheme | `https` |
| iOS Scheme | `https` |
| Splash Color | `#1a1025` |
| Spinner Color | `#7C3AED` |

### Updating Server URL for Production
In `capacitor.config.ts`, uncomment and set your production URL:
```ts
server: {
    url: 'https://your-production-url.com',
}
```

---

## Troubleshooting

### Android: "SDK not found"
Set `ANDROID_HOME` in your shell profile:
```bash
export ANDROID_HOME=$HOME/Android/Sdk  # Linux
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
```

### iOS: CocoaPods errors
```bash
cd ios/App && pod install --repo-update
```

### White screen on device
- Check the server URL in `capacitor.config.ts`
- For development, use your computer's local IP (not localhost)
- For production, ensure the URL is publicly accessible

### Push notifications not working
1. Verify `google-services.json` / `GoogleService-Info.plist` are in place
2. Check that `FCM_SERVER_KEY` is set in backend `.env`
3. Test with: `curl -X POST /api/push/register-device` with a test token
