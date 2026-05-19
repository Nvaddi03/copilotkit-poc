"""
Test Verizon MCP Server
========================

Validates that the MCP server is working correctly.
"""

import requests
import json

BASE_URL = "http://localhost:8001"

def test_root_endpoint():
    """Test MCP server info endpoint"""
    print("\n" + "="*60)
    print("🧪 Test 1: MCP Server Info")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Server: {data['mcp_server']}")
        print(f"✅ Carrier: {data['carrier']}")
        print(f"✅ Version: {data['version']}")
        print(f"✅ Tools: {len(data['tools'])}")
        
        for tool in data['tools']:
            print(f"   • {tool['name']}")
            if tool['ui_resource']:
                print(f"     UI: {tool['ui_resource']}")
        
        return True
    else:
        print(f"❌ Failed: {response.status_code}")
        return False


def test_get_device_info():
    """Test get_device_info tool"""
    print("\n" + "="*60)
    print("🧪 Test 2: Get Device Info")
    print("="*60)
    
    payload = {
        "device_slug": "iphone-15-pro",
        "storage": "256GB"
    }
    
    response = requests.post(f"{BASE_URL}/tools/get_device_info", json=payload)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        device = data['data']
        
        print(f"✅ Tool: {data['tool']}")
        print(f"✅ Device: {device['name']}")
        print(f"✅ Price: ${device['price_monthly']}/mo")
        print(f"✅ Storage: {device['selected_storage']}")
        print(f"✅ UI Resource: {data['ui_resource']}")
        print(f"✅ Data Source: {device['_source']}")
        
        # Verify UI resource is accessible
        ui_response = requests.get(data['ui_resource'])
        if ui_response.status_code == 200:
            print(f"✅ UI Component: Accessible ({len(ui_response.text)} bytes)")
        else:
            print(f"❌ UI Component: Failed ({ui_response.status_code})")
        
        return True
    else:
        print(f"❌ Failed: {response.status_code}")
        print(response.text)
        return False


def test_get_plans():
    """Test get_plans tool"""
    print("\n" + "="*60)
    print("🧪 Test 3: Get Plans")
    print("="*60)
    
    payload = {
        "num_lines": 4
    }
    
    response = requests.post(f"{BASE_URL}/tools/get_plans", json=payload)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        plans = data['data']['plans']
        
        print(f"✅ Tool: {data['tool']}")
        print(f"✅ Plans: {len(plans)}")
        print(f"✅ Lines: {data['data']['lines']}")
        print(f"✅ UI Resource: {data['ui_resource']}")
        
        for plan in plans:
            print(f"   • {plan['name']}: ${plan['price']}/mo per line")
        
        return True
    else:
        print(f"❌ Failed: {response.status_code}")
        return False


def test_calculate_total_cost():
    """Test calculate_total_cost tool"""
    print("\n" + "="*60)
    print("🧪 Test 4: Calculate Total Cost")
    print("="*60)
    
    payload = {
        "device_slug": "iphone-15-pro",
        "plan_id": "unlimited-plus",
        "num_lines": 2,
        "months": 36
    }
    
    response = requests.post(f"{BASE_URL}/tools/calculate_total_cost", json=payload)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        result = data['data']
        
        print(f"✅ Tool: {data['tool']}")
        print(f"✅ Device Cost: ${result['device_cost']['total']:,.2f}")
        print(f"✅ Plan Cost: ${result['plan_cost']['total']:,.2f}")
        print(f"✅ Grand Total: ${result['grand_total']:,.2f}")
        print(f"✅ Breakdown: {result['breakdown']}")
        
        return True
    else:
        print(f"❌ Failed: {response.status_code}")
        return False


def test_ui_components():
    """Test UI components are accessible"""
    print("\n" + "="*60)
    print("🧪 Test 5: UI Components")
    print("="*60)
    
    ui_urls = [
        f"{BASE_URL}/ui/device-card.html",
        f"{BASE_URL}/ui/plans-table.html"
    ]
    
    all_passed = True
    for url in ui_urls:
        response = requests.get(url)
        component_name = url.split('/')[-1]
        
        if response.status_code == 200:
            size_kb = len(response.text) / 1024
            print(f"✅ {component_name}: {size_kb:.1f}KB")
        else:
            print(f"❌ {component_name}: Failed ({response.status_code})")
            all_passed = False
    
    return all_passed


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("🚀 VERIZON MCP SERVER TEST SUITE")
    print("="*60)
    print(f"Target: {BASE_URL}")
    print("="*60)
    
    tests = [
        ("Server Info", test_root_endpoint),
        ("Get Device Info", test_get_device_info),
        ("Get Plans", test_get_plans),
        ("Calculate Cost", test_calculate_total_cost),
        ("UI Components", test_ui_components)
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n❌ {name} crashed: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "="*60)
    print("📊 TEST RESULTS")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {name}")
    
    print("="*60)
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Verizon MCP Server is ready!")
        print("\n📋 Next Steps:")
        print("   1. View device card: http://localhost:8001/ui/device-card.html")
        print("   2. View plans table: http://localhost:8001/ui/plans-table.html")
        print("   3. API docs: http://localhost:8001/docs")
        print("   4. Proceed to Day 2: Build web scraper")
    else:
        print(f"\n⚠️  {total - passed} tests failed. Please review errors above.")
    
    print("="*60)


if __name__ == "__main__":
    main()
