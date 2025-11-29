"""
Custom exceptions for the RAG application
"""
from typing import Optional


class RAGException(Exception):
    """Base exception for RAG application"""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class ConfigurationError(RAGException):
    """Raised when there's a configuration error"""
    def __init__(self, message: str):
        super().__init__(message, status_code=500)


class ProviderError(RAGException):
    """Raised when a provider (embedding/LLM) fails"""
    def __init__(self, message: str, provider: Optional[str] = None):
        self.provider = provider
        super().__init__(message, status_code=502)


class ExtractionError(RAGException):
    """Raised when text extraction fails"""
    def __init__(self, message: str):
        super().__init__(message, status_code=400)


class ChunkingError(RAGException):
    """Raised when chunking fails"""
    def __init__(self, message: str):
        super().__init__(message, status_code=400)


class StorageError(RAGException):
    """Raised when storage operations fail"""
    def __init__(self, message: str):
        super().__init__(message, status_code=500)


class ValidationError(RAGException):
    """Raised when validation fails"""
    def __init__(self, message: str):
        super().__init__(message, status_code=400)


