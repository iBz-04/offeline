import { spawn, ChildProcess } from 'child_process';
import axios from 'axios';
import { EventEmitter } from 'events';

interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

interface ChatMessage {
  role: string;
  content: string;
}

interface SearchResult {
  title: string;
  url: string;
  content: string;
}

export class OllamaManager extends EventEmitter {
  private process: ChildProcess | null = null;
  private readonly apiUrl = 'http://localhost:11434';
  private healthCheckInterval: NodeJS.Timeout | null = null;

  async start(): Promise<void> {
    if (await this.isRunning()) {
      console.log('Ollama is already running');
      return;
    }

    this.process = spawn('ollama', ['serve'], {
      detached: false,
      stdio: 'pipe',
    });

    this.process.on('error', (error) => {
      this.emit('error', `Failed to start Ollama: ${error.message}`);
    });

    await this.waitForReady();
    this.startHealthCheck();
  }

  async stop(): Promise<void> {
    this.stopHealthCheck();
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  async isRunning(): Promise<boolean> {
    try {
      await axios.get(`${this.apiUrl}/api/tags`, { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  private async waitForReady(maxAttempts = 30, delayMs = 500): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      if (await this.isRunning()) {
        this.emit('ready');
        return;
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    throw new Error('Ollama failed to start within timeout period');
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      const running = await this.isRunning();
      this.emit('health', running);
      if (!running && this.process) {
        this.emit('error', 'Ollama server stopped unexpectedly');
      }
    }, 10000);
  }

  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/tags`);
      return response.data.models || [];
    } catch (error) {
      throw new Error(`Failed to list models: ${error}`);
    }
  }

  async pullModel(modelName: string): Promise<void> {
    const response = await axios.post(
      `${this.apiUrl}/api/pull`,
      { name: modelName },
      { responseType: 'stream' }
    );

    return new Promise((resolve, reject) => {
      let buffer = '';

      response.data.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        lines.forEach(line => {
          if (!line.trim()) return;
          try {
            const data = JSON.parse(line);
            if (data.status) {
              const completed = data.completed || 0;
              const total = data.total || 0;
              
              if (
                total > 0 ||
                data.status === 'success' ||
                (typeof data.status === 'string' && data.status.includes('pulling'))
              ) {
                this.emit('pullProgress', {
                  model: modelName,
                  status: data.status,
                  completed,
                  total: total > 0 ? total : completed, 
                });
              }
            }
            if (data.status === 'success') {
              resolve();
            }
          } catch (e) {
            console.error('Failed to parse pull progress:', e);
          }
        });
      });

      response.data.on('error', reject);
      response.data.on('end', () => {
        if (buffer.trim()) {
          try {
            const data = JSON.parse(buffer);
            if (data.status === 'success') {
              resolve();
            }
          } catch (e) {
            console.error('Failed to parse final pull status:', e);
          }
        }
        resolve();
      });
    });
  }

  async deleteModel(modelName: string): Promise<void> {
    await axios.delete(`${this.apiUrl}/api/delete`, {
      data: { name: modelName },
    });
  }

  async chat(
    model: string,
    messages: ChatMessage[],
    stream = true
  ): Promise<string> {
    const response = await axios.post(
      `${this.apiUrl}/api/chat`,
      { model, messages, stream },
      { responseType: stream ? 'stream' : 'json' }
    );

    if (!stream) {
      return response.data.message.content;
    }

    return new Promise((resolve, reject) => {
      let fullResponse = '';
      let buffer = '';

      response.data.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        lines.forEach(line => {
          if (!line.trim()) return;
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              fullResponse += data.message.content;
              this.emit('chatToken', data.message.content);
            }
            if (data.done) {
              resolve(fullResponse);
            }
          } catch (e) {
            console.error('Failed to parse chat response:', e);
          }
        });
      });

      response.data.on('error', reject);
      response.data.on('end', () => {
        if (buffer.trim()) {
          try {
            const data = JSON.parse(buffer);
            if (data.done) {
              resolve(fullResponse);
            }
          } catch (e) {
            console.error('Failed to parse final chat response:', e);
          }
        }
        resolve(fullResponse);
      });
    });
  }

  async showModelInfo(modelName: string): Promise<any> {
    const response = await axios.post(`${this.apiUrl}/api/show`, {
      name: modelName,
    });
    return response.data;
  }

  async search(query: string, maxResults: number = 8): Promise<SearchResult[]> {
    try {
      console.log('[Web Search] Searching for:', query);
      
      // Use DuckDuckGo HTML scraping approach - more reliable than API
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      
      const response = await axios.get(searchUrl, {
        timeout: 15000,
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        maxRedirects: 5,
      });

      const html = response.data;
      const results: SearchResult[] = [];

      // Parse HTML results using regex (lightweight alternative to cheerio)
      // Match result blocks: <div class="result">...</div>
      const resultBlockRegex = /<div class="result[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g;
      let match;

      while ((match = resultBlockRegex.exec(html)) !== null && results.length < maxResults) {
        const block = match[1];
        
        // Extract title and URL from <a class="result__a">
        const titleMatch = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/.exec(block);
        if (!titleMatch) continue;
        
        const url = titleMatch[1].replace(/^\/\/duckduckgo\.com\/l\/\?uddg=/, '').split('&')[0];
        const title = titleMatch[2]
          .replace(/<b>/g, '')
          .replace(/<\/b>/g, '')
          .replace(/<[^>]+>/g, '')
          .trim();
        
        // Extract snippet from <a class="result__snippet">
        const snippetMatch = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/.exec(block);
        const content = snippetMatch 
          ? snippetMatch[1]
              .replace(/<b>/g, '')
              .replace(/<\/b>/g, '')
              .replace(/<[^>]+>/g, '')
              .trim()
          : '';

        if (title && url) {
          try {
            // Decode URL
            const decodedUrl = decodeURIComponent(url);
            results.push({
              title: title,
              url: decodedUrl.startsWith('http') ? decodedUrl : `https://${decodedUrl}`,
              content: content || 'No description available.',
            });
          } catch (e) {
            console.error('[Web Search] Failed to decode URL:', e);
          }
        }
      }

      console.log(`[Web Search] Found ${results.length} results`);

      // If no results found, try the instant answer API as fallback
      if (results.length === 0) {
        console.log('[Web Search] Trying instant answer API as fallback...');
        const params = new URLSearchParams({
          q: query,
          format: 'json',
          no_redirect: '1',
          no_html: '1',
          skip_disambig: '1',
        });

        const apiResponse = await axios.get(
          `https://api.duckduckgo.com/?${params.toString()}`,
          {
            timeout: 10000,
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          }
        );

        const data = apiResponse.data;

        // Parse instant answer
        if (data.AbstractText) {
          results.push({
            title: data.Heading || 'Direct Answer',
            url: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
            content: data.AbstractText,
          });
        }

        // Parse related topics
        if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
          for (const topic of data.RelatedTopics) {
            if (results.length >= maxResults) break;

            if (topic.Text && topic.FirstURL) {
              results.push({
                title: topic.Text.split(' - ')[0],
                url: topic.FirstURL,
                content: topic.Text,
              });
            }
          }
        }
      }

      // If still no results, return a helpful message
      if (results.length === 0) {
        results.push({
          title: 'No results found',
          url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          content: `No results found for "${query}". Try rephrasing your search query or use different keywords.`,
        });
      }

      return results.slice(0, maxResults);
    } catch (error) {
      console.error('[Web Search] Search failed:', error);
      
      // Return error as a result so AI knows what happened
      return [{
        title: 'Search Error',
        url: '',
        content: `Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or rephrase your query.`,
      }];
    }
  }
}
