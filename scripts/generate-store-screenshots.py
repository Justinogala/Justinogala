#!/usr/bin/env python3
"""
Generate store screenshots for Play Store and App Store submissions.
Uses Playwright to capture app screenshots at required device sizes.

Usage:
  pip install playwright
  playwright install chromium
  python3 scripts/generate-store-screenshots.py --url https://your-app-url.com
"""
import argparse
import asyncio
import os

SCREENSHOTS_DIR = "/app/store-assets/screenshots"

# Device configurations for store screenshots
DEVICES = {
    "android-phone": {"width": 1080, "height": 1920, "scale": 2},
    "ios-iphone-6_7": {"width": 1290, "height": 2796, "scale": 3},
    "ios-iphone-6_5": {"width": 1284, "height": 2778, "scale": 3},
}

# Pages to screenshot (path, name, login_required)
PAGES = [
    ("/login", "01-login", False),
    ("/dashboard", "02-dashboard", True),
    ("/messages", "03-ai-chat", True),
    ("/dochub?tab=pdf-editor", "04-pdf-editor", True),
    ("/dochub?tab=converter", "05-file-converter", True),
    ("/workspaces", "06-workspaces", True),
    ("/settings", "07-settings", True),
]

async def generate_screenshots(base_url: str):
    from playwright.async_api import async_playwright
    
    os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        
        for device_name, viewport in DEVICES.items():
            device_dir = os.path.join(SCREENSHOTS_DIR, device_name)
            os.makedirs(device_dir, exist_ok=True)
            
            context = await browser.new_context(
                viewport={"width": viewport["width"] // viewport["scale"],
                          "height": viewport["height"] // viewport["scale"]},
                device_scale_factor=viewport["scale"],
            )
            page = await context.new_page()
            
            # Accept cookies
            await page.goto(f"{base_url}/login")
            await page.wait_for_timeout(2000)
            try:
                btn = page.locator('[data-testid="cookie-accept-btn"]')
                if await btn.is_visible(timeout=2000):
                    await btn.click()
                    await page.wait_for_timeout(500)
            except:
                pass
            
            # Login for authenticated pages
            logged_in = False
            
            for path, name, needs_login in PAGES:
                if needs_login and not logged_in:
                    await page.goto(f"{base_url}/login")
                    await page.wait_for_timeout(1000)
                    await page.fill('input[type="email"]', 'orgadmin@munal.com')
                    await page.fill('input[type="password"]', 'OrgAdmin@123')
                    await page.click('button[type="submit"]')
                    await page.wait_for_timeout(3000)
                    # Skip onboarding if shown
                    try:
                        skip = page.locator('button:has-text("Skip")')
                        if await skip.is_visible(timeout=1000):
                            await skip.click()
                    except:
                        pass
                    logged_in = True
                
                await page.goto(f"{base_url}{path}")
                await page.wait_for_timeout(2000)
                
                screenshot_path = os.path.join(device_dir, f"{name}.png")
                await page.screenshot(path=screenshot_path, full_page=False)
                print(f"  [{device_name}] {name} -> {screenshot_path}")
            
            await context.close()
            print(f"Completed {device_name}")
        
        await browser.close()
    
    print(f"\nAll screenshots saved to: {SCREENSHOTS_DIR}/")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate store screenshots")
    parser.add_argument("--url", default="https://munal.ai", help="Base URL of the app")
    args = parser.parse_args()
    
    asyncio.run(generate_screenshots(args.url))
