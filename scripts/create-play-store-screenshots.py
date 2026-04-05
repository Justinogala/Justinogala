#!/usr/bin/env python3
"""Generate professional Play Store screenshots with text overlays."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

OUTPUT_DIR = "/app/store-assets/screenshots/android-phone"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Final dimensions for Play Store (9:16 ratio, 1080x1920)
FINAL_W, FINAL_H = 1080, 1920

# Screenshot configs: (filename, source, headline, sub_headline, gradient_colors)
RAW_DIR = "/app/store-assets/screenshots/raw"
SCREENSHOTS = [
    ("01-landing.png", f"{RAW_DIR}/01-landing.png", 
     "Your AI-Powered\nWorkforce Platform", "Manage, collaborate, and scale your team",
     [(106, 27, 154), (79, 70, 229)]),
    ("02-login.png", f"{RAW_DIR}/02-login.png",
     "Secure Access\nAnytime, Anywhere", "Enterprise-grade login with 2FA protection",
     [(79, 70, 229), (59, 130, 246)]),
    ("03-dashboard.png", f"{RAW_DIR}/03-dashboard.png",
     "Smart Dashboard\nAt a Glance", "Meetings, workspaces, and insights in one view",
     [(16, 185, 129), (6, 148, 120)]),
    ("04-aichat.png", f"{RAW_DIR}/04-aichat.png",
     "AI Chat Assistant\nBuilt In", "Get instant answers, summaries, and code help",
     [(139, 92, 246), (109, 40, 217)]),
    ("05-dochub.png", f"{RAW_DIR}/05-dochub.png",
     "Document Hub\nAll-in-One", "eSignatures, PDF editing, and file conversion",
     [(234, 88, 12), (220, 38, 38)]),
    ("06-converter.png", f"{RAW_DIR}/06-converter.png",
     "Convert Any File\nInstantly", "PDF, Word, Excel, PPTX, Images, eBooks and more",
     [(6, 148, 120), (16, 185, 129)]),
    ("07-settings.png", f"{RAW_DIR}/07-settings.png",
     "Full Control Over\nYour Account", "Privacy, security, notifications — all customizable",
     [(79, 70, 229), (106, 27, 154)]),
]

def create_gradient(width, height, color1, color2):
    """Create a vertical gradient image."""
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)
    for y in range(height):
        ratio = y / height
        r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
        g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
        b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    return img

def create_screenshot(filename, source_path, headline, sub_headline, gradient_colors):
    """Create a single promotional screenshot."""
    # Create gradient background
    bg = create_gradient(FINAL_W, FINAL_H, gradient_colors[0], gradient_colors[1])
    draw = ImageDraw.Draw(bg)
    
    # Load and resize the app screenshot
    if os.path.exists(source_path):
        screenshot = Image.open(source_path)
    else:
        print(f"  SKIP: {source_path} not found")
        return
    
    # Calculate screenshot placement (centered, bottom portion)
    # Phone screen area: ~85% of width, starting at ~35% from top
    phone_w = int(FINAL_W * 0.82)
    phone_h = int(phone_w * (screenshot.height / screenshot.width))
    
    # Cap the phone height
    max_phone_h = int(FINAL_H * 0.62)
    if phone_h > max_phone_h:
        phone_h = max_phone_h
        phone_w = int(phone_h * (screenshot.width / screenshot.height))
    
    screenshot = screenshot.resize((phone_w, phone_h), Image.LANCZOS)
    
    # Add rounded corners to screenshot
    mask = Image.new('L', (phone_w, phone_h), 0)
    mask_draw = ImageDraw.Draw(mask)
    radius = 30
    mask_draw.rounded_rectangle([0, 0, phone_w, phone_h], radius=radius, fill=255)
    
    # Add shadow
    shadow_offset = 15
    shadow = Image.new('RGBA', (phone_w + shadow_offset * 2, phone_h + shadow_offset * 2), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle(
        [shadow_offset, shadow_offset, phone_w + shadow_offset, phone_h + shadow_offset],
        radius=radius, fill=(0, 0, 0, 80)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=12))
    
    # Position screenshot
    x_pos = (FINAL_W - phone_w) // 2
    y_pos = FINAL_H - phone_h - 60  # 60px from bottom
    
    # Paste shadow then screenshot
    bg.paste(shadow.convert('RGB'), (x_pos - shadow_offset, y_pos - shadow_offset), shadow.split()[-1])
    bg.paste(screenshot, (x_pos, y_pos), mask)
    
    # Add text
    # Try to use a good font, fallback to default
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]
    font_path = None
    for fp in font_paths:
        if os.path.exists(fp):
            font_path = fp
            break
    
    if font_path:
        title_font = ImageFont.truetype(font_path, 64)
        sub_font = ImageFont.truetype(font_path.replace("Bold", "Regular"), 32)
    else:
        title_font = ImageFont.load_default()
        sub_font = ImageFont.load_default()
    
    # Draw headline text (centered, with shadow)
    title_y = 80
    for i, line in enumerate(headline.split("\n")):
        bbox = draw.textbbox((0, 0), line, font=title_font)
        text_w = bbox[2] - bbox[0]
        text_x = (FINAL_W - text_w) // 2
        line_y = title_y + i * 80
        # Text shadow
        draw.text((text_x + 2, line_y + 2), line, fill=(0, 0, 0, 60), font=title_font)
        draw.text((text_x, line_y), line, fill="white", font=title_font)
    
    # Draw sub-headline
    sub_y = title_y + len(headline.split("\n")) * 80 + 20
    bbox = draw.textbbox((0, 0), sub_headline, font=sub_font)
    sub_w = bbox[2] - bbox[0]
    
    # Word wrap if too wide
    if sub_w > FINAL_W - 80:
        words = sub_headline.split()
        mid = len(words) // 2
        line1 = " ".join(words[:mid])
        line2 = " ".join(words[mid:])
        for j, sub_line in enumerate([line1, line2]):
            bbox = draw.textbbox((0, 0), sub_line, font=sub_font)
            sw = bbox[2] - bbox[0]
            sx = (FINAL_W - sw) // 2
            draw.text((sx, sub_y + j * 40), sub_line, fill=(255, 255, 255, 200), font=sub_font)
    else:
        sx = (FINAL_W - sub_w) // 2
        draw.text((sx, sub_y), sub_headline, fill=(255, 255, 255, 200), font=sub_font)
    
    # Save
    output_path = os.path.join(OUTPUT_DIR, filename)
    bg.save(output_path, "PNG", optimize=True)
    print(f"  Created: {output_path} ({bg.size})")

# Generate all screenshots
print("Generating Play Store screenshots...")
for config in SCREENSHOTS:
    print(f"Processing: {config[0]}")
    create_screenshot(*config)

# Also create tablet screenshots (7-inch and 10-inch) by padding phone screenshots
TABLET_7_DIR = "/app/store-assets/screenshots/tablet-7"
TABLET_10_DIR = "/app/store-assets/screenshots/tablet-10"
os.makedirs(TABLET_7_DIR, exist_ok=True)
os.makedirs(TABLET_10_DIR, exist_ok=True)

def create_tablet_screenshot(phone_path, tablet_path, tablet_w, tablet_h):
    """Create tablet screenshot by centering phone screenshot on gradient background."""
    if not os.path.exists(phone_path):
        return
    phone_img = Image.open(phone_path)
    # Create gradient bg
    bg = create_gradient(tablet_w, tablet_h, (26, 16, 37), (45, 25, 75))
    # Resize phone screenshot to fit
    scale = min(tablet_h * 0.85 / phone_img.height, tablet_w * 0.55 / phone_img.width)
    new_w = int(phone_img.width * scale)
    new_h = int(phone_img.height * scale)
    resized = phone_img.resize((new_w, new_h), Image.LANCZOS)
    x = (tablet_w - new_w) // 2
    y = (tablet_h - new_h) // 2
    bg.paste(resized, (x, y))
    bg.save(tablet_path, "PNG")
    print(f"  Tablet: {tablet_path}")

print("\nGenerating tablet screenshots...")
for config in SCREENSHOTS:
    fname = config[0]
    phone_path = os.path.join(OUTPUT_DIR, fname)
    create_tablet_screenshot(phone_path, os.path.join(TABLET_7_DIR, fname), 1080, 1920)
    create_tablet_screenshot(phone_path, os.path.join(TABLET_10_DIR, fname), 1200, 1920)

print("\nDone! All screenshots generated.")
