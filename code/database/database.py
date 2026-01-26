import time

class Database:
    def __init__(self):
        self._data = {}
        self._expire = {}
    
    def set(self, key: str, value: str, ttl: int | None = None) -> None:
        self._data[key] = value
        
        if ttl is not None:
            self._expire[key] = time.time() + ttl
        elif key in self._expire:
            # edge case, when reset the key without ttl, need to clean existing ttl
            del self._expire[key]
    
    def get(self, key: str) -> str | None:
        # if expired, should return None
        return self._data[key] if key in self._data and not self._is_expired(key) else None
    
    def delete(self, key: str) -> bool:
        """return True if key existed"""
        if key not in self._data:
            return False

        del self._data[key]

        # Return False on expired key
        delete_status = True
        if key in self._expire and self._is_expired(key):
            delete_status = False
        
        # Remove the key from self._expire after expiration check
        self._expire.pop(key, None)
        
        return delete_status
    
    def scan(self) -> list[tuple[str, str]]:
        return [(k, v) for k, v in sorted(self._data.items(), key=lambda x:x[0]) if not self._is_expired(k)]
    
    def scan_by_prefix(self, prefix: str) -> list[tuple[str, str]]:
        return [(k, v) for k, v in sorted(self._data.items(), key=lambda x:x[0]) if k.startswith(prefix) and not self._is_expired(k)]
    
    def _is_expired(self, key: str) -> bool:
        return key in self._expire and self._expire[key] < time.time()