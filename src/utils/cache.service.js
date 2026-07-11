const NodeCache = require('node-cache');
const myCache = new NodeCache({ stdTTL: 600 }); // Default 10 minutes

class CacheService {
    get(key) {
        return myCache.get(key);
    }

    set(key, value, ttl) {
        return myCache.set(key, value, ttl);
    }

    del(key) {
        return myCache.del(key);
    }

    delStartWith(prefix) {
        const keys = myCache.keys();
        const keysToDelete = keys.filter(k => k.startsWith(prefix));
        if (keysToDelete.length > 0) {
            myCache.del(keysToDelete);
        }
    }

    flush() {
        return myCache.flushAll();
    }
}

module.exports = new CacheService();
