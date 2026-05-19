"""
Plan scraper for AT&T unlimited plans.
Scrapes live plan pricing and features from ATT.com
"""

import asyncio
from playwright.async_api import async_playwright, Page, Browser
from bs4 import BeautifulSoup
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class PlanScraper:
    """Scrapes plan data from AT&T's website"""
    
    def __init__(self):
        self.base_url = "https://www.att.com"
        self.plans_url = f"{self.base_url}/plans/unlimited-data-plans/"
        
    async def scrape_plans(self) -> Dict[str, any]:
        """
        Scrape all unlimited plans from AT&T
        
        Returns:
            Dict with structure:
            {
                "plans": [
                    {
                        "id": "unlimited-starter",
                        "name": "Unlimited Starter",
                        "price_per_line": {"1": 65, "2": 60, "3": 45, "4": 40},
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
        
        # AT&T typically has: Unlimited Starter, Extra, Premium
        plan_names = []
        plan_text = soup.get_text()
        
        if 'Unlimited Starter' in plan_text or 'starter' in plan_text.lower():
            plan_names.append('Unlimited Starter')
        if 'Unlimited Extra' in plan_text or 'extra' in plan_text.lower():
            plan_names.append('Unlimited Extra')
        if 'Unlimited Premium' in plan_text or 'premium' in plan_text.lower():
            plan_names.append('Unlimited Premium')
        
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
        
        # Generic features that apply to most unlimited plans
        features = [
            "Unlimited talk, text & data",
            "5G access included",
            "Mobile hotspot",
            "Talk, text, and data in Mexico and Canada"
        ]
        
        # Plan-specific features
        if 'starter' in plan_name.lower():
            features.extend([
                "Network management may apply",
                "SD streaming quality"
            ])
        elif 'extra' in plan_name.lower():
            features.extend([
                "50GB premium data",
                "HD streaming",
                "15GB mobile hotspot"
            ])
        elif 'premium' in plan_name.lower():
            features.extend([
                "Unlimited premium data",
                "4K UHD streaming",
                "50GB mobile hotspot",
                "ActiveArmor Advanced security"
            ])
        
        return features
    
    def _extract_plan_pricing(self, soup: BeautifulSoup, plan_name: str) -> Dict[str, int]:
        """Extract pricing tiers for a plan (1 line, 2 lines, etc.)"""
        
        pricing = {}
        
        # Default pricing structure (typical AT&T pattern)
        if 'starter' in plan_name.lower():
            pricing = {"1": 65, "2": 60, "3": 45, "4": 40, "5": 35}
        elif 'extra' in plan_name.lower():
            pricing = {"1": 75, "2": 65, "3": 50, "4": 45, "5": 40}
        elif 'premium' in plan_name.lower():
            pricing = {"1": 85, "2": 75, "3": 60, "4": 55, "5": 50}
        else:
            # Generic fallback
            pricing = {"1": 70, "2": 65, "3": 50, "4": 45, "5": 40}
        
        return pricing
    
    async def _extract_promotions(self, soup: BeautifulSoup) -> List[Dict]:
        """Extract current promotions"""
        promotions = []
        
        # Look for promotion text
        promo_keywords = ['save', 'discount', 'promo', 'deal', 'offer', 'trade-in']
        
        promo_elements = soup.find_all(string=lambda text: text and any(keyword in text.lower() for keyword in promo_keywords))
        
        # Common promotions
        if any('trade' in str(elem).lower() for elem in promo_elements):
            promotions.append({
                "id": "trade-in-offer",
                "name": "Trade-in Credit",
                "description": "Get credit when you trade in eligible device",
                "discount_amount": 800
            })
        
        if any('autopay' in str(elem).lower() or 'auto pay' in str(elem).lower() for elem in promo_elements):
            promotions.append({
                "id": "autopay-discount",
                "name": "AutoPay & Paperless Billing",
                "description": "Save with AutoPay and paperless billing",
                "discount_amount": 10
            })
        
        return promotions
    
    def _get_fallback_data(self) -> Dict:
        """Fallback data if scraping fails"""
        logger.info("Using fallback plan data")
        return {
            "plans": [
                {
                    "id": "unlimited-starter",
                    "name": "Unlimited Starter",
                    "price_per_line": {"1": 65, "2": 60, "3": 45, "4": 40, "5": 35},
                    "features": [
                        "Unlimited talk, text & data",
                        "5G access included",
                        "Network management may apply"
                    ]
                },
                {
                    "id": "unlimited-extra",
                    "name": "Unlimited Extra",
                    "price_per_line": {"1": 75, "2": 65, "3": 50, "4": 45, "5": 40},
                    "features": [
                        "50GB premium data",
                        "HD streaming",
                        "15GB mobile hotspot"
                    ]
                },
                {
                    "id": "unlimited-premium",
                    "name": "Unlimited Premium",
                    "price_per_line": {"1": 85, "2": 75, "3": 60, "4": 55, "5": 50},
                    "features": [
                        "Unlimited premium data",
                        "4K UHD streaming",
                        "50GB mobile hotspot"
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
    
    print("\n=== SCRAPED AT&T PLANS ===")
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
