"""
ChromaDB Store Implementation
"""
import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any, Optional
import uuid
import os
from backend.services.storage.vector_store import VectorStore

from chromadb.api.types import Documents, EmbeddingFunction, Embeddings

class PassthroughEmbeddingFunction(EmbeddingFunction):
    """
    Dummy embedding function to avoid ChromaDB's default SentenceTransformer dependency.
    We generate embeddings manually using our ProviderFactory.
    """
    def __call__(self, input: Documents) -> Embeddings:
        return []

class ChromaStore(VectorStore):
    """ChromaDB implementation of VectorStore"""
    
    def __init__(self, collection_name: str = "rag_collection", persist_directory: str = "./chroma_db"):
        self.client = chromadb.PersistentClient(path=persist_directory)
        # Use a dummy embedding function to prevent Chroma from trying to load onnxruntime
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            embedding_function=PassthroughEmbeddingFunction()
        )
        
    def add_documents(self, documents: List[str], embeddings: List[List[float]], metadatas: List[Dict[str, Any]] = None, ids: List[str] = None):
        """
        Add documents and their embeddings to the store
        
        Args:
            documents: List of text documents
            embeddings: List of embedding vectors
            metadatas: List of metadata dicts
            ids: List of IDs (generated if not provided)
        """
        if not ids:
            ids = [str(uuid.uuid4()) for _ in documents]
            
        if not metadatas:
            metadatas = [{"source": "unknown"} for _ in documents]
        
        # Add timestamp to each metadata
        from datetime import datetime, timezone
        timestamp = datetime.now(timezone.utc).isoformat()
        for metadata in metadatas:
            metadata["created_at"] = timestamp
            
        self.collection.add(
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )
        
    def query(self, query_embeddings: List[List[float]], n_results: int = 5, where: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Query the store
        
        Args:
            query_embeddings: List of query vectors
            n_results: Number of results to return
            where: Metadata filter
            
        Returns:
            Query results
        """
        return self.collection.query(
            query_embeddings=query_embeddings,
            n_results=n_results,
            where=where
        )
        
    def get_all_documents(self, offset: int = 0, limit: Optional[int] = None, search_query: Optional[str] = None) -> Dict[str, Any]:
        """
        Get documents from the store with pagination and optional search
        
        Args:
            offset: Number of documents to skip
            limit: Maximum number of documents to return
            search_query: Optional text to search for
            
        Returns:
            Dictionary with documents list and total count
        """
        where_document = None
        if search_query:
            where_document = {"$contains": search_query}

        # Get all IDs first to know total count (with filter if applied)
        all_result = self.collection.get(where_document=where_document)
        total_count = len(all_result['ids']) if all_result and all_result['ids'] else 0
        
        if total_count == 0:
            return {"documents": [], "total": 0}
        
        # Get paginated subset
        # Note: ChromaDB doesn't support offset/limit directly in get() efficiently for large datasets combined with where_document in the same way SQL does,
        # but for this scale it's fine to get IDs and slice.
        # However, if we use where_document, the IDs returned are already filtered.
        
        if limit:
            end_idx = min(offset + limit, total_count)
            ids_to_fetch = all_result['ids'][offset:end_idx]
        else:
            ids_to_fetch = all_result['ids'][offset:]
        
        if not ids_to_fetch:
            return {"documents": [], "total": total_count}
        
        # Fetch the specific documents
        result = self.collection.get(ids=ids_to_fetch)
        
        documents = []
        if result and result['ids']:
            for i, doc_id in enumerate(result['ids']):
                documents.append({
                    "id": doc_id,
                    "text": result['documents'][i] if result['documents'] else "",
                    "metadata": result['metadatas'][i] if result['metadatas'] else {}
                })
                
        return {"documents": documents, "total": total_count}

    def delete_by_ids(self, ids: List[str]):
        """
        Delete documents by their IDs
        
        Args:
            ids: List of document IDs to delete
        """
        self.collection.delete(ids=ids)
    
    def delete_all(self):
        """
        Delete all documents from the collection
        """
        # Get all IDs first
        result = self.collection.get()
        if result and result['ids']:
            self.collection.delete(ids=result['ids'])

    def delete_by_metadata(self, **kwargs):
        """
        Delete documents matching specific metadata criteria
        
        Args:
            **kwargs: Metadata key-value pairs to match
        """
        if not kwargs:
            return
            
        self.collection.delete(where=kwargs)

    def get_all_embeddings(self) -> List[Dict[str, Any]]:
        """
        Get all documents with their embeddings
        
        Returns:
            List of dicts with id, metadata, and embedding
        """
        # Fetch all data including embeddings
        result = self.collection.get(include=['embeddings', 'metadatas', 'documents'])
        
        items = []
        if result and result['ids']:
            for i, doc_id in enumerate(result['ids']):
                items.append({
                    "id": doc_id,
                    "embedding": result['embeddings'][i],
                    "metadata": result['metadatas'][i] if result['metadatas'] else {},
                    "document": result['documents'][i] if result['documents'] else ""
                })
                
        return items
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the stored documents
        
        Returns:
            Dictionary with total_chunks, total_tokens, and last_updated
        """
        # Get all documents
        result = self.collection.get()
        
        if not result or not result['ids']:
            return {
                "total_chunks": 0,
                "total_tokens": 0,
                "last_updated": None
            }
        
        total_chunks = len(result['ids'])
        
        # Calculate total tokens (word count)
        total_tokens = 0
        if result['documents']:
            for doc in result['documents']:
                total_tokens += len(doc.split())
        
        # Find most recent timestamp
        last_updated = None
        if result['metadatas']:
            timestamps = []
            for metadata in result['metadatas']:
                if metadata and 'created_at' in metadata:
                    timestamps.append(metadata['created_at'])
            
            if timestamps:
                # Sort and get the most recent
                timestamps.sort(reverse=True)
                last_updated = timestamps[0]
        
        return {
            "total_chunks": total_chunks,
            "total_tokens": total_tokens,
            "last_updated": last_updated
        }
