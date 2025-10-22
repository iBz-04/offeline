export const clearAppCache = async () => {
  try {
    if (typeof window === 'undefined') return;

    localStorage.clear();
    
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
