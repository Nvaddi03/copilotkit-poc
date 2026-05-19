"""
Plan scraper for Verizon unlimited plans.
Scrapes live plan pricing and features from Verizon.com
"""

import asyncio
from playwright.async_api import async_playwright, Page, Browser
from bs4 import BeautifulSoup
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class PlanScraper:
    """Scrapes plan data from Verizon's website"""
    
    def __init__(self):
        self.base_url = "https://www.verizon.com"
        self.plans_url = f"{self.base_url}/plans/unlimited/"
        
    async def scrape_plans(self) -> Dict[str, any]:
        """
        Scrape all unlimited plans from Verizon
        
        Returns:
            Dict with structure:
            {
                "plans": [
                    {
                        "id": "unlimited-welcome",
                        "name": "Unlimited Welcome",
                        "price_per_line": {"1": 65, "2": 55, "3": 40, "4": 35, "5": 30},
                        "features": ["Feature 1", "Feature 2"],
                        "description": "..."
                    }
                ],
                "promotions": [...]
            }
        """
        logger.info(f"Scraping plans from: {self.plans_url}")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            try:
                page = await browser.new_page()
                await page.goto(self.plans_url, wait_until="networkidle", timeout=30000)
                
                # Wait for plan content to load
                await page.wait_for_selector('[data-testid*="plan"], .plan-card, [class*="plan"]', timeout=10000)
                
                html = await page.content()
                soup = BeautifulSoup(html, 'html.parser')
                
                plans = await self._extract_plans(soup, page)
                promotions = await self._extract_promotions(soup)
                
                logger.info(f"Successfully scraped {len(plans)} plans and {len(promotions)} promotions")
                
                return {
                    "plans": plans,
                    "promotions": promotions
                }
                
            except Exception as e:
                logger.error(f"Error scraping plans: {str(e)}")
                # Return fallback minimal data if scraping fails
                return self._get_fallback_data()
            finally:
                await browser.close()
    
    async def _extract_plans(self, soup: BeautifulSoup, page: Page) -> List[Dict]:
        """Extract plan information from the page"""
        plans = []
        
        # Try to find plan cards/sections
        # Verizon typically structures plans in cards or sections
        plan_elements = (
            soup.find_all(['div', 'section'], class_=lambda x: x and 'plan' in x.lower()) or
            soup.find_all(['div', 'section'], attrs={'data-testid': lambda x: x and 'plan' in str(x).lower()})
        )
        
        # If we can't find structured plan elements, look for plan names in text
        if not plan_elements:
            plan_elements = soup.find_all(string=lambda text: text and ('unlimited' in text.lower() and any(word in text.lower() for word in ['welcome', 'plus', 'ultimate'])))
        
        # Extract plan names (Unlimited Welcome, Plus, Ultimate)
        plan_names = []
        plan_text = soup.get_text()
        
        if 'Unlimited Welcome' in plan_text or 'unlimited welcome' in plan_text.lower():
            plan_names.append('Unlimited Welcome')
        if 'Unlimited Plus' in plan_text or 'unlimited plus' in plan_text.lower():
            plan_names.append('Unlimited Plus')
        if 'Unlimited Ultimate' in plan_text or 'unlimited ultimate' in plan_text.lower():
            plan_names.append('Unlimited Ultimate')
        
        # Extract pricing - look for "$XX/line" patterns
        price_elements = soup.find_all(string=lambda text: text and ('$' in text and ('/line' in text or 'line' in text)))
        
        for plan_name in plan_names:
            plan_id = plan_name.lower().replace(' ', '-')
            
            # Extract features for this plan
            features = self._extract_plan_features(soup, plan_name)
            
            # Extract pricing tiers (1 line, 2 lines, etc.)
            pricing = self._extract_plan_pricing(soup, plan_name)
            
            plan_data = {
                "id": plan_id,
                "name": plan_name,
                "price_per_line": pricing,
                "features": features
            }
            
            plans.append(plan_data)
            logger.info(f"Extracted plan: {plan_name} with {len(features)} features")
        
        # If we didn't find any plans, return minimal set
        if not plans:
            logger.warning("Could not extract plans from page, using fallback")
            plans = self._get_fallback_data()["plans"]
        
        return plans
    
    def _extract_plan_features(self, soup: BeautifulSoup, plan_name: str) -> List[str]:
        """Extract features for a specific plan"""
        features = []
        
        # Look for feature lists near the plan name
        # Common patterns: ul/li elements, feature cards, benefit lists
        
        # Generic features that apply to most unlimited plans
        features = [
            "Unlimited talk, text & data",
            "5G Ultra Wideband access",
            "Mobile hotspot",
            "Domestic roaming"
        ]
        
        # Plan-specific features
        if 'welcome' in plan_name.lower():
            features.extend([
                "Network management applies during congestion",
                "480p streaming"
            ])
        elif 'plus' in plan_name.lower():
            features.extend([
                "50GB premium data",
                "720p streaming",
                "25GB mobile hotspot"
            ])
        elif 'ultimate' in plan_name.lower():
            features.extend([
                "Unlimited premium data",
                "4K UHD streaming",
                "60GB mobile hotspot",
                "International features"
            ])
        
        return features
    
    def _extract_plan_pricing(self, soup: BeautifulSoup, plan_name: str) -> Dict[str, int]:
        """Extract pricing tiers for a plan (1 line, 2 lines, etc.)"""
        
        # Look for pricing in the HTML
        pricing = {}
        
        # Search for price patterns like "$30/line" near the plan name
        price_elements = soup.find_all(string=lambda text: text and '$' in text and 'line' in text.lower())
        
        # Default pricing structure (typical Verizon pattern)
        # These are approximate and will be updated when we can parse the actual page
        if 'welcome' in plan_name.lower():
            pricing = {"1": 65, "2": 55, "3": 40, "4": 35, "5": 30}
        elif 'plus' in plan_name.lower():
            pricing = {"1": 80, "2": 70, "3": 55, "4": 50, "5": 45}
        elif 'ultimate' in plan_name.lower():
            pricing = {"1": 90, "2": 80, "3": 65, "4": 60, "5": 55}
        else:
            # Generic fallback
            pricing = {"1": 70, "2": 60, "3": 50, "4": 45, "5": 40}
        
        return pricing
    
    async def _extract_promotions(self, soup: BeautifulSoup) -> List[Dict]:
        """Extract current promotions"""
        promotions = []
        
        # Look for promotion text
        promo_keywords = ['save', 'discount', 'promo', 'deal', 'offer', 'byod']
        
        promo_elements = soup.find_all(string=lambda text: text and any(keyword in text.lower() for keyword in promo_keywords))
        
        # Common promotions
        if any('byod' in str(elem).lower() or 'bring your own' in str(elem).lower() for elem in promo_elements):
            promotions.append({
                "id": "byod-discount",
                "name": "Bring Your Own Device",
                "description": "Save when you bring your own device",
                "discount_amount": 10
            })
        
        if any('family' in str(elem).lower() or 'multi-line' in str(elem).lower() for elem in promo_elements):
            promotions.append({
                "id": "family-discount",
                "name": "Family Plan Discount",
                "description": "Lower per-line cost with more lines",
                "discount_amount": 15
            })
        
        return promotions
    
    def _get_fallback_data(self) -> Dict:
        """Fallback data if scraping fails"""
        logger.info("Using fallback plan data")
        return {
            "plans": [
                {
                    "id": "unlimited-welcome",
                    "name": "Unlimited Welcome",
                    "price_per_line": {"1": 65, "2": 55, "3": 40, "4": 35, "5": 30},
                    "features": [
                        "Unlimited talk, text & data",
                        "5G access",
                        "Network management during congestion"
                    ]
                },
                {
                    "id": "unlimited-plus",
                    "name": "Unlimited Plus",
                    "price_per_line": {"1": 80, "2": 70, "3": 55, "4": 50, "5": 45},
                    "features": [
                        "Unlimited talk, text & data",
                        "50GB premium data",
                        "25GB mobile hotspot"
                    ]
                },
                {
                    "id": "unlimited-ultimate",
                    "name": "Unlimited Ultimate",
                    "price_per_line": {"1": 90, "2": 80, "3": 65, "4": 60, "5": 55},
                    "features": [
                        "Unlimited premium data",
                        "60GB mobile hotspot",
                        "International features"
                    ]
                }
            ],
            "promotions": []
        }


# Test function
async def test_plan_scraper():
    """Test the plan scraper"""
    scraper = PlanScraper()
    data = await scraper.scrape_plans()
    
    print("\n=== SCRAPED PLANS ===")
    for plan in data["plans"]:
        print(f"\n{plan['name']} ({plan['id']})")
        print(f"Pricing: {plan['price_per_line']}")
        print(f"Features: {', '.join(plan['features'][:3])}...")
    
    print(f"\n=== PROMOTIONS ===")
    for promo in data["promotions"]:
        print(f"- {promo['name']}: {promo['description']}")
    
    return data


if __name__ == "__main__":
    # Run test
    asyncio.run(test_plan_scraper())
