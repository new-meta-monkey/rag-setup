import { create } from 'zustand';

export interface ProviderConfig {
    embeddingProvider: 'local' | 'vertex' | 'openai' | 'azure' | 'aws';
    llmProvider: 'vertex' | 'openai';
    // Global
    systemContext: string;
    retrievalAccuracy: number; // 0.0 - 1.0
    chatHistoryLimit: number;
    // Vertex
    vertexProjectId: string;
    vertexLocation: string;
    vertexModel: string;
    vertexLLMModel: string;
    vertexCredentialsJSON: string;
    // OpenAI
    openaiApiKey: string;
    openaiModel: string;
    openaiLLMModel: string;
    // Local
    localModel: string;
    // Azure
    azureApiKey: string;
    azureEndpoint: string;
    azureApiVersion: string;
    azureDeployment: string;
    // AWS
    awsRegion: string;
    awsAccessKeyId: string;
    awsSecretAccessKey: string;
    awsModel: string;
    // LLM Params
    temperature: number;
    maxTokens: number;
}

export const DEFAULT_CONFIG: ProviderConfig = {
    embeddingProvider: 'local',
    llmProvider: 'vertex',
    systemContext: '',
    retrievalAccuracy: 0.0,
    chatHistoryLimit: 5,
    vertexProjectId: '',
    vertexLocation: 'us-central1',
    vertexModel: 'text-embedding-004',
    vertexLLMModel: 'gemini-2.5-pro',
    vertexCredentialsJSON: '',
    openaiApiKey: '',
    openaiModel: 'text-embedding-3-small',
    openaiLLMModel: 'gpt-4o-mini',
    localModel: 'all-MiniLM-L6-v2',
    azureApiKey: '',
    azureEndpoint: '',
    azureApiVersion: '2023-05-15',
    azureDeployment: '',
    awsRegion: 'us-east-1',
    awsAccessKeyId: '',
    awsSecretAccessKey: '',
    awsModel: 'amazon.titan-embed-text-v1',
    temperature: 0.7,
    maxTokens: 2048
};

import { fetchSettings, saveSettings } from '../api/settingsApi';

interface SettingsState {
    settings: ProviderConfig;
    isLoading: boolean;
    isSaving: boolean;
    updateSettings: (key: keyof ProviderConfig, value: any) => void;
    setSettings: (settings: ProviderConfig) => void;
    resetSettings: () => void;
    initialize: () => Promise<void>;
    save: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    settings: DEFAULT_CONFIG,
    isLoading: false,
    isSaving: false,
    updateSettings: (key, value) => {
        set((state) => ({
            settings: { ...state.settings, [key]: value },
        }));
        // Auto-save on change (debounced in real app, but direct for now)
        get().save();
    },
    setSettings: (settings) => set({ settings }),
    resetSettings: () => set({ settings: DEFAULT_CONFIG }),
    initialize: async () => {
        set({ isLoading: true });
        try {
            const data = await fetchSettings();
            set((state) => ({
                settings: { ...state.settings, ...data },
                isLoading: false
            }));
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            set({ isLoading: false });
        }
    },
    save: async () => {
        set({ isSaving: true });
        try {
            await saveSettings(get().settings);
            set({ isSaving: false });
        } catch (error) {
            console.error('Failed to save settings:', error);
            set({ isSaving: false });
        }
    }
}));
