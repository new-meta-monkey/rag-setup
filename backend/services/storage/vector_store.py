"""
Vector Store Interface
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class VectorStore(ABC):
    """Abstract base class for vector stores"""
    
    @abstractmethod
    def add_documents(self, documents: List[str], embeddings: List[List[float]], metadatas: List[Dict[str, Any]] = None, ids: List[str] = None):
        """Add documents and their embeddings to the store"""
        pass
        
    @abstractmethod
    def query(self, query_embeddings: List[List[float]], n_results: int = 5, where: Dict[str, Any] = None) -> Dict[str, Any]:
        """Query the store"""
        pass
        
    @abstractmethod
    def get_all_documents(self) -> List[Dict[str, Any]]:
        """Get all documents from the store"""
        pass
