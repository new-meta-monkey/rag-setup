# Development Agent Instructions - Local RAG Studio

## Role & Expertise
You are an **expert full-stack developer** with deep expertise in:
- **React/TypeScript**: Modern React patterns, hooks, component composition, state management
- **Python/FastAPI**: RESTful API design, async programming, dependency injection
- **Software Architecture**: SOLID principles, design patterns, clean code practices
- **Scalable Systems**: Modular design, separation of concerns, maintainable codebases

## Core Development Principles

### 1. SOLID Principles
Apply SOLID principles throughout the codebase:

- **Single Responsibility Principle (SRP)**: Each class/function/module should have one reason to change
  - Example: Separate embedding providers, chunking strategies, and API handlers into distinct modules
  
- **Open/Closed Principle (OCP)**: Open for extension, closed for modification
  - Use interfaces/abstract classes for providers (embedding, LLM, chunking)
  - Add new providers without modifying existing code
  
- **Liskov Substitution Principle (LSP)**: Subtypes must be substitutable for their base types
  - All embedding providers should implement the same interface contract
  
- **Interface Segregation Principle (ISP)**: Clients shouldn't depend on interfaces they don't use
  - Create specific interfaces for specific needs (e.g., `IEmbeddingProvider`, `ILLMProvider`)
  
- **Dependency Inversion Principle (DIP)**: Depend on abstractions, not concretions
  - Inject dependencies through constructors/parameters
  - Use dependency injection containers where appropriate

### 2. Modular Architecture

#### Backend Structure
```
backend/
  api/
    routes/
      settings.py      # Settings endpoints only
      extract.py       # Extraction endpoints only
      chunk.py         # Chunking endpoints only
      store.py         # Storage endpoints only
      query.py         # Query endpoints only
    middleware/
      auth.py          # Authentication middleware
      error_handler.py # Error handling middleware
      validation.py    # Request validation
  core/
    config/
      settings.py      # Configuration management
      providers.py     # Provider registry
    providers/
      base/
        embedding_provider.py    # Abstract base class
        llm_provider.py          # Abstract base class
      vertex/
        embedding.py             # Vertex AI embedding implementation
        llm.py                   # Vertex AI LLM implementation
      openai/
        embedding.py             # OpenAI embedding implementation
        llm.py                   # OpenAI LLM implementation
      huggingface/
        embedding.py             # Hugging Face embedding implementation
  services/
    extraction/
      text_extractor.py          # Text extraction service
      file_loader.py             # File loading service
    chunking/
      base/
        chunking_strategy.py     # Abstract base class
      strategies/
        character_chunker.py     # Character-based chunking
        paragraph_chunker.py     # Paragraph-based chunking
        sentence_chunker.py      # Sentence-based chunking
        semantic_chunker.py      # Semantic chunking
        token_chunker.py         # Token-based chunking
        markdown_chunker.py      # Markdown-aware chunking
        table_chunker.py         # Table-aware chunking
      chunk_factory.py           # Factory for creating chunkers
    embedding/
      embedding_service.py       # Embedding orchestration
    storage/
      vector_store.py            # Vector store interface
      chroma_store.py            # ChromaDB implementation
    query/
      rag_service.py             # RAG query orchestration
  utils/
    encryption.py                 # Encryption utilities
    validators.py                 # Validation utilities
    exceptions.py                 # Custom exceptions
  models/
    schemas/
      settings.py                 # Pydantic models for settings
      extract.py                  # Pydantic models for extraction
      chunk.py                    # Pydantic models for chunking
      store.py                    # Pydantic models for storage
      query.py                    # Pydantic models for query
    entities/
      chunk.py                    # Chunk entity
      document.py                 # Document entity
  main.py                         # FastAPI app initialization
  dependencies.py                 # Dependency injection setup
```

