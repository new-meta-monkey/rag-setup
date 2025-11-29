"""
Azure OpenAI Embedding Provider
"""
from typing import List
import openai
from backend.core.providers.base.embedding_provider import EmbeddingProvider

class AzureOpenAIEmbeddingProvider(EmbeddingProvider):
    """Azure OpenAI implementation of EmbeddingProvider"""
    
    def __init__(self, api_key: str, azure_endpoint: str, api_version: str, deployment_name: str):
        self.client = openai.AzureOpenAI(
            api_key=api_key,
            api_version=api_version,
            azure_endpoint=azure_endpoint
        )
        self.deployment_name = deployment_name
        
    def embed(self, text: str) -> List[float]:
        """Generate embedding for a single text"""
        response = self.client.embeddings.create(
            input=text,
            model=self.deployment_name
        )
        return response.data[0].embedding
    
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        response = self.client.embeddings.create(
            input=texts,
            model=self.deployment_name
        )
        # Ensure order is preserved
        return [data.embedding for data in response.data]
    
    def get_dimension(self) -> int:
        """Get the dimension of embeddings produced by this provider"""
        # Azure OpenAI embeddings dimension depends on the model deployed
        # Usually 1536 for ada-002 or text-embedding-3-small
        # We can try to infer or default to 1536
        return 1536
    
    def validate_api_key(self) -> bool:
        """Validate the API key/credentials for this provider"""
        try:
            # Try a dummy embedding
            self.embed("test")
            return True
        except Exception:
            return False
