"""
AWS Bedrock Embedding Provider
"""
from typing import List
import json
from backend.core.providers.base.embedding_provider import EmbeddingProvider

class BedrockEmbeddingProvider(EmbeddingProvider):
    """AWS Bedrock implementation of EmbeddingProvider"""
    
    def __init__(self, region_name: str, access_key_id: str, secret_access_key: str, model_id: str = "amazon.titan-embed-text-v1"):
        # Lazy import to avoid loading boto3 at module import time
        import boto3
        
        self.client = boto3.client(
            service_name='bedrock-runtime',
            region_name=region_name,
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key
        )
        self.model_id = model_id
        
    def embed(self, text: str) -> List[float]:
        """Generate embedding for a single text"""
        body = json.dumps({
            "inputText": text
        })
        
        response = self.client.invoke_model(
            body=body,
            modelId=self.model_id,
            accept='application/json',
            contentType='application/json'
        )
        
        response_body = json.loads(response.get('body').read())
        return response_body.get('embedding')
    
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        # Bedrock doesn't support batching in a single call for Titan, so we loop
        return [self.embed(text) for text in texts]
    
    def get_dimension(self) -> int:
        """Get the dimension of embeddings produced by this provider"""
        if "titan-embed-text-v1" in self.model_id:
            return 1536
        elif "cohere" in self.model_id:
            return 1024 # Example, depends on model
        return 1536
    
    def validate_api_key(self) -> bool:
        """Validate the API key/credentials for this provider"""
        try:
            self.embed("test")
            return True
        except Exception:
            return False
