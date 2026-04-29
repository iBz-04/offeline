/**
 * Tool/Function definitions for AI models that support function calling
 */

// Client-side toast notifications - will be set by client component
let toastFn: ((message: string, type: 'error' | 'warning') => void) | null = null;

export function setToastFunction(fn: (message: string, type: 'error' | 'warning') => void) {
  toastFn = fn;
}

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
  getCurrentDateTool,
];

/**
 * Execute a tool call and return the result
 */
export async function executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
  const { name, arguments: argsJson } = toolCall.function;
  
  try {
    JSON.parse(argsJson);
    
    switch (name) {
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
