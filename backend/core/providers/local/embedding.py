"""
Local Embedding Provider using SentenceTransformers
"""
from typing import List
from backend.core.providers.base.embedding_provider import EmbeddingProvider

class LocalEmbeddingProvider(EmbeddingProvider):
    """Local implementation of EmbeddingProvider using SentenceTransformers"""
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self._model = None
        # Don't initialize immediately to avoid loading torch at import time
        
    def _initialize(self):
        """Initialize SentenceTransformer model (lazy loading)"""
        if self._model is not None:
            return
            
        try:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(self.model_name)
        except Exception as e:
            print(f"Failed to initialize SentenceTransformer: {e}")
            raise RuntimeError(f"Failed to load local model '{self.model_name}'. Error: {e}")
            
    def embed(self, text: str) -> List[float]:
        """Generate embedding for a single text"""
        if self._model is None:
            self._initialize()
            
        if not self._model:
            raise RuntimeError("Local model not initialized")
            
        embedding = self._model.encode(text)
        return embedding.tolist()
    
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        if self._model is None:
            self._initialize()
            
        if not self._model:
            raise RuntimeError("Local model not initialized")
            
        embeddings = self._model.encode(texts)
        return embeddings.tolist()
    
    def get_dimension(self) -> int:
        """Get the dimension of embeddings produced by this provider"""
        if not self._model:
            # Fallback or try to load config. 
            # all-MiniLM-L6-v2 is 384
            return 384 
        return self._model.get_sentence_embedding_dimension()
    
    def validate_api_key(self) -> bool:
        """Validate the provider (no key needed for local)"""
        return self._model is not None
