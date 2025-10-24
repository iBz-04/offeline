import { duckduckgoClient } from './duckduckgo';
import { tavilyClient } from './tavily';
import { searchCache } from './search-cache';
import { SearchResult } from './duckduckgo';
import { TavilySearchResult } from './tavily';
import useChatStore from '@/hooks/useChatStore';

type SearchBackend = 'duckduckgo' | 'tavily';

// Get the current search backend from environment or default to tavily
function getCurrentSearchBackend(): SearchBackend {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('searchBackend');
    if (stored && (stored === 'duckduckgo' || stored === 'tavily')) {
      return stored;
    }
  }
  return 'tavily';
}

export function setSearchBackend(backend: SearchBackend): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('searchBackend', backend);
  }
}

export async function performWebSearch(query: string): Promise<SearchResult[] | TavilySearchResult[]> {
  const { setIsSearching, setSearchResults, searchEnabled } = useChatStore.getState();
  
  if (!searchEnabled) {
    return [];
  }

  setIsSearching(true);
  setSearchResults(null);

  try {
    const backend = getCurrentSearchBackend();
    const cached = searchCache.get(query);
    if (cached && (cached.results || cached.results === null)) {
      // Handle both old format and new format
      const results = cached.results || (Array.isArray(cached) ? cached : []);
      setSearchResults(results);
      setIsSearching(false);
      return results;
    }

    let results: SearchResult[] | TavilySearchResult[] = [];

    if (backend === 'tavily') {
      const response = await tavilyClient.search(query, {
        maxResults: 8,
        searchDepth: 'basic',
        includeAnswer: true,
        topic: 'general',
      });
      results = response.results;
    } else {
      const response = await duckduckgoClient.search(query, {
        maxResults: 8,
        categories: 'general',
        language: 'en',
      });
      results = response.results;
    }

    searchCache.set(query, { results, backend });
    setSearchResults(results as any);
    setIsSearching(false);
    
    return results;
  } catch (error) {
    console.error('Search failed:', error);
    setIsSearching(false);
    setSearchResults(null);
    return [];
  }
}

export function formatSearchContextForAI(results: SearchResult[] | TavilySearchResult[]): string {
  if (!results || results.length === 0) {
    return '';
  }

  const backend = getCurrentSearchBackend();
  
  if (backend === 'tavily' && results.length > 0 && 'score' in results[0]) {
    return tavilyClient.formatResultsForContext(results as TavilySearchResult[]);
  }

  return duckduckgoClient.formatResultsForContext(results as SearchResult[]);
}

export function shouldPerformSearch(userMessage: string, searchEnabled: boolean): boolean {
  if (!searchEnabled) {
    return false;
  }

  const searchKeywords = [
    'search',
    'find',
    'latest',
    'current',
    'recent',
    'today',
    'news',
    'what is',
    'who is',
    'when',
    'where',
    'how to',
    'browse',
    'look up',
    'information about',
  ];

  const lowerMessage = userMessage.toLowerCase();
  return searchKeywords.some(keyword => lowerMessage.includes(keyword));
}
