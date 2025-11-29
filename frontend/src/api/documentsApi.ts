import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface Document {
    id: string;
    text: string;
    metadata: any;
}

export interface ListResponse {
    chunks: Document[];
    total: number;
    offset: number;
    limit: number;
}

export interface StatsResponse {
    total_chunks: number;
    total_tokens: number;
    last_updated: string | null;
}

export const fetchDocuments = async (offset: number = 0, limit: number = 10, search?: string): Promise<ListResponse> => {
    const params: Record<string, any> = { offset, limit };
    if (search) {
        params.q = search;
    }
    const response = await axios.get<ListResponse>(`${API_BASE_URL}/list`, { params });
    return response.data;
};

export const fetchStats = async (): Promise<StatsResponse> => {
    const response = await axios.get<StatsResponse>(`${API_BASE_URL}/stats`);
    return response.data;
};

export const deleteChunks = async (ids?: string[], deleteAll?: boolean): Promise<any> => {
    const payload: any = {};
    if (deleteAll) {
        payload.delete_all = true;
    } else if (ids) {
        payload.ids = ids;
    }

    // Axios delete with body requires 'data' property in config
    const response = await axios.delete(`${API_BASE_URL}/delete`, { data: payload });
    return response.data;
};
