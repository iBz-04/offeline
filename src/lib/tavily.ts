export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  raw_content?: string;
}

export interface TavilySearchResponse {
  results: TavilySearchResult[];
  query: string;
  response_time: number;
  follow_up_questions?: string[];
  answer?: string;
}

export interface SearchOptions {
  maxResults?: number;
  searchDepth?: 'basic' | 'advanced';
  includeAnswer?: boolean;
  includeRawContent?: boolean;
  topic?: 'general' | 'news';
}

export class TavilyClient {
  private static instance: TavilyClient;
  private apiKey: string;
  private baseUrl = 'https://api.tavily.com/search';
  private requestCount: number = 0;
  private requestWindow: number = Date.now();
  private readonly MAX_REQUESTS_PER_MINUTE = 120; // Tavily allows up to 120 requests per minute on basic plan

  private constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  static getInstance(apiKey?: string): TavilyClient {
    if (!TavilyClient.instance) {
      const key = apiKey || 
        (typeof window !== 'undefined' ? localStorage.getItem('tavilyApiKey') || '' : '');
      TavilyClient.instance = new TavilyClient(key);
    }
    return TavilyClient.instance;
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
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

  async search(
    query: string,
    options: SearchOptions = {}
  ): Promise<TavilySearchResponse> {
    if (!this.apiKey) {
      throw new Error('Tavily API key is not configured. Please set your API key in Search Settings or in the NEXT_PUBLIC_TAVILY_API_KEY environment variable.');
    }

    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please wait a moment before searching again.');
    }

    const {
      maxResults = 8,
      searchDepth = 'basic',
      includeAnswer = true,
      includeRawContent = true,
      topic = 'general',
    } = options;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const requestBody = {
        api_key: this.apiKey,
        query: query,
        include_answer: includeAnswer,
        search_depth: searchDepth,
        max_results: maxResults,
        include_raw_content: includeRawContent,
        topic: topic,
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Ignore JSON parse error, use HTTP status as fallback
        }
        throw new Error(`Tavily API error: ${errorMessage}`);
      }

      const data: TavilySearchResponse = await response.json();

      // Convert Tavily results to our standard SearchResult format
      return {
        ...data,
        results: data.results.map(result => ({
          ...result,
          content: result.raw_content || result.content || '',
        })),
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Search request timed out. Please try again.');
        }
        throw error;
      }
      throw new Error('An unknown error occurred during search');
    }
  }

  formatResultsForContext(results: TavilySearchResult[]): string {
    if (!results || results.length === 0) {
      return '';
    }

    const formattedResults = results
      .map((result, index) => {
        return `[${index + 1}] ${result.title}\nURL: ${result.url}\nContent: ${result.content}\n`;
      })
      .join('\n');

    return `Search Results:\n\n${formattedResults}`;
  }
}

// Initialize client - will be set up with API key from env or localStorage
export const tavilyClient = TavilyClient.getInstance(
  typeof window !== 'undefined' 
    ? localStorage.getItem('tavilyApiKey') || process.env.NEXT_PUBLIC_TAVILY_API_KEY || ''
    : process.env.NEXT_PUBLIC_TAVILY_API_KEY || ''
);
