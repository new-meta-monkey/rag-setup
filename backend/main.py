"""
Local RAG Studio - FastAPI Application
Main entry point for the backend server
"""
from typing import List, Optional, Dict, Any
import onnxruntime # Pre-import to avoid ChromaDB issues
from fastapi import FastAPI, HTTPException, Body, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from backend.services.chunking.chunk_factory import ChunkFactory
from backend.core.config.providers import ProviderFactory
from backend.services.visualization.projector import VectorProjector
from backend.services.storage.chroma_store import ChromaStore
from backend.services.file_processor import FileProcessor

app = FastAPI(
    title="Local RAG Studio API",
    description="RAG system with chunking strategies and embedding workflows",
    version="1.0.0"
)

# Initialize Vector Store (Lazy - initialized on first use)
vector_store = None

def get_vector_store():
    """Get or create the vector store instance"""
    global vector_store
    if vector_store is None:
        vector_store = ChromaStore()
    return vector_store

# CORS configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---

class ChunkRequest(BaseModel):
    text: str
    strategy: str = "character"
    config: Dict[str, Any] = {}
    provider_config: Optional[Dict[str, Any]] = None # For semantic chunking
    pages: Optional[List[Dict[str, Any]]] = None

class EmbedRequest(BaseModel):
    texts: List[str]
    provider: str = "vertex"
    config: Dict[str, Any] = {}

class StoreRequest(BaseModel):
    chunks: List[Any] # Can be List[str] or List[Dict]
    metadatas: Optional[List[Dict[str, Any]]] = None
    provider: str = "vertex"
    config: Dict[str, Any] = {}

class VisualizeRequest(BaseModel):
    texts: List[str]
    provider: str = "vertex"
    config: Dict[str, Any] = {}
    method: str = "pca"
    n_components: int = 3

class ChatMessage(BaseModel):
    role: str
    content: str

class QueryRequest(BaseModel):
    query: str
    embedding_provider: str = "vertex"
    embedding_config: Dict[str, Any] = {}
    llm_provider: str = "vertex"
    llm_config: Dict[str, Any] = {}
    n_results: int = 5
    min_score: float = 0.0
    history: List[ChatMessage] = []

class DeleteRequest(BaseModel):
    ids: Optional[List[str]] = None
    delete_all: bool = False

class SettingsModel(BaseModel):
    embeddingProvider: str = 'local'
    llmProvider: str = 'vertex'
    # Global
    systemContext: str = ''
    retrievalAccuracy: float = 0.0
    chatHistoryLimit: int = 5
    # Vertex
    vertexProjectId: str = ''
    vertexLocation: str = 'us-central1'
    vertexModel: str = 'text-embedding-004'
    vertexLLMModel: str = 'gemini-2.5-pro'
    vertexCredentialsJSON: str = ''
    # OpenAI
    openaiApiKey: str = ''
    openaiModel: str = 'text-embedding-3-small'
    openaiLLMModel: str = 'gpt-4o-mini'
    # Local
    localModel: str = 'all-MiniLM-L6-v2'
    # Azure
    azureApiKey: str = ''
    azureEndpoint: str = ''
    azureApiVersion: str = '2023-05-15'
    azureDeployment: str = ''
    # AWS
    awsRegion: str = 'us-east-1'
    awsAccessKeyId: str = ''
    awsSecretAccessKey: str = ''
    awsModel: str = 'amazon.titan-embed-text-v1'
    # LLM Params
    temperature: float = 0.7
    maxTokens: int = 2048

from backend.database import db
import json

@app.get("/settings")
async def get_settings():
    """Get application settings"""
    try:
        settings_json = db.get_setting("app_settings")
        if settings_json:
            return json.loads(settings_json)
        return {} # Return empty if not set, frontend handles defaults
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/settings")
async def save_settings(settings: SettingsModel):
    """Save application settings"""
    try:
        db.save_setting("app_settings", settings.json())
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Endpoints ---

