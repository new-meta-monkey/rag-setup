"""
Abstract base class for chunking strategies
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class Chunk(BaseModel):
    """Represents a text chunk"""
    text: str
    start_index: int
    end_index: int
    metadata: Dict[str, Any] = {}


class ChunkingStrategy(ABC):
    """Abstract base class for all chunking strategies"""
    
    @abstractmethod
    def chunk(self, text: str, pages: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
        """
        Split text into chunks based on the strategy
        
        Args:
            text: Input text to chunk
            pages: Optional list of page objects with metadata
            
        Returns:
            List of chunk objects (dicts with text and metadata)
        """
        pass
    
    @abstractmethod
    def get_strategy_name(self) -> str:
        """
        Get the name of this chunking strategy
        
        Returns:
            Strategy name
        """
        pass
    
    @abstractmethod
    def get_default_config(self) -> Dict[str, Any]:
        """
        Get default configuration for this strategy
        
        Returns:
            Dictionary with default configuration
        """
        pass


