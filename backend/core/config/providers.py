"""
Provider Factory
"""
from typing import Optional
from backend.core.providers.base.embedding_provider import EmbeddingProvider
from backend.core.providers.base.llm_provider import LLMProvider
from backend.core.providers.vertex.embedding import VertexEmbeddingProvider
from backend.core.providers.vertex.llm import VertexLLMProvider
from backend.core.providers.openai.embedding import OpenAIEmbeddingProvider
from backend.core.providers.openai.llm import OpenAILLMProvider
from backend.core.providers.local.embedding import LocalEmbeddingProvider
from backend.core.providers.azure.embedding import AzureOpenAIEmbeddingProvider
from backend.core.providers.aws.embedding import BedrockEmbeddingProvider

class ProviderFactory:
    """Factory for creating provider instances"""
    
    @staticmethod
    def get_embedding_provider(provider_type: str, config: dict) -> EmbeddingProvider:
        """
        Get an embedding provider instance
        
        Args:
            provider_type: Type of provider ('vertex', 'openai', 'local', 'azure', 'aws')
            config: Configuration dictionary for the provider
            
        Returns:
            Instance of EmbeddingProvider
        """
        if provider_type == "vertex":
            return VertexEmbeddingProvider(
                project_id=config.get("project_id"),
                location=config.get("location", "us-central1"),
                model_name=config.get("model_name", "text-embedding-004"),
                credentials_json=config.get("credentials_json")
            )
        elif provider_type == "openai":
            return OpenAIEmbeddingProvider(
                api_key=config.get("api_key"),
                model_name=config.get("model_name", "text-embedding-3-small")
            )
        elif provider_type == "local":
            return LocalEmbeddingProvider(
                model_name=config.get("model_name", "all-MiniLM-L6-v2")
            )
        elif provider_type == "azure":
            return AzureOpenAIEmbeddingProvider(
                api_key=config.get("api_key"),
                azure_endpoint=config.get("azure_endpoint"),
                api_version=config.get("api_version", "2023-05-15"),
                deployment_name=config.get("deployment_name")
            )
        elif provider_type == "aws":
            return BedrockEmbeddingProvider(
                region_name=config.get("region_name", "us-east-1"),
                access_key_id=config.get("access_key_id"),
                secret_access_key=config.get("secret_access_key"),
                model_id=config.get("model_id", "amazon.titan-embed-text-v1")
            )
        else:
            raise ValueError(f"Unknown provider type: {provider_type}")
    
    @staticmethod
    def get_llm_provider(provider_type: str, config: dict) -> LLMProvider:
        """
        Get an LLM provider instance
        
        Args:
            provider_type: Type of provider ('vertex', 'openai')
            config: Configuration dictionary for the provider
            
        Returns:
            Instance of LLMProvider
        """
        if provider_type == "vertex":
            return VertexLLMProvider(
                project_id=config.get("project_id"),
                location=config.get("location", "us-central1"),
                model_name=config.get("model_name", "gemini-2.5-pro"),
                credentials_json=config.get("credentials_json")
            )
        elif provider_type == "openai":
            return OpenAILLMProvider(
                api_key=config.get("api_key"),
                model_name=config.get("model_name", "gpt-4o-mini")
            )
        else:
            raise ValueError(f"Unknown LLM provider type: {provider_type}")
