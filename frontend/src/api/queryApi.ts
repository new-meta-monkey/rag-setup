import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface QueryRequest {
    query: string;
    embedding_provider: string;
    embedding_config: Record<string, any>;
    llm_provider: string;
    llm_config: Record<string, any>;
    n_results?: number;
    min_score?: number;
    temperature?: number;
    max_tokens?: number;
    history?: { role: string; content: string }[];
}

export interface Source {
    chunk_id: number;
    text: string;
    metadata: Record<string, any>;
    score: number;
}

export interface QueryResponse {
    answer: string;
    sources: Source[];
    query: string;
}

export const queryKnowledge = async (request: QueryRequest): Promise<QueryResponse> => {
    const response = await axios.post<QueryResponse>(`${API_BASE_URL}/query`, request);
    return response.data;
};