@app.get("/")
async def root():
    """Health check endpoint"""
    return JSONResponse(
        content={
            "status": "ok",
            "message": "Local RAG Studio API is running",
            "version": "1.0.0"
        }
    )

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.post("/chunk")
async def chunk_text(request: ChunkRequest):
    """
    Chunk text using specified strategy
    """
    try:
        embedding_provider = None
        if request.strategy == "semantic":
            if not request.provider_config:
                raise HTTPException(status_code=400, detail="Provider config required for semantic chunking")
            # Default to Vertex if not specified in provider config, but usually passed in request
            provider_type = request.provider_config.get("type", "vertex")
            embedding_provider = ProviderFactory.get_embedding_provider(provider_type, request.provider_config)

        strategy = ChunkFactory.get_strategy(
            request.strategy, 
            request.config, 
            embedding_provider
        )
        
        # Pass pages if available
        chunks = strategy.chunk(request.text, pages=request.pages)
        
        # Handle both string and dict chunks for backward compatibility/different strategies
        # But we aim for all to return dicts now. 
        # If a strategy returns strings, wrap them.
        normalized_chunks = []
        for c in chunks:
            if isinstance(c, str):
                normalized_chunks.append({"text": c, "metadata": {}})
            else:
                normalized_chunks.append(c)
        
        chunks = normalized_chunks
        
        # Calculate metrics
        sizes = [len(c["text"]) for c in chunks]
        metrics = {
            "total_chunks": len(chunks),
            "avg_size": sum(sizes) / len(sizes) if sizes else 0,
            "min_size": min(sizes) if sizes else 0,
            "max_size": max(sizes) if sizes else 0
        }
        
        return {
            "chunks": chunks,
            "metrics": metrics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/embed")
async def generate_embeddings(request: EmbedRequest):
    """
    Generate embeddings for texts
    """
    try:
        provider = ProviderFactory.get_embedding_provider(request.provider, request.config)
        embeddings = provider.embed_batch(request.texts)
        return {
            "embeddings": embeddings,
            "count": len(embeddings),
            "dimension": provider.get_dimension()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/store")
async def store_chunks(request: StoreRequest):
    """
    Generate embeddings and store chunks in Vector DB
    """
    try:
        # 1. Extract texts and merge metadata
        texts = []
        final_metadatas = []
        
        for i, chunk in enumerate(request.chunks):
            chunk_text = ""
            chunk_meta = {}
            
            if isinstance(chunk, str):
                chunk_text = chunk
            elif isinstance(chunk, dict):
                chunk_text = chunk.get("text", "")
                chunk_meta = chunk.get("metadata", {})
            else:
                continue # Skip invalid
                
            texts.append(chunk_text)
            
            # Merge with provided metadatas (global/custom)
            base_meta = request.metadatas[i] if request.metadatas and i < len(request.metadatas) else {}
            
            # Merge: base (global) + chunk_specific
            # We want chunk_specific to override base if conflict? 
            # Or base to override chunk?
            # Usually specific is more important, but base might have user corrections.
            # Let's say base (user input) > chunk (auto extracted) if conflict.
            # But here they are likely disjoint sets (filename vs page number).
            merged = {**chunk_meta, **base_meta}
            
            # Sanitize metadata for ChromaDB (no lists allowed)
            sanitized = {}
            for k, v in merged.items():
                if isinstance(v, list):
                    # Convert list to comma-separated string
                    sanitized[k] = ", ".join(map(str, v))
                else:
                    sanitized[k] = v
                    
            final_metadatas.append(sanitized)

        # 2. Generate embeddings
        provider = ProviderFactory.get_embedding_provider(request.provider, request.config)
        embeddings = provider.embed_batch(texts)
        
        # 3. Store in ChromaDB
        get_vector_store().add_documents(
            documents=texts,
            embeddings=embeddings,
            metadatas=final_metadatas
        )
        
        # 4. Update file status to 'chunked'
        # Collect file IDs from metadatas
        file_ids = set()
        for meta in final_metadatas:
            if "file_id" in meta:
                file_ids.add(meta["file_id"])
        
        for fid in file_ids:
            file_service.update_status(fid, "chunked")

        return {
            "status": "success",
            "count": len(texts),
            "message": "Chunks stored successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents")
async def get_documents():
    """
    Get all stored documents
    """
    try:
        documents = get_vector_store().get_all_documents()
        return {"documents": documents, "count": len(documents)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/visualize")
async def visualize_vectors(request: VisualizeRequest):
    """
    Generate 2D/3D coordinates for visualization
    """
    try:
        # 1. Generate embeddings
        provider = ProviderFactory.get_embedding_provider(request.provider, request.config)
        embeddings = provider.embed_batch(request.texts)
        
        # 2. Project to lower dimensions
        points = VectorProjector.project(
            embeddings, 
            method=request.method, 
            n_components=request.n_components
        )
        
        return {
            "points": points,
            "method": request.method,
            "n_components": request.n_components
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/visualize_stored")
async def visualize_stored_vectors(method: str = "pca", n_components: int = 2):
    """
    Visualize all stored vectors in the knowledge base
    """
    try:
        # 1. Get all embeddings from store
        items = get_vector_store().get_all_embeddings()
        
        if not items:
            return {"points": [], "total": 0}
            
        # 2. Extract embeddings for projection
        embeddings = [item["embedding"] for item in items]
        
        # 3. Project to lower dimensions
        points = VectorProjector.project(
            embeddings, 
            method=method, 
            n_components=n_components
        )
        
        # 4. Merge projection with metadata
        result_points = []
        for i, point in enumerate(points):
            item = items[i]
            metadata = item["metadata"]
            
            # Add metadata to point
            point["id"] = item["id"]
            point["source"] = metadata.get("source", "unknown")
            point["text_preview"] = item["document"][:100] + "..." if len(item["document"]) > 100 else item["document"]
            point["token_count"] = len(item["document"].split())
            
            result_points.append(point)
            
        return {
            "points": result_points,
            "total": len(result_points),
            "method": method
        }
    except Exception as e:
        print(f"Error in visualize_stored: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from backend.services.file_service import FileService

# Initialize File Service
file_service = FileService()

@app.post("/extract")
async def extract_text(file: UploadFile = File(...)):
    """
    Extract text from uploaded file (PDF, DOCX, XLSX, TXT, MD)
    AND save the file to local storage via FileService.
    """
    # 1. Upload file via Service (Saves to Disk + DB)
    file_record = await file_service.upload_file(file)
    
    # 2. Extract text
    # We need to reset cursor again because save() read it
    await file.seek(0)
    result = await FileProcessor.extract_text(file)
    
    # FileProcessor returns a dict with "text" and "pages"
    # We add filename and ID to it
    result["filename"] = file_record["filename"]
    result["file_id"] = file_record["id"]
    result["saved_path"] = file_record["physical_path"]
    return result

@app.get("/files")
async def list_files(status: Optional[str] = "chunked"):
    """List uploaded files (default: only chunked files)"""
    return file_service.list_files(status)

@app.delete("/files/{file_id}")
async def delete_file(file_id: str):
    """
    Delete a file and its associated vectors
    """
    try:
        store = get_vector_store()
        if file_service.delete_file(file_id, store):
            return {"status": "success", "message": f"File {file_id} and associated vectors deleted"}
        else:
            raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
async def query_knowledge(request: QueryRequest):
    """
    Query the RAG system - retrieves relevant documents and generates AI response
    """
    try:
        # 1. Generate embedding for the query
        embedding_provider = ProviderFactory.get_embedding_provider(
            request.embedding_provider, 
            request.embedding_config
        )
        query_embedding = embedding_provider.embed(request.query)
        
        # 2. Query vector store for relevant documents
        # Fetch more than needed initially to allow for filtering
        fetch_k = request.n_results * 2
        results = get_vector_store().query(
            query_embeddings=[query_embedding],
            n_results=fetch_k
        )
        
        # 3. Extract retrieved documents
        documents = results.get('documents', [[]])[0]
        metadatas = results.get('metadatas', [[]])[0]
        distances = results.get('distances', [[]])[0]
        
        # Filter by minimum score (accuracy)
        filtered_docs = []
        filtered_metas = []
        filtered_distances = []
        
        for doc, meta, dist in zip(documents, metadatas, distances):
            score = 1 - dist
            if score >= request.min_score:
                filtered_docs.append(doc)
                filtered_metas.append(meta)
                filtered_distances.append(dist)
        
        # Slice to requested n_results
        documents = filtered_docs[:request.n_results]
        metadatas = filtered_metas[:request.n_results]
        distances = filtered_distances[:request.n_results]
        
        # If no documents found after filtering, but we have history, we should still try to answer
        if not documents and not request.history:
            return {
                "answer": "No relevant documents found meeting the accuracy criteria.",
                "sources": [],
                "query": request.query
            }
        
        # 4. Build context from retrieved documents
        context = "\\n\\n".join([f"Document {i+1}:\\n{doc}" for i, doc in enumerate(documents)])
        
        # 5. Create RAG prompt
        # Use custom system prompt if provided
        system_prompt = request.llm_config.get("system_prompt", "You are a helpful AI assistant. Answer the user's question based on the provided context. If the context doesn't contain relevant information, say so.")
        
        user_prompt = f"""Context from knowledge base:
{context}

Question: {request.query}

Please provide a clear and concise answer based on the context above."""

        # Prepend chat history if available
        if request.history:
            history_str = "\n".join([f"{msg.role.capitalize()}: {msg.content}" for msg in request.history])
            user_prompt = f"""Chat History:
{history_str}

{user_prompt}"""
        
        # 6. Generate LLM response
        llm_provider = ProviderFactory.get_llm_provider(
            request.llm_provider,
            request.llm_config
        )
        
        # Extract LLM params
        temperature = request.llm_config.get("temperature", 0.7)
        max_tokens = request.llm_config.get("max_tokens", 2048)
        
        answer = llm_provider.generate(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        # 7. Format sources
        sources = []
        for i, (doc, metadata, distance) in enumerate(zip(documents, metadatas, distances)):
            sources.append({
                "chunk_id": i + 1,
                "text": doc,
                "metadata": metadata,
                "score": 1 - distance  # Convert distance to similarity score
            })
        
        return {
            "answer": answer,
            "sources": sources,
            "query": request.query
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/list")
async def list_chunks(offset: int = 0, limit: int = 10, q: Optional[str] = None):
    """
    List stored chunks with pagination and optional search
    
    Args:
        offset: Number of chunks to skip (default: 0)
        limit: Maximum number of chunks to return (default: 10)
        q: Search query string (optional)
    """
    try:
        result = get_vector_store().get_all_documents(offset=offset, limit=limit, search_query=q)
        return {
            "chunks": result["documents"],
            "total": result["total"],
            "offset": offset,
            "limit": limit,
            "q": q
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
async def get_stats():
    """
    Get statistics about the knowledge base
    
    Returns:
        - total_chunks: Total number of chunks in the database
        - total_tokens: Total word count across all chunks
        - last_updated: Timestamp of most recently added chunk
    """
    try:
        stats = get_vector_store().get_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/delete")
async def delete_chunks(request: DeleteRequest):
    """
    Delete chunks from the vector store
    - Delete all chunks if delete_all is True
    - Delete specific chunks by IDs if ids are provided
    """
    try:
        store = get_vector_store()
        
        if request.delete_all:
            store.delete_all()
            return {
                "status": "success",
                "message": "All chunks deleted successfully"
            }
        elif request.ids:
            store.delete_by_ids(request.ids)
            return {
                "status": "success",
                "message": f"Deleted {len(request.ids)} chunk(s) successfully",
                "deleted_ids": request.ids
            }
        else:
            raise HTTPException(
                status_code=400, 
                detail="Either provide 'ids' to delete specific chunks or set 'delete_all' to true"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


