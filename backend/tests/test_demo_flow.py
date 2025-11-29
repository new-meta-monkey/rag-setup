"""
Test script for verifying backend implementation
"""
import sys
import os
import json
from typing import List

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.services.chunking.chunk_factory import ChunkFactory
from backend.services.visualization.projector import VectorProjector
from backend.core.providers.base.embedding_provider import EmbeddingProvider

# Mock Embedding Provider
class MockEmbeddingProvider(EmbeddingProvider):
    def embed(self, text: str) -> List[float]:
        # Return deterministic dummy embedding based on text length
        import random
        random.seed(len(text))
        return [random.random() for _ in range(768)]
    
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        return [self.embed(t) for t in texts]
    
    def get_dimension(self) -> int:
        return 768
    
    def validate_api_key(self) -> bool:
        return True

def test_chunking():
    print("\n--- Testing Chunking Strategies ---")
    text = "This is sentence one. This is sentence two. This is sentence three.\n\nThis is a new paragraph. It has some more text."
    
    # 1. Character
    strategy = ChunkFactory.get_strategy("character", {"chunk_size": 20, "chunk_overlap": 5})
    chunks = strategy.chunk(text)
    print(f"Character chunks ({len(chunks)}): {chunks[:3]}...")
    assert len(chunks) > 0
    
    # 2. Paragraph
    strategy = ChunkFactory.get_strategy("paragraph")
    chunks = strategy.chunk(text)
    print(f"Paragraph chunks ({len(chunks)}): {chunks}")
    assert len(chunks) == 2
    
    # 3. Sentence
    strategy = ChunkFactory.get_strategy("sentence", {"sentences_per_chunk": 1})
    chunks = strategy.chunk(text)
    print(f"Sentence chunks ({len(chunks)}): {chunks}")
    assert len(chunks) >= 5
    
    # 4. Semantic
    mock_provider = MockEmbeddingProvider()
    strategy = ChunkFactory.get_strategy("semantic", {"threshold": 0.5}, mock_provider)
    chunks = strategy.chunk(text)
    print(f"Semantic chunks ({len(chunks)}): {chunks}")
    assert len(chunks) > 0

def test_visualization():
    print("\n--- Testing Visualization ---")
    texts = ["apple", "banana", "cherry", "dog", "cat", "elephant"]
    mock_provider = MockEmbeddingProvider()
    embeddings = mock_provider.embed_batch(texts)
    
    # 1. PCA
    points = VectorProjector.project(embeddings, method="pca", n_components=3)
    print(f"PCA Points (3D): {points[0]}")
    assert len(points) == len(texts)
    assert "z" in points[0]
    
    # 2. t-SNE
    points = VectorProjector.project(embeddings, method="tsne", n_components=2)
    print(f"t-SNE Points (2D): {points[0]}")
    assert len(points) == len(texts)
    assert "z" not in points[0]

if __name__ == "__main__":
    try:
        test_chunking()
        test_visualization()
        print("\n✅ All tests passed!")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
