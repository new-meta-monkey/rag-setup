import axios from 'axios';
import { API_BASE_URL } from '../config';
import { ProviderConfig } from '../store/settingsStore';

export const fetchSettings = async (): Promise<Partial<ProviderConfig>> => {
    const response = await axios.get(`${API_BASE_URL}/settings`);
    return response.data;
};

export const saveSettings = async (settings: ProviderConfig): Promise<void> => {
    await axios.post(`${API_BASE_URL}/settings`, settings);
};
