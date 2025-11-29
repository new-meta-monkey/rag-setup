# Local RAG Studio - Development Plan (POC/Demo Focus)

## Overview
This document outlines the step-by-step development plan for building the Local RAG Studio application as a **working POC/Demo**. Focus is on getting a functional demo quickly with local server and GCloud services integration.

**Note**: Unit tests will be added later. This plan focuses on working functionality for demo purposes.

**Estimated Total Time**: 7-8 days (56-64 hours)

## Demo Requirements
- ✅ Working local FastAPI server
- ✅ Working React frontend
- ✅ GCloud services integration (Vertex AI for embeddings and LLM)
- ✅ ChromaDB running locally
- ✅ End-to-end workflow functional
- ✅ Quick setup and deployment

---

## GCloud & Local Server Setup

### GCloud Setup (Priority for Demo)
1. **Google Cloud Project Setup**:
   - Create/select GCP project
   - Enable Vertex AI API
   - Set up service account with Vertex AI permissions
   - Download service account JSON key

2. **Authentication**:
   - Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable
   - Or use `gcloud auth application-default login`
   - Store credentials securely in backend config

3. **Vertex AI Configuration**:
   - Project ID
   - Region (e.g., us-central1)
   - Model endpoints for embeddings and Gemini

### Local Server Configuration
1. **Backend Server**:
   - FastAPI on `http://localhost:8000`
   - CORS enabled for frontend
   - Auto-reload for development
   - Swagger docs at `/docs`

2. **Frontend Dev Server**:
   - Vite dev server on `http://localhost:5173` (or similar)
   - Proxy API calls to backend
   - Hot module replacement

3. **ChromaDB**:
   - Local persistence directory
   - No external dependencies
   - Data stored in `backend/chroma_store/`

---

## Phase 1: Project Setup & Core Infrastructure (Day 1)

### 1.1 Project Initialization
**Time**: 2 hours

**Tasks**:
- [ ] Initialize backend Python project with FastAPI
  - Create virtual environment
  - Set up `requirements.txt` with dependencies (FastAPI, uvicorn, chromadb, google-cloud-aiplatform, openai, etc.)
  - Create basic project structure
  - Set up local development server configuration
- [ ] Initialize frontend React/TypeScript project
  - Set up Vite with TypeScript (faster than CRA)
  - Configure Tailwind CSS
  - Set up basic routing
- [ ] Create folder structure for both projects (as per AGENTS.md)
- [ ] Set up Git repository and initial commit
- [ ] Create `.gitignore` files for both projects
- [ ] Create `README.md` with quick start instructions

**Deliverables**:
- ✅ Working backend skeleton with FastAPI
- ✅ Working frontend skeleton with React + TypeScript
- ✅ Proper folder structure in place

---

### 1.2 Core Configuration System
**Time**: 4 hours

**Backend Tasks**:
- [ ] Create `core/config/settings.py` with Pydantic models
- [ ] Implement configuration loading (file + environment variables)
- [ ] Create `utils/encryption.py` for API key encryption
- [ ] Implement `core/config/providers.py` for provider registry
- [ ] Create default `config/settings.json` structure

**Frontend Tasks**:
- [ ] Create `services/storage/localStorage.ts` utilities
- [ ] Create `services/storage/encryption.ts` for client-side encryption
- [ ] Create `types/settings.types.ts` for TypeScript types
- [ ] Set up API client in `services/api/client.ts`

**Deliverables**:
- ✅ Configuration system with encryption support
- ✅ Provider registry foundation
- ✅ Client-side storage utilities

---

### 1.3 Base Classes & Interfaces
**Time**: 2 hours

**Backend Tasks**:
- [ ] Create `core/providers/base/embedding_provider.py` (abstract base class)
- [ ] Create `core/providers/base/llm_provider.py` (abstract base class)
- [ ] Create `services/chunking/base/chunking_strategy.py` (abstract base class)
- [ ] Create `services/storage/vector_store.py` (interface)
- [ ] Create `utils/exceptions.py` with custom exceptions

**Deliverables**:
- ✅ All base classes and interfaces defined
- ✅ Type contracts established

---

## Phase 2: Provider System Implementation (Day 2)

