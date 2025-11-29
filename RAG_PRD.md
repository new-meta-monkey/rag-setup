# Local RAG Studio – PRD

## 1. Product Summary
The goal is to create a **local RAG system** with UI control, chunking strategies, and controlled embedding workflows.

The system lets a user:
1. Configure embedding and LLM models via Settings
2. Manage API keys through UI or API parameters
3. Upload documents  
4. Extract text (locally)
5. Preview the extracted text in UI
6. Choose chunking strategy
7. Generate chunks (backend)
8. View chunk metrics
9. Store chunks → Embeddings (using configured model) → ChromaDB
10. Query stored knowledge using configured GenAI model
11. View response + retrieved context

---

## 2. High-level Architecture

### Frontend (React + Tailwind)
- Settings/Configuration Screen
- Ingest Screen
- Query Screen

### Backend (Python FastAPI)
API Endpoints:
- /settings (GET, POST, PUT) - Model configuration and API key management
- /extract
- /chunk
- /store
- /query

### Vector Store
- ChromaDB (local persistent)

### Models
- **Embedding Models** (configurable):
  - Vertex AI text-embedding-004 (default)
  - OpenAI text-embedding-3-small
  - OpenAI text-embedding-3-large
  - Hugging Face models (local)
  - Other configurable embedding providers
- **LLM Models** (configurable):
  - Vertex AI Gemini (default)
  - OpenAI GPT-4
  - OpenAI GPT-3.5-turbo
  - Other configurable LLM providers

---

## 3. Chunking Strategies

### 1. Character-based Chunking
- Sliding window by characters
- Config: max_chars, overlap

### 2. Paragraph-based Chunking
- Split by \n\n  
- Optionally merge small paragraphs  
- Overlap is optional

### 3. Sentence-based Chunking
- Use NLTK / spaCy sentence splitter
- Group N sentences
- Sentence overlap

### 4. Semantic Chunking
- Use small local embedding model  
- Split when semantic similarity drops  
- Useful for long documents

### 5. Token-based Chunking
- Use tokenizers like tiktoken  
- Chunk by tokens rather than characters

### 6. Markdown-aware Chunking
- Split by headings (H1, H2, H3)
- Preserve MD hierarchy

### 7. Table-aware Chunking
- Split tables separately  
- Treat each table as a chunk

---

## 4. Model Configuration & API Key Management

### 4.1 Model Selection
Users can configure:
- **Embedding Model**: Choose from available embedding models (Vertex AI, OpenAI, Hugging Face, etc.)
- **Retrieval/LLM Model**: Choose from available LLM models (Vertex AI Gemini, OpenAI GPT-4, GPT-3.5-turbo, etc.)

### 4.2 API Key Management
API keys can be provided through:
1. **UI Settings Panel**: 
   - Secure input fields for API keys
   - Support for multiple providers (Vertex AI, OpenAI, etc.)
   - Option to save keys (encrypted in local storage or backend config)
   - Clear/Reset functionality
2. **API Parameters**: 
   - API keys can be passed as request parameters for individual operations
   - Useful for temporary usage or programmatic access
   - Supports header-based authentication (e.g., `Authorization: Bearer <key>`)

### 4.3 Configuration Persistence
- Settings stored in backend configuration file or database
- UI settings persisted in browser local storage (encrypted)
- API key validation on save
- Support for environment variables as fallback

### 4.4 Model Provider Support
- **Vertex AI**: Requires project ID and credentials
- **OpenAI**: Requires API key
- **Hugging Face**: Supports API key or local models
- **Extensible**: Architecture supports adding new providers

---

## 5. User Flows

## 5.1 Configuration Flow
1. User navigates to Settings/Configuration screen
2. User selects desired embedding model from dropdown
3. User selects desired LLM/retrieval model from dropdown
4. User enters API keys for selected providers:
   - Option A: Enter in UI settings panel (saved securely)
   - Option B: Provide via API request parameters
5. Backend validates API keys
6. Settings are saved and applied to subsequent operations
7. User can update settings at any time

## 5.2 Document Ingestion Flow
1. Upload file  
2. Backend extracts text  
3. User previews text  
4. User chooses chunking strategy  
5. Backend chunks text  
6. UI shows:
   - chunk list
   - metrics  
7. User clicks **Store**
8. Backend:
   - Embeds chunks using configured embedding model (or override via API params)
   - Uses configured API keys (or override via API params)
   - Stores to Chroma
