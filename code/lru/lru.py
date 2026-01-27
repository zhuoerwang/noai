class Node():
    def __init__(self, key: int | None = None, val: int | None = None):
        self.key, self.val = key, val
        self.prev, self.next = None, None

class LRUCache():
    def __init__(self, cap: int):
        self._cache = {}
        self._head, self._tail = Node(), Node()
        self._head.next, self._tail.prev = self._tail, self._head
        self._cap = cap
    
    def get(self, key: int) -> int:
        if key in self._cache:
            node = self._cache[key]
            self._remove(node)
            self._move_to_end(node)
            return node.val
        
        return -1
    
    def put(self, key: int, val: int) -> None:
        if key in self._cache:
            self._remove(self._cache[key])

        self._cache[key] = Node(key, val)
        self._move_to_end(self._cache[key])
        
        if len(self._cache) > self._cap:
            evict_node = self._head.next
            self._remove(evict_node)
            del self._cache[evict_node.key]

    def _move_to_end(self, node: Node):
        prev, nxt = self._tail.prev, self._tail
        node.prev, node.next = prev, nxt
        prev.next, nxt.prev = node, node

    def _remove(self, node: Node):
        prev, nxt = node.prev, node.next
        nxt.prev, prev.next = prev, nxt
    
    def keys(self) -> list[int]:
        res = []
        node = self._tail.prev
        while node != self._head:
            res.append(node.key)
            node = node.prev
        
        return res
    
    def peek(self, key: int) -> int:
        if key in self._cache:
            return self._cache[key].val
        
        return -1

    def size(self) -> int:
        return len(self._cache)