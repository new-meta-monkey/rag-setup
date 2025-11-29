/**
 * Application constants
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/markdown',
];

export const SUPPORTED_FILE_EXTENSIONS = ['.pdf', '.txt', '.docx', '.md'];

export const CHUNKING_STRATEGIES = [
  { value: 'character', label: 'Character-based' },
  { value: 'paragraph', label: 'Paragraph-based' },
  { value: 'sentence', label: 'Sentence-based' },
  { value: 'token', label: 'Token-based' },
  { value: 'markdown', label: 'Markdown-aware' },
  { value: 'table', label: 'Table-aware' },
  { value: 'semantic', label: 'Semantic' },
] as const;

export const DEFAULT_CHUNK_SIZE = 1000;
export const DEFAULT_CHUNK_OVERLAP = 200;
export const DEFAULT_TOP_K = 5;

