"""
Chunk Factory
"""
from typing import Optional
from backend.services.chunking.base.chunking_strategy import ChunkingStrategy
from backend.services.chunking.strategies.character import CharacterChunkingStrategy
from backend.services.chunking.strategies.paragraph import ParagraphChunkingStrategy
from backend.services.chunking.strategies.sentence import SentenceChunkingStrategy
from backend.services.chunking.strategies.semantic import SemanticChunkingStrategy
from backend.services.chunking.strategies.recursive import RecursiveChunkingStrategy
from backend.services.chunking.strategies.hierarchical import HierarchicalChunkingStrategy
from backend.core.providers.base.embedding_provider import EmbeddingProvider

class ChunkFactory:
    """Factory for creating chunking strategy instances"""
    
    @staticmethod
    def get_strategy(strategy_type: str, config: dict = None, embedding_provider: EmbeddingProvider = None) -> ChunkingStrategy:
        """
        Get a chunking strategy instance
        
        Args:
            strategy_type: Type of strategy ('character', 'paragraph', 'sentence', 'semantic', 'recursive', 'hierarchical')
            config: Configuration dictionary
            embedding_provider: Required for semantic chunking
            
        Returns:
            Instance of ChunkingStrategy
        """
        config = config or {}
        
        if strategy_type == "character":
            return CharacterChunkingStrategy(
                chunk_size=config.get("chunk_size", 1000),
                chunk_overlap=config.get("chunk_overlap", 200)
            )
        elif strategy_type == "paragraph":
            return ParagraphChunkingStrategy(
                min_chunk_size=config.get("min_chunk_size", 100)
            )
        elif strategy_type == "sentence":
            return SentenceChunkingStrategy(
                sentences_per_chunk=config.get("sentences_per_chunk", 5),
                overlap=config.get("overlap", 1)
            )
        elif strategy_type == "semantic":
            if not embedding_provider:
                raise ValueError("Embedding provider required for semantic chunking")
            return SemanticChunkingStrategy(
                embedding_provider=embedding_provider,
                threshold=config.get("threshold", 0.8)
            )
        elif strategy_type == "recursive":
            return RecursiveChunkingStrategy(
                chunk_size=config.get("chunk_size", 1000),
                chunk_overlap=config.get("chunk_overlap", 200),
                separators=config.get("separators", ["\n\n", "\n", " ", ""])
            )
        elif strategy_type == "hierarchical":
            return HierarchicalChunkingStrategy(
                split_level=config.get("split_level", 2)
            )
        else:
            raise ValueError(f"Unknown strategy type: {strategy_type}")
