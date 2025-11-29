"""
Vertex AI Embedding Provider
"""
from typing import List, Optional
import json
from backend.core.providers.base.embedding_provider import EmbeddingProvider

class VertexEmbeddingProvider(EmbeddingProvider):
    """Vertex AI implementation of EmbeddingProvider"""
    
    def __init__(self, project_id: str, location: str = "us-central1", model_name: str = "text-embedding-004", credentials_json: Optional[str] = None):
        self.project_id = project_id
        self.location = location
        self.model_name = model_name
        self.credentials_json = credentials_json
        self._model = None
        # Defer initialization to avoid loading vertexai/torch at import time
        
    def _initialize(self):
        """Initialize Vertex AI SDK (lazy loading)"""
        if self._model is not None:
            return
            
        try:
            import vertexai
            from vertexai.language_models import TextEmbeddingModel
            from google.oauth2 import service_account
            
            credentials = None
            if self.credentials_json:
                try:
                    service_account_info = json.loads(self.credentials_json)
                    credentials = service_account.Credentials.from_service_account_info(service_account_info)
                except Exception as e:
                    print(f"Failed to parse Vertex credentials JSON: {e}")
            
            # Initialize Vertex AI with error handling for proxies parameter issue
            try:
                vertexai.init(project=self.project_id, location=self.location, credentials=credentials)
            except TypeError as e:
                # Handle proxies parameter error in newer SDK versions
                if "proxies" in str(e):
                    print(f"Warning: Vertex AI SDK version incompatibility detected. Trying alternative initialization...")
                    # Try without credentials parameter which might be causing the issue
                    vertexai.init(project=self.project_id, location=self.location)
                else:
                    raise
            
            self._model = TextEmbeddingModel.from_pretrained(self.model_name)
        except Exception as e:
            print(f"Failed to initialize Vertex AI: {e}")
            print(f"Error type: {type(e).__name__}")
            raise RuntimeError(f"Failed to initialize Vertex AI. Error: {e}")
            
    def embed(self, text: str) -> List[float]:
        """Generate embedding for a single text"""
        if self._model is None:
            self._initialize()
            
        if not self._model:
            raise RuntimeError("Vertex AI model not initialized")
            
        embeddings = self._model.get_embeddings([text])
        return embeddings[0].values
    
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        if self._model is None:
            self._initialize()
            
        if not self._model:
            raise RuntimeError("Vertex AI model not initialized")
            
        # Vertex AI has a limit on batch size (usually 5 or 250 depending on model/version)
        # Implementing simple batching here
        BATCH_SIZE = 5
        all_embeddings = []
        
        for i in range(0, len(texts), BATCH_SIZE):
            batch = texts[i:i + BATCH_SIZE]
            embeddings = self._model.get_embeddings(batch)
            all_embeddings.extend([e.values for e in embeddings])
            
        return all_embeddings
    
    def get_dimension(self) -> int:
        """Get the dimension of embeddings produced by this provider"""
        # text-embedding-004 is 768 dimensions
        return 768
    
    def validate_api_key(self) -> bool:
        """Validate the API key/credentials for this provider"""
        try:
            # Try a dummy embedding
            self.embed("test")
            return True
        except Exception:
            return False