### 2.1 Embedding Providers
**Time**: 4 hours

**Tasks**:
- [ ] Implement `core/providers/vertex/embedding.py`
  - Vertex AI text-embedding-004 integration
  - Error handling and retry logic
- [ ] Implement `core/providers/openai/embedding.py`
  - OpenAI embedding models support
  - API key validation
- [ ] Implement `core/providers/huggingface/embedding.py`
  - Hugging Face local/API models
- [ ] Create provider factory in `core/config/providers.py`
- [ ] Test providers manually with sample API calls

**Deliverables**:
- ✅ At least 3 embedding providers implemented (Vertex AI, OpenAI, Hugging Face)
- ✅ Provider factory working
- ✅ Manual verification of each provider

---

### 2.2 LLM Providers
**Time**: 4 hours

**Tasks**:
- [ ] Implement `core/providers/vertex/llm.py`
  - Vertex AI Gemini integration
- [ ] Implement `core/providers/openai/llm.py`
  - OpenAI GPT-4 and GPT-3.5-turbo support
- [ ] Create provider factory for LLM providers
- [ ] Test LLM providers manually with sample queries
- [ ] **Priority: Vertex AI Gemini** (for GCloud demo)
- [ ] Implement streaming support (optional, for future)

**Deliverables**:
- ✅ At least 2 LLM providers implemented (Vertex AI Gemini, OpenAI GPT)
- ✅ LLM provider factory working
- ✅ Manual verification working

---

## Phase 3: Core Services - Extraction & Chunking (Day 3-4)

### 3.1 Text Extraction Service
**Time**: 3 hours

**Tasks**:
- [ ] Create `services/extraction/file_loader.py`
  - Support PDF, TXT, DOCX, MD files
  - File validation and error handling
- [ ] Create `services/extraction/text_extractor.py`
  - Extract text from different file types (PDF, TXT, DOCX, MD)
  - Handle encoding issues
- [ ] Create Pydantic models in `models/schemas/extract.py`
- [ ] Test with sample files manually

**Deliverables**:
- ✅ Text extraction working for multiple file types
- ✅ Error handling in place
- ✅ Manual testing with sample documents

---

### 3.2 Chunking Strategies Implementation
**Time**: 8 hours (Day 3-4)

**Tasks**:
- [ ] Implement `services/chunking/strategies/character_chunker.py`
- [ ] Implement `services/chunking/strategies/paragraph_chunker.py`
- [ ] Implement `services/chunking/strategies/sentence_chunker.py`
  - Integrate NLTK or spaCy
- [ ] Implement `services/chunking/strategies/token_chunker.py`
  - Use tiktoken for tokenization
- [ ] Implement `services/chunking/strategies/markdown_chunker.py`
- [ ] Implement `services/chunking/strategies/table_chunker.py`
- [ ] Implement `services/chunking/strategies/semantic_chunker.py`
  - Use small local embedding model
- [ ] Create `services/chunking/chunk_factory.py`
- [ ] Create Pydantic models in `models/schemas/chunk.py`
- [ ] **Priority**: Start with 3-4 core strategies (Character, Paragraph, Sentence, Token)
- [ ] Test chunking strategies manually with sample text

**Deliverables**:
- ✅ Core chunking strategies implemented (at least 4)
- ✅ Chunk factory working
- ✅ Manual verification with sample documents

---

## Phase 4: Storage & Embedding Services (Day 5)

### 4.1 Vector Store Integration
**Time**: 3 hours

**Tasks**:
- [ ] Install and set up ChromaDB locally
  - Install chromadb package
  - Configure local persistence directory
- [ ] Implement `services/storage/chroma_store.py`
  - ChromaDB initialization (local mode)
  - Collection management
  - Document storage and retrieval
  - Metadata handling
- [ ] Create `models/entities/chunk.py` and `models/entities/document.py`
- [ ] Test ChromaDB operations manually (store, retrieve, query)

**Deliverables**:
- ✅ ChromaDB running locally
- ✅ ChromaDB integration complete
- ✅ CRUD operations working
- ✅ Manual verification successful

---

### 4.2 Embedding Service
**Time**: 3 hours

**Tasks**:
- [ ] Create `services/embedding/embedding_service.py`
  - Orchestrate embedding generation
  - Batch processing support
  - Error handling and retries
