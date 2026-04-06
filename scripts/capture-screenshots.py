#!/usr/bin/env python3
"""Capture real app screenshots for Play Store using local Playwright."""
import asyncio
from playwright.async_api import async_playwright

APP_URL = "https://munal-system-updates.preview.emergentagent.com"
RAW_DIR = "/app/store-assets/screenshots/raw"

import os
os.makedirs(RAW_DIR, exist_ok=True)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox'])
        context = await browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=3,  # 3x = 1170x2532 output
        )
        page = await context.new_page()
        
        # 1. Landing page
        print("Capturing landing page...")
        await page.goto(APP_URL, wait_until="networkidle")
        await page.wait_for_timeout(2000)
        # Accept cookies
        try:
            btn = page.locator("button:has-text('Accept')")
            if await btn.is_visible(timeout=2000):
                await btn.click()
                await page.wait_for_timeout(500)
        except:
            pass
        await page.screenshot(path=f"{RAW_DIR}/01-landing.png")
        print(f"  Saved 01-landing.png")
        
        # 2. Login page
        print("Capturing login page...")
        await page.goto(f"{APP_URL}/login", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        try:
            btn = page.locator("button:has-text('Accept')")
            if await btn.is_visible(timeout=1000):
                await btn.click()
                await page.wait_for_timeout(500)
        except:
            pass
        await page.screenshot(path=f"{RAW_DIR}/02-login.png")
        print(f"  Saved 02-login.png")
        
        # 3. Login
        print("Logging in...")
        await page.fill('input[type="email"]', 'orgadmin@munal.com')
        await page.fill('input[type="password"]', 'OrgAdmin@123')
        await page.click('button:has-text("Sign In")')
        await page.wait_for_timeout(4000)
        
        # Dismiss onboarding modal
        try:
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(500)
        except:
            pass
        
        # Dashboard
        print("Capturing dashboard...")
        await page.screenshot(path=f"{RAW_DIR}/03-dashboard.png")
        print(f"  Saved 03-dashboard.png")
        
        # 4. AI Chat - use sidebar navigation
        print("Navigating to AI Chat...")
        # Open sidebar on mobile
        try:
            menu_btn = page.locator("button svg.lucide-menu, button svg.lucide-align-justify, [data-testid='sidebar-toggle'], button[aria-label*='menu']").first
            if await menu_btn.is_visible(timeout=2000):
                await menu_btn.click()
                await page.wait_for_timeout(1000)
        except:
            pass
        
        # Click AI Chat in sidebar
        try:
            ai_link = page.locator("a[href='/ai-chat'], a:has-text('AI Chat')").first
            if await ai_link.is_visible(timeout=2000):
                await ai_link.click()
                await page.wait_for_timeout(3000)
        except:
            # Fallback: use pushState
            await page.evaluate("window.history.pushState({}, '', '/ai-chat')")
            await page.wait_for_timeout(1000)
            await page.reload()
            await page.wait_for_timeout(3000)
        
        await page.screenshot(path=f"{RAW_DIR}/04-aichat.png")
        print(f"  Saved 04-aichat.png")
        
        # 5. DocHub
        print("Navigating to DocHub...")
        try:
            menu_btn = page.locator("button svg.lucide-menu, button svg.lucide-align-justify, [data-testid='sidebar-toggle'], button[aria-label*='menu']").first
            if await menu_btn.is_visible(timeout=2000):
                await menu_btn.click()
                await page.wait_for_timeout(1000)
        except:
            pass
        
        try:
            dochub_link = page.locator("a[href='/dochub'], a:has-text('DocHub'), a:has-text('Document')").first
            if await dochub_link.is_visible(timeout=2000):
                await dochub_link.click()
                await page.wait_for_timeout(3000)
        except:
            pass
        
        await page.screenshot(path=f"{RAW_DIR}/05-dochub.png")
        print(f"  Saved 05-dochub.png")
        
        # 6. Converter tab
        print("Switching to Converter tab...")
        try:
            converter_tab = page.locator("button:has-text('Converter'), [data-testid*='converter']").first
            if await converter_tab.is_visible(timeout=2000):
                await converter_tab.click()
                await page.wait_for_timeout(2000)
        except:
            pass
        
        await page.screenshot(path=f"{RAW_DIR}/06-converter.png")
        print(f"  Saved 06-converter.png")
        
        # 7. Settings
        print("Navigating to Settings...")
        try:
            menu_btn = page.locator("button svg.lucide-menu, button svg.lucide-align-justify, [data-testid='sidebar-toggle'], button[aria-label*='menu']").first
            if await menu_btn.is_visible(timeout=2000):
                await menu_btn.click()
                await page.wait_for_timeout(1000)
        except:
            pass
        
        try:
            settings_link = page.locator("a[href='/settings'], a:has-text('Settings')").first
            if await settings_link.is_visible(timeout=2000):
                await settings_link.click()
                await page.wait_for_timeout(3000)
        except:
            pass
        
        await page.screenshot(path=f"{RAW_DIR}/07-settings.png")
        print(f"  Saved 07-settings.png")
        
        await browser.close()
        
        # Verify files
        print("\nFiles created:")
        for f in sorted(os.listdir(RAW_DIR)):
            fpath = os.path.join(RAW_DIR, f)
            from PIL import Image
            img = Image.open(fpath)
            print(f"  {f}: {img.size}")

asyncio.run(main())
