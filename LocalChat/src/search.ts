const SEARXNG_BASE_URL = 'http://localhost:8082';

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  engine: string;
}

export interface SearchResponse {
  query: string;
  number_of_results: number;
  results: SearchResult[];
}

export const searchService = {
  checkConnection: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${SEARXNG_BASE_URL}/search?q=test&format=json`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      console.error('SearXNG connection error:', error);
      return false;
    }
  },

  search: async (query: string): Promise<SearchResponse> => {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(`${SEARXNG_BASE_URL}/search?q=${encodedQuery}&format=json`);
      
      if (!response.ok) {
        throw new Error(`Search API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error performing search:', error);
      throw error;
    }
  },

  formatSearchResults: (results: SearchResult[], maxResults: number = 5): string => {
    if (results.length === 0) {
      return 'No search results found.';
    }

    const topResults = results.slice(0, maxResults);
    let formatted = 'Search Results:\n\n';
    
    topResults.forEach((result, index) => {
      formatted += `${index + 1}. ${result.title}\n`;
      formatted += `   URL: ${result.url}\n`;
      formatted += `   ${result.content}\n\n`;
    });

    return formatted;
  }
};