- [ ] Integrate with provider system
- [ ] **Priority**: Test with Vertex AI embedding (for GCloud demo)
- [ ] Create Pydantic models in `models/schemas/store.py`
- [ ] Test embedding generation manually

**Deliverables**:
- ✅ Embedding service orchestration working
- ✅ Integration with providers complete
- ✅ Vertex AI embedding verified

---

## Phase 5: RAG Query Service (Day 6)

### 5.1 RAG Service Implementation
**Time**: 6 hours

**Tasks**:
- [ ] Create `services/query/rag_service.py`
  - Query embedding
  - Vector similarity search
  - Context retrieval
  - LLM prompt construction
  - Response generation
- [ ] Implement top-K retrieval
- [ ] Create Pydantic models in `models/schemas/query.py`
- [ ] Test RAG pipeline manually with sample queries
- [ ] **Priority**: Verify Vertex AI Gemini integration

**Deliverables**:
- ✅ Complete RAG pipeline working
- ✅ End-to-end query flow functional
- ✅ Vertex AI Gemini integration verified

---

## Phase 6: Backend API Layer (Day 7)

### 6.1 API Endpoints Implementation
**Time**: 6 hours

**Tasks**:
- [ ] Create `api/routes/settings.py`
  - GET /settings
  - POST /settings
  - PUT /settings
  - API key validation
- [ ] Create `api/routes/extract.py`
  - POST /extract
- [ ] Create `api/routes/chunk.py`
  - POST /chunk
- [ ] Create `api/routes/store.py`
  - POST /store
- [ ] Create `api/routes/query.py`
  - POST /query
- [ ] Create `api/middleware/error_handler.py`
- [ ] Create `api/middleware/validation.py`
- [ ] Update `main.py` with all routes
- [ ] Set up CORS for local development
- [ ] Test all endpoints manually with Postman/curl
- [ ] Verify local server runs on `http://localhost:8000`

**Deliverables**:
- ✅ All API endpoints implemented
- ✅ Error handling middleware
- ✅ Request validation
- ✅ Local server running and accessible
- ✅ All endpoints manually tested

---

## Phase 7: Frontend Core Infrastructure (Day 8)

### 7.1 State Management & API Services
**Time**: 4 hours

**Tasks**:
- [ ] Set up state management (Redux Toolkit or Zustand)
  - Create `store/slices/settingsSlice.ts`
  - Create `store/slices/ingestSlice.ts`
  - Create `store/slices/querySlice.ts`
- [ ] Complete `services/api/settingsApi.ts`
- [ ] Complete `services/api/ragApi.ts`
- [ ] Create `services/validation/validators.ts`
- [ ] Create `utils/constants.ts` and `utils/helpers.ts`

**Deliverables**:
- ✅ State management setup
- ✅ API services complete
- ✅ Utility functions ready

---

### 7.2 Custom Hooks
**Time**: 4 hours

**Tasks**:
- [ ] Create `hooks/useSettings.ts`
- [ ] Create `hooks/useFileUpload.ts`
- [ ] Create `hooks/useChunking.ts`
- [ ] Create `hooks/useQuery.ts`
- [ ] Create `hooks/useApiKey.ts`
- [ ] Test hooks manually in components

**Deliverables**:
- ✅ All custom hooks implemented
- ✅ Hooks working in components

---

## Phase 8: Frontend UI Components (Day 9)

### 8.1 Common Components
**Time**: 3 hours

**Tasks**:
- [ ] Create `components/common/Button/`
- [ ] Create `components/common/Input/`
- [ ] Create `components/common/Modal/`
- [ ] Create `components/common/Loading/`
- [ ] Create `components/common/Toast/`
- [ ] Style with Tailwind CSS

**Deliverables**:
- ✅ Reusable common components
- ✅ Consistent styling

---

### 8.2 Settings Page Components
**Time**: 3 hours

**Tasks**:
- [ ] Create `components/settings/ModelSelector/`
- [ ] Create `components/settings/ApiKeyInput/`
- [ ] Create `components/settings/SettingsPanel/`
- [ ] Create `pages/SettingsPage/`
- [ ] Integrate with settings API
- [ ] Add form validation

