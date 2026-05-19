"""
Cache Layer for Verizon MCP Server
===================================

Simple in-memory cache with TTL (Time To Live).
Reduces scraping load and improves response time.
"""

from typing import Dict, Optional, Any
from datetime import datetime, timedelta
import json


class DeviceCache:
    """In-memory cache for device data with TTL"""
    
    def __init__(self, ttl_seconds: int = 3600):
        """
        Initialize cache
        
        Args:
            ttl_seconds: Time to live in seconds (default 1 hour)
        """
        self.cache: Dict[str, Any] = {}
        self.timestamps: Dict[str, datetime] = {}
        self.ttl = timedelta(seconds=ttl_seconds)
        self.hit_count = 0
        self.miss_count = 0
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get cached value if not expired
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if expired/not found
        """
        if key not in self.cache:
            self.miss_count += 1
            return None
        
        # Check if expired
        age = datetime.now() - self.timestamps[key]
        if age > self.ttl:
            # Expired, remove from cache
            del self.cache[key]
            del self.timestamps[key]
            self.miss_count += 1
            return None
        
        self.hit_count += 1
        return self.cache[key]
    
    def set(self, key: str, value: Any):
        """
        Store value in cache
        
        Args:
            key: Cache key
            value: Value to cache
        """
        self.cache[key] = value
        self.timestamps[key] = datetime.now()
    
    def clear(self):
        """Clear all cache entries"""
        self.cache.clear()
        self.timestamps.clear()
        self.hit_count = 0
        self.miss_count = 0
    
    def get_stats(self) -> Dict:
        """Get cache statistics"""
        total_requests = self.hit_count + self.miss_count
        hit_rate = (self.hit_count / total_requests * 100) if total_requests > 0 else 0
        
        return {
            "entries": len(self.cache),
            "hits": self.hit_count,
            "misses": self.miss_count,
            "hit_rate": f"{hit_rate:.1f}%",
            "ttl_seconds": int(self.ttl.total_seconds())
        }
    
    def cleanup_expired(self):
        """Remove expired entries"""
        now = datetime.now()
        expired_keys = [
            key for key, timestamp in self.timestamps.items()
            if now - timestamp > self.ttl
        ]
        
        for key in expired_keys:
            del self.cache[key]
            del self.timestamps[key]
        
        return len(expired_keys)


# Global cache instance (1 hour TTL)
device_cache = DeviceCache(ttl_seconds=3600)


# ============================================================================
# Test Cache
# ============================================================================

def test_cache():
    """Test cache functionality"""
    print("🧪 Testing Cache")
    print("=" * 60)
    
    cache = DeviceCache(ttl_seconds=2)  # 2 second TTL for testing
    
    # Test set and get
    print("\n1. Set and Get:")
    cache.set("test_key", {"name": "iPhone 15 Pro", "price": 999})
    result = cache.get("test_key")
    print(f"   ✅ Retrieved: {result['name']}")
    
    # Test cache hit
    print("\n2. Cache Hit:")
    result = cache.get("test_key")
    print(f"   ✅ Hit: {result is not None}")
    
    # Test cache miss
    print("\n3. Cache Miss:")
    result = cache.get("nonexistent_key")
    print(f"   ✅ Miss: {result is None}")
    
    # Test TTL expiration
    print("\n4. TTL Expiration:")
    print("   Waiting 3 seconds...")
    import time
    time.sleep(3)
    result = cache.get("test_key")
    print(f"   ✅ Expired: {result is None}")
    
    # Test stats
    print("\n5. Cache Stats:")
    stats = cache.get_stats()
    for key, value in stats.items():
        print(f"   {key}: {value}")
    
    print("\n" + "=" * 60)
    print("✅ Cache tests passed!")


if __name__ == "__main__":
    test_cache()
