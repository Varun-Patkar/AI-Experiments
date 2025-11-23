import { searchService, SearchResult } from './search';

interface SearchIteration {
  query: string;
  results: SearchResult[];
  evaluation: string;
  confidence: number;
}

export interface SearchAgentResult {
  iterations: SearchIteration[];
  searchContext: string; // Accumulated search results context
  reasoning: string;
}

const MAX_ITERATIONS = 3;
const CONFIDENCE_THRESHOLD = 0.8;

export const searchAgent = {
  /**
   * Performs iterative search with LLM reasoning loop
   * @param searchModel - The Ollama model for search query generation and evaluation (qwen2.5:1.5b)
   * @param answerModel - The Ollama model for final answer generation (user's selected model)
   * @param userQuery - The user's original question
   * @param onUpdate - Callback for streaming updates
   */
  async performSearchWithReasoning(
    searchModel: string,
    userQuery: string,
    onUpdate: (reasoning: string, searches: string[]) => void
  ): Promise<SearchAgentResult> {
    const iterations: SearchIteration[] = [];
    const searchQueries: string[] = [];
    let accumulatedContext = '';
    let fullReasoning = '';

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      // Step 1: Generate search query
      const queryPrompt = i === 0
        ? `Given this user question: ${userQuery}

Generate a focused search query to find relevant information on the web. Output ONLY the search query text without quotes or any other formatting. Just the plain search terms.

Search query:`
        : `Previous search did not provide sufficient information.
Query used: ${iterations[i - 1].query}
        
User question: ${userQuery}
Previous evaluation: ${iterations[i - 1].evaluation}

Generate a NEW, more specific search query. Output ONLY the search query text without quotes or any other formatting. Just the plain search terms.

Search query:`;

      let searchQuery = await this.generateText(searchModel, queryPrompt);
      // Clean up the query - remove any quotes that the model might have added
      searchQuery = searchQuery.replace(/^["']|["']$/g, '').trim();
      searchQueries.push(searchQuery);

      fullReasoning += `🔍 Search ${i + 1}: ${searchQuery}\n`;
      onUpdate(fullReasoning, searchQueries);

      // Step 2: Perform search
      try {
        const searchResponse = await searchService.search(searchQuery);
        const results = searchResponse.results.slice(0, 5);

        if (results.length === 0) {
          fullReasoning += `❌ No results found\n`;
          onUpdate(fullReasoning, searchQueries);
          continue;
        }

        fullReasoning += `✅ Found ${results.length} results\n`;
        onUpdate(fullReasoning, searchQueries);

        // Format search results for context
        const resultsContext = searchService.formatSearchResults(results, 5);
        accumulatedContext += `\n\n--- Search Results for: ${searchQuery} ---\n${resultsContext}`;

        // Step 3: Evaluate if we have enough information
        const evaluationPrompt = `User question: ${userQuery}

Search results:
${resultsContext}

All previous context:
${accumulatedContext}

Evaluate if we have enough information to answer the question. Respond ONLY in this format:
CONFIDENCE: [number from 0-100]
EXPLANATION: [brief explanation]`;

        const evaluation = await this.generateText(searchModel, evaluationPrompt);
        fullReasoning += `📊 ${evaluation}\n`;
        onUpdate(fullReasoning, searchQueries);

        // Parse confidence
        const confidenceMatch = evaluation.match(/CONFIDENCE:\s*(\d+)/i);
        const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) / 100 : 0.5;

        iterations.push({
          query: searchQuery,
          results,
          evaluation,
          confidence,
        });

        // Step 4: Check if we should stop
        if (confidence >= CONFIDENCE_THRESHOLD) {
          fullReasoning += `\n✅ Confidence threshold reached! Generating final answer...\n`;
          onUpdate(fullReasoning, searchQueries);
          break;
        }

        // Check if we're not making progress
        if (i > 0 && iterations[i].confidence <= iterations[i - 1].confidence) {
          fullReasoning += `\n⚠️ No significant progress. Stopping search...\n`;
          onUpdate(fullReasoning, searchQueries);
          break;
        }

        if (i < MAX_ITERATIONS - 1) {
          fullReasoning += `\n🔄 Refining search...\n`;
          onUpdate(fullReasoning, searchQueries);
        }
      } catch (error) {
        fullReasoning += `\n❌ Search error: ${error instanceof Error ? error.message : 'Unknown error'}\n`;
        onUpdate(fullReasoning, searchQueries);
        break;
      }
    }

    // Search complete, return context for streaming generation
    fullReasoning += `\n✅ Search complete. Ready for final answer generation.\n`;
    onUpdate(fullReasoning, searchQueries);

    return {
      iterations,
      searchContext: accumulatedContext,
      reasoning: fullReasoning,
    };
  },

  /**
   * Helper to generate text from the model (non-streaming)
   */
  async generateText(model: string, prompt: string): Promise<string> {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response.trim();
  },

  /**
   * Generate text with thinking/reasoning support (for reasoning models)
   */
  async generateTextWithReasoning(model: string, prompt: string): Promise<{ content: string; thinking?: string }> {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.response?.trim() || '',
      thinking: data.thinking?.trim() || undefined,
    };
  },
};
