const PRESERVED_KEYS = ['chatty_user', 'theme'];

export const clearAppCache = async () => {
  try {
    if (typeof window === 'undefined') return;

    const preserved = PRESERVED_KEYS.reduce((acc, key) => {
      const value = localStorage.getItem(key);
      if (value) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    localStorage.clear();
    
    Object.entries(preserved).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    if ('indexedDB' in window) {
      const dbs = await indexedDB.databases();
      dbs.forEach(db => {
        if (db.name) indexedDB.deleteDatabase(db.name);
      });
    }

    return true;
  } catch (error) {
    console.error('Cache clear failed:', error);
    throw new Error('Failed to clear cache');
  }
};
