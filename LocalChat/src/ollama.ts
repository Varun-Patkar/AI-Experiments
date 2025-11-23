import { OllamaModel, OllamaResponse, ChatContextMessage } from './types';

const OLLAMA_BASE_URL = 'http://localhost:11434';

export const ollamaService = {
  checkConnection: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      console.error('Ollama connection error:', error);
      return false;
    }
  },

  getModels: async (): Promise<OllamaModel[]> => {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  },

  chat: async (
    model: string,
    messages: ChatContextMessage[],
    onChunk: (chunk: string, isReasoning: boolean) => void,
    signal?: AbortSignal
  ): Promise<void> => {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data: OllamaResponse = JSON.parse(line);
              
              // Handle thinking/reasoning field (newer models like qwen3)
              if (data.message?.thinking) {
                onChunk(data.message.thinking, true);
              }
              
              // Handle regular content
              if (data.message?.content) {
                onChunk(data.message.content, false);
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Error in chat:', error);
        throw error;
      }
    }
  },

  supportsVision: (modelName: string): boolean => {
    const modelLower = modelName.toLowerCase();
    // Check for explicit vision models
    const visionModels = ['llava', 'bakllava', 'vision', 'minicpm-v', 'internvl', 'cogvlm'];
    if (visionModels.some(vm => modelLower.includes(vm))) {
      return true;
    }
    // Check for qwen vision models (qwen2-vl, qwenvl, etc.)
    if (modelLower.includes('qwen') && modelLower.includes('vl')) {
      return true;
    }
    return false;
  },

  isReasoningModel: (modelName: string): boolean => {
    const modelLower = modelName.toLowerCase();
    // Explicit reasoning models that output thinking/reasoning
    if (modelLower.includes('deepseek-r1')) return true;
    if (modelLower.includes('qwq')) return true;
    if (modelLower.includes('qwen3')) return true;
    return false;
  }
};