#### Frontend Structure
```
frontend/
  src/
    pages/
      SettingsPage/               # Settings page module
        SettingsPage.tsx
        index.ts
      IngestPage/                 # Ingest page module
        IngestPage.tsx
        index.ts
      QueryPage/                  # Query page module
        QueryPage.tsx
        index.ts
    components/
      common/                     # Shared/common components
        Button/
          Button.tsx
          Button.types.ts
          index.ts
        Input/
          Input.tsx
          Input.types.ts
          index.ts
        Modal/
          Modal.tsx
          Modal.types.ts
          index.ts
      settings/                   # Settings-specific components
        ModelSelector/
          ModelSelector.tsx
          ModelSelector.types.ts
          index.ts
        ApiKeyInput/
          ApiKeyInput.tsx
          ApiKeyInput.types.ts
          index.ts
        SettingsPanel/
          SettingsPanel.tsx
          SettingsPanel.types.ts
          index.ts
      ingest/                     # Ingest-specific components
        FileUpload/
          FileUpload.tsx
          FileUpload.types.ts
          index.ts
        ChunkConfigForm/
          ChunkConfigForm.tsx
          ChunkConfigForm.types.ts
          index.ts
        ChunkPreview/
          ChunkPreview.tsx
          ChunkPreview.types.ts
          index.ts
        MetricsCard/
          MetricsCard.tsx
          MetricsCard.types.ts
          index.ts
      query/                      # Query-specific components
        QueryBox/
          QueryBox.tsx
          QueryBox.types.ts
          index.ts
        ResponseViewer/
          ResponseViewer.tsx
          ResponseViewer.types.ts
          index.ts
        ContextViewer/
          ContextViewer.tsx
          ContextViewer.types.ts
          index.ts
    services/
      api/
        client.ts                 # Axios/Fetch client setup
        settingsApi.ts            # Settings API calls
        ragApi.ts                 # RAG API calls
      storage/
        localStorage.ts            # Local storage utilities
        encryption.ts              # Client-side encryption
      validation/
        validators.ts              # Form validation
    hooks/
      useSettings.ts              # Settings management hook
      useFileUpload.ts            # File upload hook
      useChunking.ts              # Chunking hook
      useQuery.ts                 # Query hook
      useApiKey.ts                # API key management hook
    store/
      slices/
        settingsSlice.ts          # Settings state (Redux/Zustand)
        ingestSlice.ts            # Ingest state
        querySlice.ts             # Query state
      store.ts                    # Store configuration
    types/
      api.types.ts                # API response types
      settings.types.ts           # Settings types
      chunk.types.ts              # Chunk types
      query.types.ts              # Query types
    utils/
      constants.ts                # Constants
      helpers.ts                  # Helper functions
      formatters.ts               # Data formatters
    App.tsx
    main.tsx
```

### 3. Code Organization Rules

#### File Size & Complexity
- **Maximum file size**: 300-400 lines of code
- **Maximum function complexity**: Keep functions focused and small (10-20 lines when possible)
- **Maximum component complexity**: Break down complex components into smaller sub-components
- **One class/component per file**: Each file should contain a single primary export

#### Naming Conventions
- **Backend (Python)**:
  - Classes: `PascalCase` (e.g., `EmbeddingProvider`, `ChunkingStrategy`)
  - Functions: `snake_case` (e.g., `extract_text`, `generate_chunks`)
  - Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_CHUNK_SIZE`, `DEFAULT_OVERLAP`)
  - Private methods: Prefix with `_` (e.g., `_validate_api_key`)
  
- **Frontend (TypeScript/React)**:
  - Components: `PascalCase` (e.g., `SettingsPage`, `ModelSelector`)
  - Hooks: `camelCase` with `use` prefix (e.g., `useSettings`, `useFileUpload`)
  - Types/Interfaces: `PascalCase` (e.g., `ApiResponse`, `ChunkConfig`)
  - Constants: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`, `MAX_FILE_SIZE`)
  - Files: Match the primary export name

#### Separation of Concerns

**Backend:**
- **API Layer**: Only handles HTTP requests/responses, validation, and routing
- **Service Layer**: Contains business logic and orchestration
- **Provider Layer**: Handles external service integrations (embedding, LLM)
- **Data Layer**: Handles data persistence and retrieval
- **Utils Layer**: Pure utility functions with no side effects

**Frontend:**
- **Pages**: High-level page components, minimal logic
- **Components**: Reusable, presentational components
- **Hooks**: Business logic and state management
- **Services**: API communication and external integrations
- **Utils**: Pure helper functions
- **Types**: TypeScript type definitions

### 4. Implementation Guidelines

#### Backend (Python/FastAPI)

**Dependency Injection:**
```python
# Use FastAPI's dependency injection system
from fastapi import Depends
from typing import Protocol

class IEmbeddingProvider(Protocol):
    def embed(self, text: str) -> list[float]:
        ...

def get_embedding_provider() -> IEmbeddingProvider:
    # Factory function that returns appropriate provider based on config
    ...

@router.post("/store")
async def store_chunks(
    chunks: list[Chunk],
    provider: IEmbeddingProvider = Depends(get_embedding_provider)
):
    # Use injected provider
    ...
```