**Deliverables**:
- ✅ Settings page fully functional
- ✅ Model selection working
- ✅ API key management working

---

### 8.3 Ingest Page Components
**Time**: 4 hours

**Tasks**:
- [ ] Create `components/ingest/FileUpload/`
- [ ] Create `components/ingest/ChunkConfigForm/`
- [ ] Create `components/ingest/ChunkPreview/`
- [ ] Create `components/ingest/MetricsCard/`
- [ ] Create `pages/IngestPage/`
- [ ] Integrate with extract, chunk, and store APIs
- [ ] Add loading states and error handling

**Deliverables**:
- ✅ Ingest page fully functional
- ✅ File upload working
- ✅ Chunking preview working
- ✅ Store functionality working

---

### 8.4 Query Page Components
**Time**: 2 hours

**Tasks**:
- [ ] Create `components/query/QueryBox/`
- [ ] Create `components/query/ResponseViewer/`
- [ ] Create `components/query/ContextViewer/`
- [ ] Create `pages/QueryPage/`
- [ ] Integrate with query API
- [ ] Add loading states

**Deliverables**:
- ✅ Query page fully functional
- ✅ Response display working
- ✅ Context viewer working

---

## Phase 9: Integration & Demo Preparation (Day 7)

### 9.1 Frontend-Backend Integration
**Time**: 3 hours

**Tasks**:
- [ ] Connect all frontend pages to backend APIs
- [ ] Configure API base URL for local development (`http://localhost:8000`)
- [ ] Test end-to-end flows manually:
  - Settings configuration → Save → Use in operations
  - File upload → Extract → Chunk → Store
  - Query → Retrieve → Display
- [ ] Fix integration issues
- [ ] Test API key override functionality
- [ ] **Verify GCloud Vertex AI integration works end-to-end**

**Deliverables**:
- ✅ Full-stack integration complete
- ✅ All flows working end-to-end
- ✅ GCloud services verified

---

### 9.2 Error Handling & Edge Cases
**Time**: 2 hours

**Tasks**:
- [ ] Add basic error handling in frontend
- [ ] Add error boundaries
- [ ] Handle network errors gracefully
- [ ] Handle file upload errors
- [ ] Handle API key validation errors
- [ ] Add user-friendly error messages
- [ ] Handle GCloud authentication errors

**Deliverables**:
- ✅ Basic error handling in place
- ✅ Good user experience on errors

---

### 9.3 Manual Testing & Bug Fixes
**Time**: 3 hours

**Tasks**:
- [ ] Manual testing of all features:
  - Settings page (model selection, API keys)
  - Ingest page (upload, extract, chunk, store)
  - Query page (query, response, context)
- [ ] Test with GCloud Vertex AI (embeddings + Gemini)
- [ ] Test with local ChromaDB
- [ ] Fix critical bugs discovered
- [ ] Verify local server runs smoothly
- [ ] Test with sample documents (PDF, TXT)

**Deliverables**:
- ✅ All features manually tested
- ✅ No critical bugs
- ✅ Demo-ready application

---

## Phase 10: Polish & Demo Setup (Day 8)

### 10.1 UI/UX Polish
**Time**: 2 hours

**Tasks**:
- [ ] Improve loading states and animations
- [ ] Add tooltips and help text
- [ ] Improve responsive design
- [ ] Add keyboard shortcuts (optional)
- [ ] Polish visual design

**Deliverables**:
- ✅ Polished UI/UX
- ✅ Professional appearance

---

### 10.2 Documentation & Demo Setup
**Time**: 2 hours

**Tasks**:
- [ ] Update README.md with:
  - Quick start instructions
  - Local server setup
  - GCloud setup instructions (Vertex AI authentication)
  - ChromaDB local setup
  - Environment variables configuration
- [ ] Document API endpoints (FastAPI auto-generates Swagger at `/docs`)
- [ ] Add code comments for complex logic
- [ ] Create demo script/instructions
- [ ] Prepare demo data (sample documents)

**Deliverables**:
- ✅ Complete setup documentation
- ✅ Demo-ready with instructions
- ✅ GCloud authentication guide

---

## Development Checklist Summary

