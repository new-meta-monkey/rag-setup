import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface ExtractResponse {
    text: string;
    pages: any[];
    file_id: string;
    filename: string;
    saved_path: string;
}

export interface ChunkResponse {
    chunks: any[];
    metrics: {
        total_chunks: number;
        avg_size: number;
        min_size: number;
        max_size: number;
        time_taken_ms?: number;
    };
}

export const extractText = async (file: File): Promise<ExtractResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post<ExtractResponse>(`${API_BASE_URL}/extract`, formData);
    return response.data;
};

export const generateChunks = async (payload: any): Promise<ChunkResponse> => {
    const response = await axios.post<ChunkResponse>(`${API_BASE_URL}/chunk`, payload);
    return response.data;
};

export const storeChunks = async (payload: any): Promise<any> => {
    const response = await axios.post(`${API_BASE_URL}/store`, payload);
    return response.data;
};
