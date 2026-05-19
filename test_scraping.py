"""
Web Scraping Feasibility Test
==============================

Tests if we can successfully scrape device pricing from carrier websites.

Run this script to validate:
1. Can we access the websites?
2. Can we extract pricing data?
3. Are there anti-bot protections?
4. How reliable is the scraping?

Usage:
    python test_scraping.py
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, Optional
import sys

# Check if playwright is installed
try:
    from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
except ImportError:
    print("❌ Playwright not installed!")
    print("📦 Install with: pip install playwright")
    print("📦 Then run: playwright install chromium")
    sys.exit(1)

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("❌ BeautifulSoup not installed!")
    print("📦 Install with: pip install beautifulsoup4")
    sys.exit(1)


class CarrierScraperTest:
    """Test scraping capabilities for carrier websites"""
    
    def __init__(self):
        self.results = {
            "test_time": datetime.now().isoformat(),
            "carriers": {}
        }
    
    async def test_verizon(self) -> Dict:
        """Test scraping Verizon website"""
        print("\n🔴 Testing Verizon...")
        
        carrier_result = {
            "carrier": "Verizon",
            "url": None,
            "success": False,
            "data": {},
            "errors": [],
            "notes": []
        }
        
        try:
            async with async_playwright() as p:
                # Launch browser
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                )
                page = await context.new_page()
                
                # Try to access Verizon's smartphone section
                test_urls = [
                    "https://www.verizon.com/smartphones/",
                    "https://www.verizon.com/smartphones/apple-iphone-15-pro/",
                ]
                
                for url in test_urls:
                    try:
                        carrier_result["url"] = url
                        print(f"   📍 Visiting: {url}")
                        
                        # Navigate
                        response = await page.goto(url, wait_until='domcontentloaded', timeout=15000)
                        
                        if response.status == 200:
                            print(f"   ✅ Page loaded successfully (Status: {response.status})")
                            carrier_result["notes"].append(f"Successfully loaded {url}")
                            
                            # Wait a bit for dynamic content
                            await page.wait_for_timeout(2000)
                            
                            # Get page content
                            html = await page.content()
                            soup = BeautifulSoup(html, 'html.parser')
                            
                            # Try to find common price selectors
                            price_selectors = [
                                {'selector': '[data-testid*="price"]', 'type': 'css'},
                                {'selector': '.price', 'type': 'css'},
                                {'selector': '[class*="Price"]', 'type': 'css'},
                                {'selector': 'span:contains("$")', 'type': 'text'}
                            ]
                            
                            found_prices = []
                            for sel in price_selectors:
                                if sel['type'] == 'css':
                                    elements = soup.select(sel['selector'])
                                    if elements:
                                        for elem in elements[:3]:  # First 3 matches
                                            text = elem.get_text(strip=True)
                                            if '$' in text:
                                                found_prices.append({
                                                    'selector': sel['selector'],
                                                    'text': text
                                                })
                            
                            if found_prices:
                                carrier_result["data"]["prices_found"] = found_prices
                                carrier_result["success"] = True
                                print(f"   💰 Found {len(found_prices)} price elements!")
                                for price in found_prices[:3]:
                                    print(f"      - {price['text']}")
                            else:
                                carrier_result["notes"].append("No prices found with common selectors")
                                print(f"   ⚠️  No prices found")
                            
                            # Check for images
                            images = soup.find_all('img', src=True)
                            device_images = [
                                img['src'] for img in images 
                                if 'device' in img.get('src', '').lower() 
                                or 'phone' in img.get('src', '').lower()
                                or 'iphone' in img.get('src', '').lower()
                            ]
                            
                            if device_images:
                                carrier_result["data"]["images_found"] = device_images[:3]
                                print(f"   📸 Found {len(device_images)} device images!")
                            
                            # Take screenshot for manual review
                            screenshot_path = f"test_verizon_{datetime.now().strftime('%H%M%S')}.png"
                            await page.screenshot(path=screenshot_path)
                            carrier_result["screenshot"] = screenshot_path
                            print(f"   📷 Screenshot saved: {screenshot_path}")
                            
                            break  # Success, no need to try other URLs
                        
                        else:
                            print(f"   ❌ HTTP {response.status}")
                            carrier_result["errors"].append(f"HTTP {response.status}")
                    
                    except PlaywrightTimeout:
                        print(f"   ⏱️  Timeout loading page")
                        carrier_result["errors"].append("Timeout")
                    except Exception as e:
                        print(f"   ❌ Error: {str(e)}")
                        carrier_result["errors"].append(str(e))
                
                await browser.close()
        
        except Exception as e:
            carrier_result["errors"].append(f"Browser error: {str(e)}")
            print(f"   ❌ Fatal error: {str(e)}")
        
        return carrier_result
    
    async def test_att(self) -> Dict:
        """Test scraping AT&T website"""
        print("\n🔵 Testing AT&T...")
        
        carrier_result = {
            "carrier": "AT&T",
            "url": None,
            "success": False,
            "data": {},
            "errors": [],
            "notes": []
        }
        
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                )
                page = await context.new_page()
                
                test_urls = [
                    "https://www.att.com/buy/phones/",
                ]
                
                for url in test_urls:
                    try:
                        carrier_result["url"] = url
                        print(f"   📍 Visiting: {url}")
                        
                        response = await page.goto(url, wait_until='domcontentloaded', timeout=15000)
                        
                        if response.status == 200:
                            print(f"   ✅ Page loaded successfully")
                            carrier_result["notes"].append("Successfully loaded page")
                            
                            await page.wait_for_timeout(2000)
                            html = await page.content()
                            soup = BeautifulSoup(html, 'html.parser')
                            
                            # Look for prices
                            text_content = soup.get_text()
                            price_count = text_content.count('$')
                            
                            if price_count > 0:
                                carrier_result["data"]["price_symbols_found"] = price_count
                                carrier_result["success"] = True
                                print(f"   💰 Found {price_count} price indicators")
                            
                            # Screenshot
                            screenshot_path = f"test_att_{datetime.now().strftime('%H%M%S')}.png"
                            await page.screenshot(path=screenshot_path)
                            carrier_result["screenshot"] = screenshot_path
                            print(f"   📷 Screenshot saved: {screenshot_path}")
                            
                            break
                    
                    except Exception as e:
                        print(f"   ❌ Error: {str(e)}")
                        carrier_result["errors"].append(str(e))
                
                await browser.close()
        
        except Exception as e:
            carrier_result["errors"].append(f"Browser error: {str(e)}")
            print(f"   ❌ Fatal error: {str(e)}")
        
        return carrier_result
    
    async def test_tmobile(self) -> Dict:
        """Test scraping T-Mobile website"""
        print("\n🟣 Testing T-Mobile...")
        
        carrier_result = {
            "carrier": "T-Mobile",
            "url": None,
            "success": False,
            "data": {},
            "errors": [],
            "notes": []
        }
        
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                )
                page = await context.new_page()
                
                test_urls = [
                    "https://www.t-mobile.com/cell-phones",
                ]
                
                for url in test_urls:
                    try:
                        carrier_result["url"] = url
                        print(f"   📍 Visiting: {url}")
                        
                        response = await page.goto(url, wait_until='domcontentloaded', timeout=15000)
                        
                        if response.status == 200:
                            print(f"   ✅ Page loaded successfully")
                            carrier_result["notes"].append("Successfully loaded page")
                            
                            await page.wait_for_timeout(2000)
                            html = await page.content()
                            soup = BeautifulSoup(html, 'html.parser')
                            
                            # Look for prices
                            text_content = soup.get_text()
                            price_count = text_content.count('$')
                            
                            if price_count > 0:
                                carrier_result["data"]["price_symbols_found"] = price_count
                                carrier_result["success"] = True
                                print(f"   💰 Found {price_count} price indicators")
                            
                            # Screenshot
                            screenshot_path = f"test_tmobile_{datetime.now().strftime('%H%M%S')}.png"
                            await page.screenshot(path=screenshot_path)
                            carrier_result["screenshot"] = screenshot_path
                            print(f"   📷 Screenshot saved: {screenshot_path}")
                            
                            break
                    
                    except Exception as e:
                        print(f"   ❌ Error: {str(e)}")
                        carrier_result["errors"].append(str(e))
                
                await browser.close()
        
        except Exception as e:
            carrier_result["errors"].append(f"Browser error: {str(e)}")
            print(f"   ❌ Fatal error: {str(e)}")
        
        return carrier_result
    
    async def run_all_tests(self):
        """Run tests for all carriers"""
        print("=" * 60)
        print("🧪 WEB SCRAPING FEASIBILITY TEST")
        print("=" * 60)
        print("\nTesting ability to scrape carrier websites...")
        print("This will take ~30-60 seconds\n")
        
        # Test all carriers
        verizon_result = await self.test_verizon()
        att_result = await self.test_att()
        tmobile_result = await self.test_tmobile()
        
        self.results["carriers"] = {
            "verizon": verizon_result,
            "att": att_result,
            "tmobile": tmobile_result
        }
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 RESULTS SUMMARY")
        print("=" * 60)
        
        success_count = sum(1 for r in self.results["carriers"].values() if r["success"])
        total_count = len(self.results["carriers"])
        
        print(f"\n✅ Successful: {success_count}/{total_count} carriers")
        
        for carrier_name, result in self.results["carriers"].items():
            status = "✅ SUCCESS" if result["success"] else "❌ FAILED"
            print(f"\n{status} - {result['carrier']}")
            print(f"   URL: {result['url']}")
            
            if result["data"]:
                print(f"   Data extracted:")
                for key, value in result["data"].items():
                    if isinstance(value, list):
                        print(f"      - {key}: {len(value)} items")
                    else:
                        print(f"      - {key}: {value}")
            
            if result["errors"]:
                print(f"   Errors: {', '.join(result['errors'])}")
            
            if "screenshot" in result:
                print(f"   Screenshot: {result['screenshot']}")
        
        # Save results to JSON
        results_file = f"scraping_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(results_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n💾 Full results saved to: {results_file}")
        
        # Recommendations
        print("\n" + "=" * 60)
        print("💡 RECOMMENDATIONS")
        print("=" * 60)
        
        if success_count == total_count:
            print("\n✅ ALL CARRIERS ACCESSIBLE!")
            print("   Recommendation: Proceed with web scraping implementation")
            print("   Next steps:")
            print("   1. Build proper scrapers with error handling")
            print("   2. Implement caching layer")
            print("   3. Add monitoring for scraper health")
        elif success_count > 0:
            print(f"\n⚠️  PARTIAL SUCCESS ({success_count}/{total_count})")
            print("   Recommendation: Proceed with hybrid approach")
            print("   - Use scraping for accessible carriers")
            print("   - Use mock data for blocked carriers")
            print("   - Investigate anti-bot measures for failed carriers")
        else:
            print("\n❌ NO CARRIERS ACCESSIBLE")
            print("   Recommendation: Start with mock data only")
            print("   Reasons for failure:")
            for result in self.results["carriers"].values():
                if result["errors"]:
                    print(f"   - {result['carrier']}: {result['errors'][0]}")
            print("\n   Alternative approaches:")
            print("   1. Use mock data for Phase 1 POC")
            print("   2. Research official APIs or third-party services")
            print("   3. Consider partnerships with carriers")
        
        print("\n" + "=" * 60)
        print("🏁 TEST COMPLETE")
        print("=" * 60)
        print("\nReview the screenshots to see what data is available.")
        print("Check the JSON file for detailed results.\n")
        
        return self.results


async def main():
    """Main test runner"""
    tester = CarrierScraperTest()
    await tester.run_all_tests()


if __name__ == "__main__":
    print("🚀 Starting Web Scraping Feasibility Test...\n")
    print("Prerequisites:")
    print("  ✓ Playwright installed: pip install playwright")
    print("  ✓ Browser installed: playwright install chromium")
    print("  ✓ BeautifulSoup: pip install beautifulsoup4")
    print("\n")
    
    asyncio.run(main())
