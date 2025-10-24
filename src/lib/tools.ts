/**
 * Tool/Function definitions for AI models that support function calling
 * Implements web search as a callable tool for AI agents
 */

import { duckduckgoClient } from './duckduckgo';
import { SearchResult } from './duckduckgo';
import { tavilyClient } from './tavily';

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required: string[];
    };
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolResult {
  tool_call_id: string;
  role: 'tool';
  name: string;
  content: string;
}

/**
 * Web search tool definition for AI models
 */
export const webSearchTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'web_search',
    description: 'Search the internet for current information, news, facts, or any real-time data. Use this when you need up-to-date information that you don\'t have in your training data. Returns a list of search results with titles, URLs, and content snippets.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query. Be specific and use keywords that will return relevant results. Examples: "latest AI news 2025", "current weather in New York", "what happened today"',
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of search results to return (1-10). Default is 8.',
          default: 8,
        }
      },
      required: ['query'],
    },
  },
};

/**
 * Get current date/time tool definition
 */
export const getCurrentDateTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_current_date',
    description: 'Get the current date and time. Use this when the user asks about today\'s date, current time, or anything related to "now".',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
};

/**
 * All available tools
 */
export const availableTools: ToolDefinition[] = [
  webSearchTool,
  getCurrentDateTool,
];

/**
 * Execute a tool call and return the result
 */
export async function executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
  const { name, arguments: argsJson } = toolCall.function;
  
  try {
    const args = JSON.parse(argsJson);
    
    switch (name) {
      case 'web_search':
        return await executeWebSearch(toolCall.id, args);
      
      case 'get_current_date':
        return executeGetCurrentDate(toolCall.id);
      
      default:
        return {
          tool_call_id: toolCall.id,
          role: 'tool',
          name,
          content: JSON.stringify({ error: `Unknown tool: ${name}` }),
        };
    }
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error);
    return {
      tool_call_id: toolCall.id,
      role: 'tool',
      name,
      content: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
    };
  }
}

/**
 * Execute web search tool
 */
async function executeWebSearch(
  toolCallId: string,
  args: { query: string; max_results?: number }
): Promise<ToolResult> {
  const maxResults = args.max_results || 8;
  
  try {
    // Try to use desktop search API first (Electron app)
    if (typeof window !== 'undefined' && (window as any).offlineAPI?.search?.web) {
      console.log('[Web Search] Using desktop search API');
      const results = await (window as any).offlineAPI.search.web(args.query, maxResults);
      
      const formattedResults = results.map((result: any, index: number) => ({
        index: index + 1,
        title: result.title,
        url: result.url,
        snippet: result.content,
        published: result.publishedDate || 'N/A',
      }));
      
      return {
        tool_call_id: toolCallId,
        role: 'tool',
        name: 'web_search',
        content: JSON.stringify({
          query: args.query,
          results_count: formattedResults.length,
          results: formattedResults,
        }, null, 2),
      };
    }

    // Choose backend: prefer Tavily if selected and API key available, else fallback to DuckDuckGo
    let useTavily = false;
    if (typeof window !== 'undefined') {
      const selected = localStorage.getItem('searchBackend');
      useTavily = selected === 'tavily';
    }

    if (useTavily) {
      try {
        console.log('[Web Search] Using Tavily API');
        const response = await tavilyClient.search(args.query, {
          maxResults: Math.min(maxResults, 10),
          searchDepth: 'basic',
          includeAnswer: true,
          topic: 'general',
        });

        const formattedResults = response.results.map((result: any, index: number) => ({
          index: index + 1,
          title: result.title,
          url: result.url,
          snippet: (result as any).content ?? '',
          published: (result as any).publishedDate || 'N/A',
        }));

        return {
          tool_call_id: toolCallId,
          role: 'tool',
          name: 'web_search',
          content: JSON.stringify({
            query: args.query,
            results_count: formattedResults.length,
            results: formattedResults,
          }, null, 2),
        };
      } catch (err) {
        console.warn('[Web Search] Tavily failed, falling back to DuckDuckGo:', err instanceof Error ? err.message : err);
        // fall through to DuckDuckGo below
      }
    }

    // Fallback to browser-based DuckDuckGo (limited by CORS)
    console.log('[Web Search] Using browser DuckDuckGo API (CORS limited)');
    const response = await duckduckgoClient.search(args.query, {
      maxResults: Math.min(maxResults, 10),
      categories: 'general',
      language: 'en',
    });
    
    // Format results for the AI
    const formattedResults = response.results.map((result: SearchResult, index: number) => ({
      index: index + 1,
      title: result.title,
      url: result.url,
      snippet: result.content,
      published: result.publishedDate || 'N/A',
    }));
    
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      name: 'web_search',
      content: JSON.stringify({
        query: args.query,
        results_count: formattedResults.length,
        results: formattedResults,
      }, null, 2),
    };
  } catch (error) {
    return {
      tool_call_id: toolCallId,
      role: 'tool',
      name: 'web_search',
      content: JSON.stringify({ 
        error: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        results: [],
      }),
    };
  }
}

/**
 * Execute get current date tool
 */
function executeGetCurrentDate(toolCallId: string): ToolResult {
  const now = new Date();
  
  return {
    tool_call_id: toolCallId,
    role: 'tool',
    name: 'get_current_date',
    content: JSON.stringify({
      date: now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: now.toLocaleTimeString('en-US'),
      iso: now.toISOString(),
      timestamp: now.getTime(),
    }),
  };
}

/**
 * Format tool results for display in chat
 */
export function formatToolResultsForDisplay(results: SearchResult[]): string {
  if (!results || results.length === 0) {
    return 'No search results found.';
  }
  
  return results
    .map((result, index) => 
      `[${index + 1}] ${result.title}\n${result.url}\n${result.content}`
    )
    .join('\n\n');
}

/**
 * Check if a model supports function calling
 * Based on research from Ollama docs and HuggingFace benchmarks
 */
export function modelSupportsFunctionCalling(modelId: string): boolean {
  // Models known to support function calling (case-insensitive matching)
  const functionCallingModels = [
    // Llama family - Best performers
    'llama-3.2',
    'llama-3.1',
    'llama3.2',
    'llama3.1',
    'llama3-groq',
    
    // Hermes family - Excellent function calling
    'hermes-2-pro',
    'hermes-3',
    'nous-hermes',
    
    // Mixtral family - Outperforms GPT-3.5
    'mixtral',
    'mistral-nemo',
    'mistral-small',
    
    // Command family
    'command-r',
    
    // Qwen family
    'qwen',
    'qwen2',
    
    // Gemma family
    'gemma-2',
    'gemma2',
    'gemma3',
    
    // Specialized function calling models
    'firefunction',
    'nexusraven',
    'functionary',
    
    // Others
    'granite-functioncalling',
    'deepseek-r1',
  ];
  
  const lowerModelId = modelId.toLowerCase();
  
  // Check if model ID contains any of the function calling model patterns
  return functionCallingModels.some(model => 
    lowerModelId.includes(model.toLowerCase())
  );
}