9. UI shows success toast

---

## 5.3 Query Flow
User enters:
- Query text
- Top-K
- Model selection (uses configured model or can override)

Backend:
1. Uses configured embedding model to embed query  
2. Retrieves from Chroma  
3. Sends context + query to configured LLM model  
4. Response returned

UI shows:
- Final answer
- Retrieved chunks (expandable)

---

## 6. Backend API Specification

### GET /settings
Retrieve current model configuration and settings.
Returns:
- embedding_model
- llm_model
- provider_configs (without sensitive keys)

### POST /settings
Create or update model configuration and API keys.
Request body:
- embedding_model: string
- llm_model: string
- api_keys: object (e.g., { "openai": "sk-...", "vertex": {...} })
- provider_config: object (additional provider-specific config)

### PUT /settings
Update existing settings (partial updates supported).

### POST /extract
Extract text from uploaded file.
Optional params:
- api_key: string (for provider-specific operations)

### POST /chunk
Apply chosen chunking strategy and return:
- chunks[]
- metrics: total, avg, max, min sizes

### POST /store
Store chunks → embed → chroma
Uses configured embedding model or accepts override via params.
Optional params:
- embedding_model: string (override)
- api_key: string (override)

### POST /query
RAG pipeline → return:
- answer
- context
- metadata
Uses configured models or accepts overrides via params.
Optional params:
- embedding_model: string (override)
- llm_model: string (override)
- api_key: string (override)

---

## 7. Backend Folder Structure
```
backend/
  api/
    settings.py (settings endpoints)
  utils/
    chunking.py
    loaders.py
    embeddings.py
    vectordb.py
    genai.py
    model_providers.py (model provider abstraction)
    config_manager.py (settings and API key management)
  config/
    settings.json (default settings, encrypted API keys)
  main.py
  chroma_store/
  data/uploads/
```

---

## 8. Frontend Structure
```
frontend/
  src/
    pages/
      SettingsPage
      IngestPage
      QueryPage
    components/
      FileUpload
      ChunkConfigForm
      ChunkPreview
      MetricsCard
      QueryBox
      ModelSelector
      ApiKeyInput
      SettingsPanel
    api/
      ragApi
      settingsApi
    utils/
      encryption (for API key encryption)
    App
```

---

## 9. UI Requirements

### Screen 0 — Settings/Configuration
- Model selection dropdowns:
  - Embedding model selector
  - LLM/Retrieval model selector
- API key input sections:
  - Secure input fields for each provider (Vertex AI, OpenAI, Hugging Face, etc.)
  - Show/hide toggle for API keys
  - Save/Reset buttons
- Configuration status indicators:
  - Validation status for API keys
  - Active model indicators
- Settings persistence toggle
- Apply/Reset buttons

### Screen 1 — Ingest
- Upload section  
- Extracted text preview  
- Chunk strategy selector  
- Dynamic parameter form  
- Generate chunks button  
- Metrics cards  
- Chunk preview accordion  
- Store button (uses configured embedding model)

### Screen 2 — Query
- Input box  
- Top-K slider  
- Model selector (shows configured model, allows override)
- Submit  
- Answer output  
- Context viewer  

---

## 10. Performance Requirements
- Support 10 MB files  
- Chunking < 2 sec  
- Embedding storage < 3 sec  
- Query < 4 sec end-to-end  

---

## 11. Security Requirements
- Uploaded files stored temporarily  
- Only embeddings sent to configured providers  
- No PII stored  
- Graceful PDF parsing errors
- **API Key Security**:
  - API keys encrypted at rest (backend config)
  - API keys encrypted in browser local storage
  - No API keys logged or exposed in responses
  - Support for environment variables as secure alternative
  - API key validation before use
  - Option to clear/reset API keys  

---

## 12. Future Enhancements
- Multi-file ingestion batch  
- PGVector support  
- On-device embeddings  
- Realtime progress  

---

## 13. Timeline
| Task | Time |
|------|------|
| Backend API skeleton | 1 day |
| Model configuration & API key management (backend) | 1 day |
| Chunking strategies | 2 days |
| Embedding + Store integration | 1 day |
| RAG Query pipeline | 1 day |
| React UI (including Settings page) | 2.5 days |
| Integration | 1 day |
| Polish & Testing | 1 day |
| **Total** | **10.5 days** |
