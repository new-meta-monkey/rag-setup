"""
Abstract base class for embedding providers
"""
from abc import ABC, abstractmethod
from typing import List


class EmbeddingProvider(ABC):
    """Abstract base class for all embedding providers"""
    
    @abstractmethod
    def embed(self, text: str) -> List[float]:
        """
        Generate embedding for a single text
        
        Args:
            text: Input text to embed
            
        Returns:
            List of floats representing the embedding vector
        """
        pass
    
    @abstractmethod
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts
        
        Args:
            texts: List of input texts to embed
            
        Returns:
            List of embedding vectors
        """
        pass
    
    @abstractmethod
    def get_dimension(self) -> int:
        """
        Get the dimension of embeddings produced by this provider
        
        Returns:
            Dimension of the embedding vector
        """
        pass
    
    @abstractmethod
    def validate_api_key(self) -> bool:
        """
        Validate the API key/credentials for this provider
        
        Returns:
            True if valid, False otherwise
        """
        pass


