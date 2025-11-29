"""
OpenAI Embedding Provider
"""
from typing import List
from backend.core.providers.base.embedding_provider import EmbeddingProvider

class OpenAIEmbeddingProvider(EmbeddingProvider):
    """OpenAI implementation of EmbeddingProvider"""
    
    def __init__(self, api_key: str, model_name: str = "text-embedding-3-small"):
        # Workaround for proxies parameter issue in OpenAI SDK 1.3.7
        # Import httpx and patch it before importing openai
        try:
            import httpx
            # Store original Client class
            _original_client = httpx.Client
            
            # Create wrapper that filters out proxies parameter
            class PatchedClient(_original_client):
                def __init__(self, *args, **kwargs):
                    # Remove proxies parameter if present
                    kwargs.pop('proxies', None)
                    super().__init__(*args, **kwargs)
            
            # Temporarily replace httpx.Client
            httpx.Client = PatchedClient
            
            # Now import and initialize OpenAI
            import openai
            self.client = openai.OpenAI(api_key=api_key)
            
            # Restore original Client class
            httpx.Client = _original_client
            
        except Exception as e:
            # Fallback to direct initialization
            import openai
            try:
                self.client = openai.OpenAI(api_key=api_key)
            except TypeError:
                # Last resort: use environment variable
                import os
                os.environ["OPENAI_API_KEY"] = api_key
                self.client = openai.OpenAI()
        
        self.model_name = model_name
        
    def embed(self, text: str) -> List[float]:
        """Generate embedding for a single text"""
        response = self.client.embeddings.create(
            input=text,
            model=self.model_name
        )
        return response.data[0].embedding
    
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        response = self.client.embeddings.create(
            input=texts,
            model=self.model_name
        )
        # Ensure order is preserved
        return [data.embedding for data in response.data]
    
    def get_dimension(self) -> int:
        """Get the dimension of embeddings produced by this provider"""
        if self.model_name == "text-embedding-3-small":
            return 1536
        elif self.model_name == "text-embedding-3-large":
            return 3072
        return 1536 # Default fallback
    
    def validate_api_key(self) -> bool:
        """Validate the API key/credentials for this provider"""
        try:
            self.client.models.list()
            return True
        except Exception:
            return False
