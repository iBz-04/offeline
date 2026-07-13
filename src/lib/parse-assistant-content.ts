export function parseAssistantContent(content: string) {
  const thinkMatch = content.match(/^([\s\S]*?)<\/think>\s*/i);
  if (thinkMatch) {
    return {
      thought: thinkMatch[1].trim(),
      body: content.slice(thinkMatch[0].length).trim(),
    };
  }

  const thinkingMatch = content.match(/^<thinking>([\s\S]*?)<\/thinking>\s*/i);
  if (thinkingMatch) {
    return {
      thought: thinkingMatch[1].trim(),
      body: content.slice(thinkingMatch[0].length).trim(),
    };
  }

  return { thought: null, body: content };
}
