import { SearchResponse } from './duckduckgo';
import { TavilySearchResponse } from './tavily';

interface CacheEntry {
  data: SearchResponse | TavilySearchResponse | { results: any[]; backend: string };
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000;

class SearchCache {
  private cache: Map<string, CacheEntry> = new Map();

  private generateKey(query: string, options?: any): string {
    return `${query.toLowerCase()}_${JSON.stringify(options || {})}`;
  }

  get(query: string, options?: any): any {
    const key = this.generateKey(query, options);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(query: string, data: SearchResponse | TavilySearchResponse | { results: any[]; backend: string }, options?: any): void {
    const key = this.generateKey(query, options);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    this.cleanup();
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > CACHE_DURATION) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  clear(): void {
    this.cache.clear();
  }
}

export const searchCache = new SearchCache();
