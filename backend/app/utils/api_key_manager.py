"""
API Key Manager with fallback support and error handling
"""
import os
from typing import Optional, List
from datetime import datetime, timedelta
import json

class APIKeyManager:
    """Manages multiple Google API keys with automatic fallback and quota tracking"""
    
    def __init__(self):
        self.keys: List[str] = []
        self.key_status: dict = {}  # Track which keys are exhausted
        self.load_keys()
    
    def load_keys(self):
        """Load API keys from environment variables"""
        # Try to load from GOOGLE_API_KEYS (comma-separated) or individual GOOGLE_API_KEY
        keys_str = os.getenv("GOOGLE_API_KEYS", "").strip()
        
        if keys_str:
            # Multiple keys provided as comma-separated
            self.keys = [k.strip() for k in keys_str.split(",") if k.strip()]
        else:
            # Single key from GOOGLE_API_KEY
            single_key = os.getenv("GOOGLE_API_KEY", "").strip()
            if single_key:
                self.keys = [single_key]
        
        # Initialize status for each key
        for key in self.keys:
            self.key_status[key] = {
                "exhausted": False,
                "last_error": None,
                "exhausted_at": None,
                "request_count": 0
            }
        
        print(f"Loaded {len(self.keys)} API key(s)", flush=True)
    
    def get_active_key(self) -> Optional[str]:
        """Get the next active API key that hasn't hit quota"""
        for key in self.keys:
            if not self.key_status[key]["exhausted"]:
                return key
        
        # All keys exhausted, return first one (will error again but with proper handling)
        return self.keys[0] if self.keys else None
    
    def mark_key_exhausted(self, key: str, error: str):
        """Mark a key as exhausted and move to next one"""
        if key in self.key_status:
            self.key_status[key]["exhausted"] = True
            self.key_status[key]["last_error"] = error
            self.key_status[key]["exhausted_at"] = datetime.now().isoformat()
            print(f"Marked API key as exhausted due to: {error}", flush=True)
    
    def is_quota_error(self, error: str) -> bool:
        """Check if error is due to quota/rate limit"""
        error_lower = str(error).lower()
        quota_indicators = [
            "quota",
            "rate limit",
            "resource exhausted",
            "429",
            "daily limit",
            "monthly limit",
            "permission denied",
            "invalid_api_key",
            "api_key_invalid",
            "you exceeded",
            "quota exceeded",
            "generativelanguage",
            "freetier"
        ]
        return any(indicator in error_lower for indicator in quota_indicators)
    
    def get_user_friendly_error(self, error: str) -> str:
        """Convert technical API error to user-friendly message"""
        error_str = str(error).lower()
        
        if "quota" in error_str or "rate limit" in error_str or "resource exhausted" in error_str:
            return "API quota has been exceeded. Please try again later or contact support with a new API key."
        elif "invalid_api_key" in error_str or "api_key_invalid" in error_str:
            return "Invalid or expired API key. Please check your API key configuration."
        elif "permission denied" in error_str or "401" in error_str or "403" in error_str:
            return "API authentication failed. Please verify your API key has the required permissions."
        elif "connection" in error_str or "timeout" in error_str:
            return "Unable to connect to the API. Please check your internet connection and try again."
        else:
            return "An error occurred while processing your request. Please try again."
    
    def get_status_report(self) -> dict:
        """Get a report of all API keys and their status"""
        return {
            "total_keys": len(self.keys),
            "active_keys": sum(1 for k in self.key_status.values() if not k["exhausted"]),
            "exhausted_keys": sum(1 for k in self.key_status.values() if k["exhausted"]),
            "details": [
                {
                    "key": key[:20] + "..." if len(key) > 20 else key,  # Hide full key
                    "exhausted": self.key_status[key]["exhausted"],
                    "last_error": self.key_status[key]["last_error"],
                    "exhausted_at": self.key_status[key]["exhausted_at"],
                    "request_count": self.key_status[key]["request_count"]
                }
                for key in self.keys
            ]
        }


# Global instance
_api_key_manager = None

def get_api_key_manager() -> APIKeyManager:
    """Get or create the global API key manager instance"""
    global _api_key_manager
    if _api_key_manager is None:
        _api_key_manager = APIKeyManager()
    return _api_key_manager
