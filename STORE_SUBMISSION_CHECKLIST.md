# Munal AI — App Store Submission Checklist

## Pre-Submission Checklist

### Code & Build
- [ ] Production API URL set in `capacitor.config.ts`
- [ ] All debug/development flags disabled
- [ ] Web build successful (`npm run build`)
- [ ] Capacitor sync successful (`npx cap sync`)
- [ ] No console.log statements in production code (or use ProGuard to strip)

### App Icons & Assets
- [x] Android launcher icons (mdpi through xxxhdpi)
- [x] Android adaptive icons (foreground + background)
- [x] Android splash screens (portrait + landscape, all densities)
- [x] iOS app icon (1024x1024)
- [x] iOS splash screens
- [x] Play Store feature graphic (1024x500)
- [ ] Screenshots for all required device sizes (see below)

### Security
- [x] Network security config (HTTPS enforced)
- [x] App Transport Security (iOS — no arbitrary loads)
- [x] ProGuard enabled for release builds
- [x] Keystore configured for signing (instructions provided)

### Privacy & Permissions
- [x] Camera usage description (iOS Info.plist)
- [x] Photo library usage description (iOS Info.plist)
- [x] Microphone usage description (iOS Info.plist)
- [x] Android permissions declared (camera, storage, notifications)
- [ ] Privacy policy published at https://munal.ai/legal/privacy
- [ ] Terms of service published at https://munal.ai/legal/terms

### Push Notifications
- [ ] Firebase project created
- [ ] `google-services.json` placed in `android/app/`
- [ ] `GoogleService-Info.plist` placed in `ios/App/App/`
- [ ] FCM_SERVER_KEY added to backend `.env`
- [ ] APNs key uploaded to Firebase for iOS push

---

## Google Play Store Submission

