#!/usr/bin/env python3
"""Generate all required app icons and splash screens for Android and iOS."""
import os
import io
from PIL import Image, ImageDraw, ImageFont
import cairosvg

# Paths
BASE_DIR = "/app"
ANDROID_RES = f"{BASE_DIR}/android/app/src/main/res"
IOS_ASSETS = f"{BASE_DIR}/ios/App/App/Assets.xcassets"
STORE_ASSETS = f"{BASE_DIR}/store-assets"
os.makedirs(STORE_ASSETS, exist_ok=True)

# ── Generate base icon from SVG ──
SVG_ICON = """<svg width="1024" height="1024" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="purple_gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#9333EA"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="0" fill="url(#purple_gradient)"/>
  <path d="M140 380V130H195L256 290L317 130H372V380H317V220L270 340H242L195 220V380H140Z" fill="white"/>
</svg>"""

SVG_ICON_ROUNDED = """<svg width="1024" height="1024" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="purple_gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#9333EA"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#purple_gradient)"/>
  <path d="M140 380V130H195L256 290L317 130H372V380H317V220L270 340H242L195 220V380H140Z" fill="white"/>
</svg>"""

# Foreground only (for adaptive icons) - M on transparent background
SVG_FOREGROUND = """<svg width="1024" height="1024" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M140 380V130H195L256 290L317 130H372V380H317V220L270 340H242L195 220V380H140Z" fill="white"/>
</svg>"""

def svg_to_png(svg_str, size):
    """Convert SVG to PNG at given size."""
    png_data = cairosvg.svg2png(bytestring=svg_str.encode(), output_width=size, output_height=size)
    return Image.open(io.BytesIO(png_data))

def save_resized(img, path, size):
    """Resize and save image."""
    resized = img.resize((size, size), Image.LANCZOS)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    resized.save(path, "PNG")
    print(f"  Created: {path} ({size}x{size})")

# ── Generate base images at 1024x1024 ──
print("Generating base icons...")
icon_square = svg_to_png(SVG_ICON, 1024)
icon_rounded = svg_to_png(SVG_ICON_ROUNDED, 1024)
icon_foreground = svg_to_png(SVG_FOREGROUND, 1024)

# ── Android Icons ──
print("\n=== Android Icons ===")

# Launcher icons (mipmap)
ANDROID_MIPMAP_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

for folder, size in ANDROID_MIPMAP_SIZES.items():
    save_resized(icon_square, f"{ANDROID_RES}/{folder}/ic_launcher.png", size)
    save_resized(icon_rounded, f"{ANDROID_RES}/{folder}/ic_launcher_round.png", size)
    save_resized(icon_foreground, f"{ANDROID_RES}/{folder}/ic_launcher_foreground.png", size)

# Store icon (512x512)
save_resized(icon_square, f"{STORE_ASSETS}/android-icon-512.png", 512)

# ── Android Splash Screens ──
print("\n=== Android Splash Screens ===")

def create_splash(width, height, path):
    """Create a branded splash screen."""
    splash = Image.new('RGBA', (width, height), (26, 16, 37, 255))  # #1a1025
    # Center the icon
    icon_size = min(width, height) // 4
    icon = icon_rounded.resize((icon_size, icon_size), Image.LANCZOS)
    x = (width - icon_size) // 2
    y = (height - icon_size) // 2 - icon_size // 4
    splash.paste(icon, (x, y), icon)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    splash.save(path, "PNG")
    print(f"  Created: {path} ({width}x{height})")

SPLASH_SIZES = {
    "drawable-port-mdpi": (320, 480),
    "drawable-port-hdpi": (480, 800),
    "drawable-port-xhdpi": (720, 1280),
    "drawable-port-xxhdpi": (960, 1600),
    "drawable-port-xxxhdpi": (1280, 1920),
    "drawable-land-mdpi": (480, 320),
    "drawable-land-hdpi": (800, 480),
    "drawable-land-xhdpi": (1280, 720),
    "drawable-land-xxhdpi": (1600, 960),
    "drawable-land-xxxhdpi": (1920, 1280),
    "drawable": (480, 800),
}

for folder, (w, h) in SPLASH_SIZES.items():
    create_splash(w, h, f"{ANDROID_RES}/{folder}/splash.png")

# ── iOS Icons ──
print("\n=== iOS Icons ===")
ios_icon_dir = f"{IOS_ASSETS}/AppIcon.appiconset"
os.makedirs(ios_icon_dir, exist_ok=True)

# iOS requires a 1024x1024 icon (no transparency, no rounded corners - iOS adds them)
save_resized(icon_square, f"{ios_icon_dir}/AppIcon-512@2x.png", 1024)

# ── iOS Splash Screens ──
print("\n=== iOS Splash Screens ===")
ios_splash_dir = f"{IOS_ASSETS}/Splash.imageset"
os.makedirs(ios_splash_dir, exist_ok=True)

for i, size in enumerate([1242, 2048, 2732]):
    create_splash(size, size, f"{ios_splash_dir}/splash-{size}x{size}{'-' + str(i) if i else ''}.png")

# ── Store Assets ──
print("\n=== Store Assets ===")

# Play Store feature graphic (1024x500)
feature = Image.new('RGBA', (1024, 500), (0, 0, 0, 0))
# Gradient background
for y in range(500):
    for x in range(1024):
        r = int(124 + (79-124) * x/1024)
        g = int(58 + (70-58) * x/1024)
        b = int(237 + (229-237) * x/1024)
        feature.putpixel((x, y), (r, g, b, 255))
# Add icon
feat_icon = icon_rounded.resize((200, 200), Image.LANCZOS)
feature.paste(feat_icon, (80, 150), feat_icon)
# Save
feature.save(f"{STORE_ASSETS}/feature-graphic-1024x500.png", "PNG")
print(f"  Created: {STORE_ASSETS}/feature-graphic-1024x500.png (1024x500)")

# Hi-res icon for Play Store
save_resized(icon_square, f"{STORE_ASSETS}/play-store-icon-512.png", 512)
save_resized(icon_square, f"{STORE_ASSETS}/app-store-icon-1024.png", 1024)

print("\n=== Done! ===")
print(f"Store assets saved to: {STORE_ASSETS}/")
