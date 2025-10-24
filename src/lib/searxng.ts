export interface SearchResult {
  title: string;
  url: string;
  content: string;
  engine: string;
  publishedDate?: string;
}

export interface SearXNGResponse {
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

export class SearXNGClient {
  private static instance: SearXNGClient;
  private requestCount: number = 0;
  private requestWindow: number = Date.now();
  private readonly MAX_REQUESTS_PER_MINUTE = 30;

  private constructor() {}

  static getInstance(): SearXNGClient {
    if (!SearXNGClient.instance) {
      SearXNGClient.instance = new SearXNGClient();
    }
    return SearXNGClient.instance;
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
  ): Promise<SearXNGResponse> {
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please wait a moment before searching again.');
    }

    await this.throttleRequest();

    const { maxResults = 8 } = options;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // Using DuckDuckGo Lite API endpoint (no tracking, no JS required)
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        no_redirect: '1',
        no_html: '1',
        skip_disambig: '1',
      });

      const response = await fetch(
        `https://api.duckduckgo.com/?${params.toString()}`,
        {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Search failed with status: ${response.status}`);
      }

      const data = await response.json() as any;
      const results = this.parseResults(data, maxResults);

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
    } catch (error) {
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

export const searxngClient = SearXNGClient.getInstance();