### Step 1: Create Developer Account
1. Go to [Google Play Console](https://play.google.com/console)
2. Pay one-time $25 registration fee
3. Complete identity verification

### Step 2: Create App Listing
1. Click "Create app"
2. Fill in:
   - App name: **Munal AI**
   - Default language: English (United States)
   - App or Game: **App**
   - Free or Paid: **Free**
3. Accept declarations

### Step 3: Store Listing
1. **Short description** (80 chars max):
   > AI-powered meeting companion — transcribe, summarize, and collaborate intelligently.

2. **Full description** (4000 chars max):
   > See `store-assets/store-listing.json` for the full description

3. **Graphics**:
   - App icon: Upload `store-assets/play-store-icon-512.png`
   - Feature graphic: Upload `store-assets/feature-graphic-1024x500.png`
   - Screenshots: Upload at least 2 phone screenshots (see section below)

4. **Categorization**:
   - Category: **Productivity**
   - Tags: Meeting, AI, Notes, Transcription

### Step 4: Content Rating
1. Fill out the IARC questionnaire
2. Expected rating: **Everyone**
3. No violent content, no user-generated content requiring moderation

### Step 5: App Pricing & Distribution
1. Free
2. Select countries (recommend: All countries)
3. Accept distribution agreement

### Step 6: Data Safety
1. **Data collected**: Email, name, organization info, meeting data
2. **Data shared**: No data shared with third parties
3. **Security practices**: Data encrypted in transit (HTTPS), user can request deletion
4. **Privacy policy URL**: https://munal.ai/legal/privacy

### Step 7: Build & Upload
```bash
# Generate signed AAB (preferred for Play Store)
cd /app
npm run build
npx cap sync android
cd android

# Debug build (for testing)
./gradlew assembleDebug

# Release build (for Play Store)
# First, uncomment signingConfig in build.gradle and configure keystore
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### Step 8: Submit for Review
1. Upload AAB to "Production" track (or "Internal testing" first)
2. Complete all sections (all green checkmarks)
3. Click "Submit for review"
4. Expected review time: 1-3 days (first submission may take up to 7 days)

---

## Apple App Store Submission

### Step 1: Enroll in Apple Developer Program
1. Go to [Apple Developer](https://developer.apple.com/programs/)
2. Pay annual $99 fee
3. Complete enrollment (may take 24-48 hours)

### Step 2: Configure Xcode Project
1. Open in Xcode: `npx cap open ios`
2. Select your team in "Signing & Capabilities"
3. Set bundle identifier: `com.munal.ai`
4. Set version: 1.0.0, build: 1
5. Add capabilities:
   - Push Notifications
   - Associated Domains (add `applinks:munal.ai`)
   - Background Modes: Remote notifications

### Step 3: App Store Connect Setup
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+"  → "New App"
3. Fill in:
   - Platform: iOS
   - Name: **Munal AI**
   - Primary language: English (U.S.)
   - Bundle ID: `com.munal.ai`
   - SKU: `munal-ai-001`

### Step 4: App Information
1. **Subtitle**: Your AI Meeting Companion
2. **Category**: Productivity
3. **Secondary Category**: Business
4. **Privacy Policy URL**: https://munal.ai/legal/privacy
5. **Age Rating**: 4+ (no objectionable content)

### Step 5: App Privacy (Nutrition Labels)
Data types to declare:
- **Contact Info** (Email, Name) — Used for app functionality, account creation
- **Usage Data** (Meeting transcriptions, documents) — Used for app functionality
- **Identifiers** (User ID) — Used for app functionality

Data NOT collected:
- Location data
- Financial info
- Health & fitness data
- Browsing history

### Step 6: Screenshots
Required sizes:
- **iPhone 6.7"** (1290 × 2796): iPhone 16 Pro Max, 15 Pro Max
- **iPhone 6.5"** (1284 × 2778): iPhone 15 Plus, 14 Plus
- **iPad 12.9"** (2048 × 2732): Required if supporting iPad

Recommended screenshots (5-8):
1. Landing/Login screen
2. Dashboard with meetings
3. AI Chat in action
4. Document Hub (PDF Editor)
5. File Converter
6. Workspace collaboration
7. Settings/Security (2FA)

### Step 7: Build & Upload
```bash
# Build web assets
npm run build
npx cap sync ios

# Open in Xcode
npx cap open ios

# In Xcode:
# 1. Select "Any iOS Device" as build target
# 2. Product → Archive
# 3. Window → Organizer → Distribute App
# 4. Choose "App Store Connect" → Upload
```

### Step 8: Submit for Review
1. Go to App Store Connect → Your app
2. Select the uploaded build
3. Fill in "What's New" text
4. Add screenshots for all required sizes
5. Answer export compliance (No encryption other than HTTPS → choose "No")
6. Submit for review
7. Expected review time: 1-2 days

---

## Taking Screenshots

### Recommended Tool: Playwright (Automated)
```bash
# Install Playwright
pip install playwright
playwright install chromium

# Run screenshot script
python3 scripts/generate-store-screenshots.py
```

### Manual Method
1. Open the app in Chrome DevTools
2. Toggle device toolbar (Ctrl+Shift+M)
3. Set to required viewport sizes
4. Take high-quality screenshots

### Screenshot Sizes Quick Reference

| Platform | Device | Size (px) |
|----------|--------|-----------|
| Android | Phone | 1080 × 1920 (recommended) |
| Android | Tablet 7" | 1200 × 1920 |
| Android | Tablet 10" | 1600 × 2560 |
| iOS | iPhone 6.7" | 1290 × 2796 |
| iOS | iPhone 6.5" | 1284 × 2778 |
| iOS | iPad 12.9" | 2048 × 2732 |

---

## Post-Submission

### After Approval
- [ ] Verify app is live in stores
- [ ] Test download and install on real devices
- [ ] Verify push notifications work
- [ ] Monitor crash reports (Firebase Crashlytics recommended)
- [ ] Set up Google Play Console alerts

### Version Updates
1. Increment `versionCode` (Android) or `CURRENT_PROJECT_VERSION` (iOS)
2. Update `versionName` / `MARKETING_VERSION`
3. Build → Upload → Submit for review
4. Add "What's New" release notes

### Common Rejection Reasons & How to Avoid
| Issue | Solution |
|-------|----------|
| Privacy policy missing/inaccessible | Ensure URL is live and accessible |
| Crash on launch | Test on multiple devices/OS versions |
| Incomplete metadata | Fill ALL required fields |
| Broken links | Test all deep links and URLs |
| Missing permission descriptions (iOS) | All usage descriptions in Info.plist |
| Login required but no demo | Add demo credentials in review notes |
| Background activity without purpose | Only declare needed background modes |

### Review Notes (include with submission)
```
Demo Account for Testing:
Email: orgadmin@munal.com
Password: OrgAdmin@123

Key features to test:
1. Login → Dashboard → View meetings
2. AI Chat → Ask a question
3. DocHub → PDF Editor → Upload and annotate PDF
4. DocHub → File Converter → Convert a file
5. Settings → Enable 2FA
```
