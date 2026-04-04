# Store Screenshots

Placeholder screenshots are in place at the correct sizes for all device categories.

## How to Replace with Real Screenshots

### Option 1: Automated (Recommended)
Run the screenshot generation script against your production URL:

```bash
pip install playwright
playwright install chromium
python3 scripts/generate-store-screenshots.py --url https://munal.ai
```

This will capture all 7 screens at all 3 device sizes automatically.

### Option 2: Manual
1. Open your production app in Chrome
2. Open DevTools → Toggle device toolbar (Ctrl+Shift+M)
3. Set the viewport to each required size
4. Navigate to each screen and take a screenshot

## Screenshot Sizes

| Directory | Device | Viewport Size |
|-----------|--------|---------------|
| `android-phone/` | Android Phone | 1080 x 1920 |
| `ios-iphone-6_7/` | iPhone 16 Pro Max | 1290 x 2796 |
| `ios-iphone-6_5/` | iPhone 15 Plus | 1284 x 2778 |

## Screenshots Required (7 per device)

| File | Screen | Notes |
|------|--------|-------|
| `01-landing.png` | Landing page | Hero section, value proposition |
| `02-login.png` | Login page | Clean, branded login |
| `03-dashboard.png` | Dashboard | Key metrics, meetings overview |
| `04-ai-chat.png` | AI Chat | Show conversation in action |
| `05-dochub.png` | Document Hub | eSignature/PDF Editor tabs |
| `06-converter.png` | File Converter | Conversion options grid |
| `07-settings.png` | Settings | Profile, 2FA, preferences |
