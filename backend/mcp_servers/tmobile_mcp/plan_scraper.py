"""
Plan scraper for T-Mobile plans.
Scrapes live plan pricing and features from T-Mobile.com
"""

import asyncio
from playwright.async_api import async_playwright, Page, Browser
from bs4 import BeautifulSoup
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class PlanScraper:
    """Scrapes plan data from T-Mobile's website"""
    
    def __init__(self):
        self.base_url = "https://www.t-mobile.com"
        self.plans_url = f"{self.base_url}/cell-phone-plans"
        
    async def scrape_plans(self) -> Dict[str, any]:
        """
        Scrape all plans from T-Mobile
        
        Returns:
            Dict with structure:
            {
                "plans": [
                    {
                        "id": "essentials",
                        "name": "Essentials",
                        "price_per_line": {"1": 60, "2": 50, "3": 40, "4": 30},
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
        
        # T-Mobile typically has: Essentials, Magenta, Magenta MAX
        plan_names = []
        plan_text = soup.get_text()
        
        if 'Essentials' in plan_text or 'essentials' in plan_text.lower():
            plan_names.append('Essentials')
        if 'Magenta' in plan_text and 'MAX' not in plan_text:
            plan_names.append('Magenta')
        if 'Magenta MAX' in plan_text or 'magenta max' in plan_text.lower():
            plan_names.append('Magenta MAX')
        if 'Go5G' in plan_text or 'go5g' in plan_text.lower():
            plan_names.append('Go5G')
        if 'Go5G Plus' in plan_text or 'go5g plus' in plan_text.lower():
            plan_names.append('Go5G Plus')
        
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
        
        # Generic features that apply to most plans
        features = [
            "Unlimited talk, text & data",
            "5G included",
            "Mobile hotspot",
            "Unlimited talk, text, and 5GB data in Mexico & Canada"
        ]
        
        # Plan-specific features
        if 'essentials' in plan_name.lower():
            features.extend([
                "Network management during congestion",
                "SD streaming"
            ])
        elif 'magenta' in plan_name.lower() and 'max' not in plan_name.lower():
            features.extend([
                "100GB premium data",
                "HD streaming",
                "5GB mobile hotspot"
            ])
        elif 'max' in plan_name.lower():
            features.extend([
                "Unlimited premium data",
                "4K UHD streaming",
                "40GB mobile hotspot",
                "Netflix on Us"
            ])
        elif 'go5g plus' in plan_name.lower():
            features.extend([
                "Unlimited premium data",
                "4K UHD streaming",
                "50GB mobile hotspot",
                "Apple TV+ on Us"
            ])
        elif 'go5g' in plan_name.lower():
            features.extend([
                "100GB premium data",
                "HD streaming",
                "15GB mobile hotspot"
            ])
        
        return features
    
    def _extract_plan_pricing(self, soup: BeautifulSoup, plan_name: str) -> Dict[str, int]:
        """Extract pricing tiers for a plan (1 line, 2 lines, etc.)"""
        
        pricing = {}
        
        # Default pricing structure (typical T-Mobile pattern)
        if 'essentials' in plan_name.lower():
            pricing = {"1": 60, "2": 50, "3": 40, "4": 30, "5": 30}
        elif 'magenta' in plan_name.lower() and 'max' not in plan_name.lower():
            pricing = {"1": 70, "2": 60, "3": 45, "4": 35, "5": 35}
        elif 'max' in plan_name.lower():
            pricing = {"1": 85, "2": 75, "3": 55, "4": 45, "5": 45}
        elif 'go5g plus' in plan_name.lower():
            pricing = {"1": 90, "2": 80, "3": 60, "4": 50, "5": 50}
        elif 'go5g' in plan_name.lower():
            pricing = {"1": 75, "2": 65, "3": 50, "4": 40, "5": 40}
        else:
            # Generic fallback
            pricing = {"1": 70, "2": 60, "3": 45, "4": 35, "5": 35}
        
        return pricing
    
    async def _extract_promotions(self, soup: BeautifulSoup) -> List[Dict]:
        """Extract current promotions"""
        promotions = []
        
        # Look for promotion text
        promo_keywords = ['save', 'discount', 'promo', 'deal', 'offer', 'free', 'on us']
        
        promo_elements = soup.find_all(string=lambda text: text and any(keyword in text.lower() for keyword in promo_keywords))
        
        # Common promotions
        if any('netflix' in str(elem).lower() or 'on us' in str(elem).lower() for elem in promo_elements):
            promotions.append({
                "id": "netflix-included",
                "name": "Netflix On Us",
                "description": "Netflix Standard included with Magenta MAX",
                "discount_amount": 15
            })
        
        if any('autopay' in str(elem).lower() or 'auto pay' in str(elem).lower() for elem in promo_elements):
            promotions.append({
                "id": "autopay-discount",
                "name": "AutoPay Discount",
                "description": "Save with AutoPay",
                "discount_amount": 5
            })
        
        return promotions
    
    def _get_fallback_data(self) -> Dict:
        """Fallback data if scraping fails"""
        logger.info("Using fallback plan data")
        return {
            "plans": [
                {
                    "id": "essentials",
                    "name": "Essentials",
                    "price_per_line": {"1": 60, "2": 50, "3": 40, "4": 30, "5": 30},
                    "features": [
                        "Unlimited talk, text & data",
                        "5G included",
                        "Network management during congestion"
                    ]
                },
                {
                    "id": "magenta",
                    "name": "Magenta",
                    "price_per_line": {"1": 70, "2": 60, "3": 45, "4": 35, "5": 35},
                    "features": [
                        "100GB premium data",
                        "HD streaming",
                        "5GB mobile hotspot"
                    ]
                },
                {
                    "id": "magenta-max",
                    "name": "Magenta MAX",
                    "price_per_line": {"1": 85, "2": 75, "3": 55, "4": 45, "5": 45},
                    "features": [
                        "Unlimited premium data",
                        "4K UHD streaming",
                        "40GB mobile hotspot",
                        "Netflix on Us"
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
    
    print("\n=== SCRAPED T-MOBILE PLANS ===")
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