### Backend Checklist
- [ ] Project setup and folder structure
- [ ] Configuration system with encryption
- [ ] Base classes and interfaces
- [ ] Embedding providers (Vertex AI - priority, OpenAI, Hugging Face)
- [ ] LLM providers (Vertex AI Gemini - priority, OpenAI)
- [ ] Text extraction service
- [ ] Core chunking strategies (at least 4)
- [ ] ChromaDB local setup and integration
- [ ] Embedding service
- [ ] RAG query service
- [ ] All API endpoints
- [ ] Error handling middleware
- [ ] Local server running (`http://localhost:8000`)
- [ ] GCloud Vertex AI authentication working

### Frontend Checklist
- [ ] Project setup and folder structure
- [ ] State management setup
- [ ] API client and services (configured for local server)
- [ ] Custom hooks
- [ ] Common components
- [ ] Settings page and components
- [ ] Ingest page and components
- [ ] Query page and components
- [ ] Error handling and loading states
- [ ] Integration with backend
- [ ] Frontend running on local dev server
- [ ] All pages functional and connected

---

## Risk Mitigation

### Technical Risks
1. **ChromaDB Integration Issues**
   - Mitigation: Start with simple CRUD operations, test early
   
2. **Provider API Changes**
   - Mitigation: Use abstraction layers, version pinning
   
3. **File Parsing Errors**
   - Mitigation: Comprehensive error handling, fallback strategies
   
4. **Performance with Large Files**
   - Mitigation: Implement chunking early, test with large files

### Timeline Risks
1. **Scope Creep**
   - Mitigation: Stick to PRD, defer nice-to-haves
   
2. **Integration Issues**
   - Mitigation: Test integration early, daily builds

---

## Success Criteria

### Functional Requirements
- ✅ User can configure embedding and LLM models
- ✅ User can manage API keys via UI or API
- ✅ User can upload and extract text from documents
- ✅ User can choose and apply chunking strategies
- ✅ User can store chunks with embeddings
- ✅ User can query stored knowledge
- ✅ Core chunking strategies work correctly (at least 4)

### Non-Functional Requirements
- ✅ Code follows SOLID principles
- ✅ Modular, maintainable architecture
- ✅ Performance requirements met (< 4 sec query time)
- ✅ Security best practices followed
- ✅ API keys encrypted at rest
- ✅ Basic error handling
- ✅ Local server and GCloud services working
- ✅ Demo-ready application

---

## Pre-Demo Checklist

Before the demo, ensure:

### Backend
- [ ] Local FastAPI server runs without errors
- [ ] All API endpoints respond correctly
- [ ] GCloud Vertex AI authentication working
- [ ] ChromaDB initialized and accessible
- [ ] Sample documents ready for upload
- [ ] API keys configured (Vertex AI, optional OpenAI)
- [ ] CORS configured for frontend

### Frontend
- [ ] Frontend dev server runs without errors
- [ ] All pages load correctly
- [ ] API calls connect to backend
- [ ] Settings page saves configuration
- [ ] File upload works
- [ ] Query page displays results
- [ ] Error messages are user-friendly

### End-to-End Flow
- [ ] Upload document → Extract text → Works
- [ ] Select chunking strategy → Generate chunks → Works
- [ ] Store chunks → Embeddings generated → Works
- [ ] Query → Retrieve context → LLM response → Works
- [ ] GCloud services (Vertex AI) working end-to-end

### Demo Preparation
- [ ] README with setup instructions
- [ ] Sample documents prepared
- [ ] GCloud credentials configured
- [ ] Quick start script (optional)
- [ ] Demo scenario prepared

---

## Next Steps After MVP

### Future Enhancements (Post-MVP)
1. Multi-file batch ingestion
2. PGVector support
3. On-device embeddings
4. Real-time progress indicators
5. Advanced chunking strategies
6. Document management (delete, update)
7. Query history
8. Export/import configurations

---

## Daily Standup Template

**What I completed yesterday:**
- [List completed tasks]

**What I'm working on today:**
- [List current tasks]

**Blockers/Issues:**
- [List any blockers]

**Notes:**
- [Any relevant notes]

---

**Last Updated**: [Date]
**Status**: Planning Phase
**Next Milestone**: Phase 1 - Project Setup

