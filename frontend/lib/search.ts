import { api } from './api';

export interface SearchResult {
  query: string;
  results: {
    projects?: any[];
    tickets?: any[];
    clients?: any[];
    invoices?: any[];
    products?: any[];
  };
}

export async function search(query: string): Promise<SearchResult> {
  if (query.length < 2) {
    return { query, results: {} };
  }
  const response = await api.get<SearchResult>('/search', { params: { q: query } });
  return response.data;
}