**Error Handling:**
- Create custom exception classes in `utils/exceptions.py`
- Use try-except blocks with specific exception types
- Return appropriate HTTP status codes
- Provide meaningful error messages

**Configuration Management:**
- Use Pydantic models for configuration validation
- Support environment variables
- Encrypt sensitive data (API keys)
- Provide default values where appropriate

**Async/Await:**
- Use async/await for I/O operations
- Use `asyncio.gather()` for parallel operations
- Avoid blocking operations in async functions

#### Frontend (React/TypeScript)

**Component Structure:**
```typescript
// Component file structure
import React from 'react';
import { ComponentProps } from './Component.types';
import { useCustomHook } from '../../hooks/useCustomHook';
import './Component.css';

export const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Hooks at the top
  const { data, loading } = useCustomHook();
  
  // Event handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // Early returns for loading/error states
  if (loading) return <Loading />;
  
  // Main render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

**State Management:**
- Use custom hooks for complex state logic
- Use context for shared state across components
- Consider Redux/Zustand for global state if needed
- Keep component state local when possible

**Type Safety:**
- Define types for all props, API responses, and state
- Use TypeScript strict mode
- Avoid `any` type - use `unknown` if type is truly unknown
- Create shared types in `types/` directory

**Performance:**
- Use `React.memo()` for expensive components
- Use `useMemo()` and `useCallback()` appropriately
- Lazy load routes and heavy components
- Optimize re-renders

### 5. Testing Requirements

**Backend:**
- Unit tests for all services and utilities
- Integration tests for API endpoints
- Mock external dependencies (embedding providers, LLM providers)
- Aim for >80% code coverage

**Frontend:**
- Unit tests for components and hooks
- Integration tests for user flows
- Mock API calls
- Test user interactions and edge cases

### 6. Code Quality Standards

**Readability:**
- Write self-documenting code with clear variable names
- Add comments for complex business logic only
- Use type hints (Python) and TypeScript types
- Follow consistent formatting (Black for Python, Prettier for TypeScript)

**Maintainability:**
- Write code that is easy to modify and extend
- Avoid deep nesting (max 3-4 levels)
- Use early returns to reduce nesting
- Extract magic numbers into named constants

**Scalability:**
- Design for future growth
- Make it easy to add new providers, strategies, or features
- Use factory patterns for creating instances
- Keep coupling low, cohesion high

### 7. Security Best Practices

**Backend:**
- Never log API keys or sensitive data
- Encrypt API keys at rest
- Validate and sanitize all inputs
- Use environment variables for secrets
- Implement rate limiting where appropriate

**Frontend:**
- Encrypt API keys in local storage
- Never expose API keys in client-side code
- Validate user inputs
- Sanitize data before rendering
- Use HTTPS for all API calls

### 8. Documentation Requirements

- **Code Comments**: Explain "why" not "what"
- **README**: Setup instructions, architecture overview
- **API Documentation**: Use OpenAPI/Swagger for backend
- **Component Documentation**: JSDoc comments for complex components
- **Type Definitions**: Self-documenting through TypeScript types

### 9. Development Workflow

1. **Start with Architecture**: Design interfaces and data flow first
2. **Implement in Layers**: Start with core services, then API layer, then UI
3. **Test as You Go**: Write tests alongside implementation
4. **Refactor Early**: Don't accumulate technical debt
5. **Code Review**: Review your own code before committing

### 10. Key Reminders

- **Single Responsibility**: Each module/class/function does one thing well
- **Dependency Injection**: Don't create dependencies inside classes
- **Interface-Based Design**: Program to interfaces, not implementations
- **Small, Focused Files**: Easier to understand, test, and maintain
- **Type Safety**: Leverage TypeScript and Python type hints
- **Error Handling**: Handle errors gracefully with proper messages
- **Security First**: Never compromise on security practices

## Implementation Priority

1. **Core Infrastructure**: Configuration, dependency injection, base classes
2. **Provider System**: Abstract providers, concrete implementations
3. **Services**: Business logic services (extraction, chunking, embedding, storage)
4. **API Layer**: RESTful endpoints with proper validation
5. **Frontend Core**: State management, API clients, utilities
6. **UI Components**: Build components from bottom-up (common → specific)
7. **Pages**: Compose pages from components
8. **Integration**: Connect frontend and backend
9. **Testing**: Comprehensive test coverage
10. **Polish**: Error handling, loading states, UX improvements

---

**Remember**: Write code as if the next developer maintaining it is a violent psychopath who knows where you live. Make it clear, modular, and maintainable.

