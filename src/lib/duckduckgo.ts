export interface SearchResult {
  title: string;
  url: string;
  content: string;
  engine: string;
  publishedDate?: string;
}

export interface SearchResponse {
  query: string;
  number_of_results: number;
  results: SearchResult[];
  suggestions?: string[];
  answers?: string[];
  corrections?: string[];
}

export interface SearchOptions {
  maxResults?: number;
  categories?: string;
  language?: string;
  timeRange?: 'day' | 'month' | 'year';
}

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100;

export class DuckDuckGoClient {
  private static instance: DuckDuckGoClient;
  private requestCount: number = 0;
  private requestWindow: number = Date.now();
  private readonly MAX_REQUESTS_PER_MINUTE = 30;

  private constructor() {}

  static getInstance(): DuckDuckGoClient {
    if (!DuckDuckGoClient.instance) {
      DuckDuckGoClient.instance = new DuckDuckGoClient();
    }
    return DuckDuckGoClient.instance;
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    if (now - this.requestWindow > 60000) {
      this.requestWindow = now;
      this.requestCount = 0;
    }
    
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      return false;
    }
    
    this.requestCount++;
    return true;
  }

  private async throttleRequest(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => 
        setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
      );
    }
    
    lastRequestTime = Date.now();
  }

  async search(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResponse> {
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please wait a moment before searching again.');
    }

    await this.throttleRequest();

    const { maxResults = 8 } = options;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // Using DuckDuckGo Lite API endpoint via CORS proxy (to avoid CORS errors in browser)
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        no_redirect: '1',
        no_html: '1',
        skip_disambig: '1',
      });

      const apiUrl = `https://api.duckduckgo.com/?${params.toString()}`;
      
      // Try multiple CORS proxies in order of preference
      const proxies = [
        'https://api.allorigins.win/raw?url=',
        'https://cors-anywhere.herokuapp.com/',
      ];

      let lastError: Error | null = null;
      
      for (const proxy of proxies) {
        try {
          const proxyUrl = proxy === 'https://api.allorigins.win/raw?url=' 
            ? `${proxy}${encodeURIComponent(apiUrl)}`
            : `${proxy}${apiUrl}`;

          const response = await fetch(proxyUrl, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json() as any;
            const results = this.parseResults(data, maxResults);

            clearTimeout(timeoutId);

            return {
              query,
              number_of_results: results.length,
              results,
              suggestions: data.RelatedTopics
                ? data.RelatedTopics.filter((t: any) => !t.Result)
                    .slice(0, 3)
                    .map((t: any) => t.Topics?.[0])
                    .filter(Boolean)
                : [],
            };
          }
        } catch (error) {
          lastError = error as Error;
          console.warn(`Proxy ${proxy} failed:`, error);
        }
      }

      clearTimeout(timeoutId);
      throw lastError || new Error('All search proxies failed');
    } catch (error) {
      console.error('DuckDuckGo search error:', error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseResults(data: any, maxResults: number): SearchResult[] {
    const results: SearchResult[] = [];

    // Parse instant answer if available
    if (data.AbstractText) {
      results.push({
        title: 'Direct Answer',
        url: data.AbstractURL || '',
        content: data.AbstractText,
        engine: 'duckduckgo',
      });
    }

    // Parse related topics
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics) {
        if (results.length >= maxResults) break;

        if (topic.Result) {
          // Clean HTML tags from result
          const content = topic.Result.replace(/<[^>]*>/g, '');
          results.push({
            title: topic.Text || 'Result',
            url: topic.FirstURL || '',
            content: content,
            engine: 'duckduckgo',
          });
        }
      }
    }

    // If no results, return a message
    if (results.length === 0) {
      results.push({
        title: 'No specific results',
        url: `https://duckduckgo.com/?q=${encodeURIComponent(data.query || 'search')}`,
        content: 'No direct results found. Try a more specific search query.',
        engine: 'duckduckgo',
      });
    }

    return results.slice(0, maxResults);
  }

  formatResultsForContext(results: SearchResult[]): string {
    if (!results || results.length === 0) {
      return 'No search results found.';
    }

    let context = 'Web Search Results:\n\n';
    
    results.forEach((result, index) => {
      const content = result.content.length > 200 
        ? result.content.substring(0, 200) + '...'
        : result.content;
      
      context += `[${index + 1}] ${result.title}\n`;
      if (result.url) {
        context += `URL: ${result.url}\n`;
      }
      context += `${content}\n`;
      if (result.publishedDate) {
        context += `Published: ${result.publishedDate}\n`;
      }
      context += '\n';
    });

    return context;
  }
}

export const duckduckgoClient = DuckDuckGoClient.getInstance();
