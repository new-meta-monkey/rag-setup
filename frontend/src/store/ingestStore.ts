import { create } from 'zustand';

interface ChunkMetrics {
    total_chunks: number;
    avg_size: number;
    min_size: number;
    max_size: number;
    time_taken_ms?: number; // Optional: frontend-calculated timing
}

export interface Chunk {
    text: string;
    metadata: Record<string, any>;
}

interface IngestState {
    // Input
    inputType: 'text' | 'file';
    textInput: string;
    file: File | null;
    fileId: string | null;
    pages: any[]; // Store extracted pages with metadata

    // Configuration
    strategy: string;
    strategyConfig: Record<string, any>;

    // Output
    chunks: Chunk[];
    metrics: ChunkMetrics | null;

    // Actions
    setInputType: (type: 'text' | 'file') => void;
    setTextInput: (text: string) => void;
    setFile: (file: File | null) => void;
    setFileId: (id: string | null) => void;
    setPages: (pages: any[]) => void;
    setStrategy: (strategy: string) => void;
    setStrategyConfig: (config: Record<string, any>) => void;
    setChunks: (chunks: Chunk[]) => void;
    setMetrics: (metrics: ChunkMetrics | null) => void;
    reset: () => void;
}

export const useIngestStore = create<IngestState>((set) => ({
    inputType: 'text',
    textInput: '',
    file: null,
    fileId: null,
    pages: [],
    strategy: 'character',
    strategyConfig: {},
    chunks: [],
    metrics: null,



    setInputType: (type) => set({ inputType: type }),
    setTextInput: (text) => set({ textInput: text }),
    setFile: (file) => set({ file }),
    setFileId: (id) => set({ fileId: id }),
    setPages: (pages) => set({ pages }),
    setStrategy: (strategy) => set({ strategy }),
    setStrategyConfig: (config) => set({ strategyConfig: config }),
    setChunks: (chunks) => set({ chunks }),
    setMetrics: (metrics) => set({ metrics }),

    reset: () => set({
        inputType: 'text',
        textInput: '',
        file: null,
        fileId: null,
        pages: [],
        strategy: 'character',
        strategyConfig: {},
        chunks: [],
        metrics: null
    })
}));
