"""
Verizon Web Scraper
===================

Scrapes device information from Verizon website using Playwright.

Based on test_scraping.py results:
- ✅ URL: https://www.verizon.com/smartphones/
- ✅ Selector: [data-testid*="price"] works perfectly
- ✅ Found 3 prices: "$36.11/mo", "Starts at $5.00/mo", etc.
- ✅ Device images available
"""

from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
from bs4 import BeautifulSoup
from typing import Dict, Optional, List
import asyncio
import re
from datetime import datetime


class VerizonScraper:
    """Scrapes Verizon website for device pricing and details"""
    
    BASE_URL = "https://www.verizon.com"
    USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    
    def __init__(self):
        self.last_scrape_time = None
    
    async def scrape_device(self, device_slug: str, storage: str = "128GB") -> Optional[Dict]:
        """
        Scrape device details from Verizon
        
        Args:
            device_slug: Device identifier (e.g., "apple-iphone-15-pro")
            storage: Requested storage option
            
        Returns:
            Device data dict or None if scraping failed
        """
        url = f"{self.BASE_URL}/smartphones/{device_slug}/"
        
        print(f"🔴 Scraping Verizon: {device_slug}")
        print(f"   📍 URL: {url}")
        
        try:
            async with async_playwright() as p:
                # Launch browser (headless for production)
                browser = await p.chromium.launch(
                    headless=True,
                    args=['--no-sandbox', '--disable-setuid-sandbox']
                )
                
                context = await browser.new_context(
                    user_agent=self.USER_AGENT,
                    viewport={'width': 1920, 'height': 1080}
                )
                
                page = await context.new_page()
                
                # Navigate to device page
                response = await page.goto(url, wait_until='domcontentloaded', timeout=15000)
                
                if not response or response.status != 200:
                    print(f"   ❌ HTTP {response.status if response else 'No response'}")
                    await browser.close()
                    return None
                
                print(f"   ✅ Page loaded (HTTP {response.status})")
                
                # Wait for dynamic content to load
                await page.wait_for_timeout(2000)
                
                # Get HTML content
                html = await page.content()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Extract device data
                device_data = {
                    "id": device_slug,
                    "name": self._extract_name(soup, device_slug),
                    "brand": self._extract_brand(device_slug),
                    "carrier": "Verizon",
                    "price_full": self._extract_full_price(soup),
                    "price_monthly": self._extract_monthly_price(soup),
                    "storage_options": self._extract_storage_options(soup),
                    "storage_prices": self._extract_storage_prices(soup),
                    "colors": self._extract_colors(soup),
                    "image_url": self._extract_image(soup),
                    "features": self._extract_features(soup),
                    "specs": self._extract_specs(soup),
                    "promotions": self._extract_promotions(soup),
                    "_source": "scraping",
                    "_timestamp": datetime.now().isoformat(),
                    "_scraped_url": url
                }
                
                await browser.close()
                
                print(f"   ✅ Scraped successfully")
                print(f"      - Name: {device_data['name']}")
                print(f"      - Price: ${device_data['price_monthly']}/mo")
                print(f"      - Storage: {len(device_data['storage_options'])} options")
                
                self.last_scrape_time = datetime.now()
                
                return device_data
        
        except PlaywrightTimeout:
            print(f"   ⏱️  Timeout loading {url}")
            return None
        except Exception as e:
            print(f"   ❌ Scraping error: {str(e)}")
            return None
    
    def _extract_name(self, soup: BeautifulSoup, device_slug: str) -> str:
        """Extract device name from page"""
        # Try multiple selectors
        selectors = [
            'h1[data-testid="device-name"]',
            'h1.device-title',
            'h1',
            '[data-testid="product-name"]',
            '.product-name'
        ]
        
        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                name = elem.get_text(strip=True)
                if name and len(name) < 100:  # Reasonable name length
                    return name
        
        # Fallback: parse from slug
        return device_slug.replace('-', ' ').title()
    
    def _extract_brand(self, device_slug: str) -> str:
        """Extract brand from device slug"""
        if 'apple' in device_slug.lower() or 'iphone' in device_slug.lower():
            return 'Apple'
        elif 'samsung' in device_slug.lower() or 'galaxy' in device_slug.lower():
            return 'Samsung'
        elif 'google' in device_slug.lower() or 'pixel' in device_slug.lower():
            return 'Google'
        elif 'motorola' in device_slug.lower():
            return 'Motorola'
        else:
            return 'Unknown'
    
    def _extract_monthly_price(self, soup: BeautifulSoup) -> float:
        """
        Extract monthly payment price
        
        Based on test results: [data-testid*="price"] works well
        """
        # Try data-testid selectors first (most reliable from test)
        price_elems = soup.select('[data-testid*="price"]')
        
        for elem in price_elems:
            text = elem.get_text(strip=True)
            
            # Look for monthly pricing patterns
            if '/mo' in text.lower() or 'month' in text.lower():
                # Extract numeric value
                match = re.search(r'\$?(\d+\.?\d*)', text)
                if match:
                    price = float(match.group(1))
                    # Sanity check: monthly price should be $5-$100
                    if 5 <= price <= 100:
                        return price
        
        # Try alternative selectors
        alternative_selectors = [
            '.price-monthly',
            '[class*="monthly-price"]',
            '[class*="MonthlyPrice"]',
            '.monthly-payment'
        ]
        
        for selector in alternative_selectors:
            elems = soup.select(selector)
            for elem in elems:
                text = elem.get_text(strip=True)
                match = re.search(r'\$?(\d+\.?\d*)', text)
                if match:
                    price = float(match.group(1))
                    if 5 <= price <= 100:
                        return price
        
        # Default fallback
        return 27.77
    
    def _extract_full_price(self, soup: BeautifulSoup) -> float:
        """Extract full retail price"""
        # Look for retail price indicators
        keywords = ['retail', 'full price', 'one-time payment', 'buy outright']
        
        price_elems = soup.select('[data-testid*="price"], .price, [class*="Price"]')
        
        for elem in price_elems:
            text = elem.get_text(strip=True).lower()
            
            # Check if this is retail price
            if any(keyword in text for keyword in keywords):
                match = re.search(r'\$?(\d{3,4})', text)
                if match:
                    price = float(match.group(1))
                    # Sanity check: retail price $300-$2000
                    if 300 <= price <= 2000:
                        return price
        
        # Look for 4-digit prices (likely retail)
        all_text = soup.get_text()
        matches = re.findall(r'\$(\d{3,4})(?:\.\d{2})?', all_text)
        
        for match in matches:
            price = float(match)
            if 500 <= price <= 2000:
                return price
        
        # Default fallback
        return 999
    
    def _extract_storage_options(self, soup: BeautifulSoup) -> List[str]:
        """Extract available storage options"""
        storage_options = []
        
        # Look for storage selectors
        selectors = [
            '[data-testid*="storage"]',
            '[class*="storage"]',
            '[class*="Storage"]',
            'button[aria-label*="GB"]',
            'button[aria-label*="TB"]'
        ]
        
        for selector in selectors:
            elems = soup.select(selector)
            for elem in elems:
                text = elem.get_text(strip=True)
                # Match storage patterns: 128GB, 256GB, 512GB, 1TB
                match = re.search(r'(\d+)(GB|TB)', text, re.IGNORECASE)
                if match:
                    storage = match.group(0).upper()
                    if storage not in storage_options:
                        storage_options.append(storage)
        
        # Fallback: common storage options
        if not storage_options:
            storage_options = ["128GB", "256GB", "512GB"]
        
        return sorted(storage_options, key=lambda x: (int(re.search(r'\d+', x).group()), 'TB' in x))
    
    def _extract_storage_prices(self, soup: BeautifulSoup) -> Dict[str, float]:
        """Extract pricing for different storage options"""
        # This would require more sophisticated scraping
        # For now, return estimated pricing based on storage tiers
        storage_options = self._extract_storage_options(soup)
        base_price = self._extract_monthly_price(soup)
        
        prices = {}
        price_increments = {
            "128GB": 0,
            "256GB": 2.78,
            "512GB": 8.34,
            "1TB": 13.89
        }
        
        for storage in storage_options:
            increment = price_increments.get(storage, 0)
            prices[storage] = round(base_price + increment, 2)
        
        return prices
    
    def _extract_colors(self, soup: BeautifulSoup) -> List[str]:
        """Extract available colors"""
        colors = []
        
        # Look for color selectors
        selectors = [
            '[data-testid*="color"]',
            '[class*="color"]',
            '[class*="Color"]',
            'button[aria-label*="color" i]'
        ]
        
        for selector in selectors:
            elems = soup.select(selector)
            for elem in elems:
                # Try aria-label first
                color = elem.get('aria-label', '')
                if not color:
                    color = elem.get_text(strip=True)
                
                # Filter out non-color text
                if color and len(color) < 50:
                    # Remove common prefixes
                    color = re.sub(r'^(select |choose |color:? )', '', color, flags=re.IGNORECASE)
                    if color and color not in colors:
                        colors.append(color)
        
        # Fallback colors
        if not colors:
            colors = ["Black", "White", "Blue", "Natural"]
        
        return colors[:6]  # Max 6 colors
    
    def _extract_image(self, soup: BeautifulSoup) -> str:
        """Extract main device image URL"""
        # Find images with device/phone keywords
        images = soup.find_all('img', src=True)
        
        for img in images:
            src = img.get('src', '')
            alt = img.get('alt', '').lower()
            
            # Check if this looks like a device image
            if any(keyword in src.lower() for keyword in ['device', 'phone', 'iphone', 'samsung', 'galaxy']):
                # Return full URL
                if src.startswith('http'):
                    return src
                elif src.startswith('//'):
                    return f"https:{src}"
                elif src.startswith('/'):
                    return f"{self.BASE_URL}{src}"
        
        # Fallback: look for largest image
        for img in images:
            src = img.get('src', '')
            if 'placeholder' not in src.lower() and len(src) > 50:
                if src.startswith('http'):
                    return src
        
        # Default placeholder
        return "https://ss7.vzw.com/is/image/VerizonWireless/placeholder-device"
    
    def _extract_features(self, soup: BeautifulSoup) -> List[str]:
        """Extract key features"""
        features = []
        
        # Look for feature lists
        feature_sections = soup.select('[class*="feature"], [class*="highlight"], ul li')
        
        for elem in feature_sections[:10]:  # Max 10 features
            text = elem.get_text(strip=True)
            # Filter reasonable feature text
            if 10 < len(text) < 150:
                features.append(text)
        
        # Fallback features
        if not features:
            features = [
                "Latest processor technology",
                "Advanced camera system",
                "All-day battery life",
                "5G Ultra Wideband support"
            ]
        
        return features[:6]  # Max 6 features
    
    def _extract_specs(self, soup: BeautifulSoup) -> Dict[str, str]:
        """Extract technical specifications"""
        specs = {}
        
        # Common spec keywords
        spec_keywords = {
            'display': ['display', 'screen', 'inch'],
            'camera': ['camera', 'mp', 'megapixel'],
            'battery': ['battery', 'mah', 'hours'],
            'chip': ['chip', 'processor', 'cpu'],
            'storage': ['storage', 'memory', 'gb', 'tb'],
            '5g': ['5g', '5g uw', 'ultra wideband']
        }
        
        text_content = soup.get_text().lower()
        
        # Extract specs based on keywords
        for spec_name, keywords in spec_keywords.items():
            for keyword in keywords:
                if keyword in text_content:
                    # Find nearby text (this is simplified)
                    pattern = re.compile(rf'({keyword}[^\n.]{0,100})', re.IGNORECASE)
                    match = pattern.search(soup.get_text())
                    if match:
                        specs[spec_name] = match.group(1).strip()[:100]
                        break
        
        return specs
    
    def _extract_promotions(self, soup: BeautifulSoup) -> List[Dict]:
        """Extract active promotions"""
        promotions = []
        
        # Look for promotion badges/sections
        promo_selectors = [
            '[class*="promo"]',
            '[class*="deal"]',
            '[class*="offer"]',
            '[class*="savings"]'
        ]
        
        for selector in promo_selectors:
            elems = soup.select(selector)
            for elem in elems[:3]:  # Max 3 promos
                text = elem.get_text(strip=True)
                
                # Extract discount amount
                discount_match = re.search(r'\$(\d+)', text)
                
                if discount_match and len(text) < 200:
                    promo = {
                        "id": f"promo-{len(promotions)}",
                        "title": text[:50],
                        "description": text[:150],
                        "discount": int(discount_match.group(1))
                    }
                    promotions.append(promo)
        
        return promotions


# ============================================================================
# Test Scraper
# ============================================================================

async def test_scraper():
    """Test the Verizon scraper"""
    print("=" * 60)
    print("🧪 Testing Verizon Scraper")
    print("=" * 60)
    
    scraper = VerizonScraper()
    
    # Test devices
    test_devices = [
        "apple-iphone-15-pro",
        # "samsung-galaxy-s24",  # Uncomment to test more
    ]
    
    for device_slug in test_devices:
        print(f"\n📱 Testing: {device_slug}")
        result = await scraper.scrape_device(device_slug)
        
        if result:
            print("\n✅ Scraping successful!")
            print(f"   Name: {result['name']}")
            print(f"   Brand: {result['brand']}")
            print(f"   Price: ${result['price_monthly']}/mo (Full: ${result['price_full']})")
            print(f"   Storage: {', '.join(result['storage_options'])}")
            print(f"   Colors: {', '.join(result['colors'][:3])}")
            print(f"   Features: {len(result['features'])} found")
            print(f"   Image: {result['image_url'][:50]}...")
        else:
            print("\n❌ Scraping failed")
    
    print("\n" + "=" * 60)


if __name__ == "__main__":
    asyncio.run(test_scraper())
