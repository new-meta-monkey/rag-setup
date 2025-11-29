"""
Semantic Chunking Strategy
"""
from typing import List
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from backend.services.chunking.base.chunking_strategy import ChunkingStrategy
from backend.core.providers.base.embedding_provider import EmbeddingProvider

class SemanticChunkingStrategy(ChunkingStrategy):
    """
    Splits text based on semantic similarity changes.
    Uses a sliding window of sentences and checks embedding similarity.
    """
    
    def __init__(self, embedding_provider: EmbeddingProvider, threshold: float = 0.8):
        self.embedding_provider = embedding_provider
        self.threshold = threshold
        
    def _split_sentences(self, text: str) -> List[str]:
        import re
        sentences = re.split(r'(?<=[.!?])\s+', text)
        return [s.strip() for s in sentences if s.strip()]
        
    def chunk(self, text: str, pages: List[dict] = None) -> List[dict]:
        """
        Split text based on semantic similarity
        
        Args:
            text: Input text
            pages: Optional list of page objects with metadata
            
        Returns:
            List of chunk objects (dicts with text and metadata)
        """
        if not text:
            return []
            
        sentences = self._split_sentences(text)
        if len(sentences) < 2:
            return [{"text": text, "metadata": self._get_chunk_metadata(text, text, pages)}]
            
        # Generate embeddings for all sentences
        embeddings = self.embedding_provider.embed_batch(sentences)
        
        chunks = []
        current_chunk_sentences = [sentences[0]]
        
        for i in range(1, len(sentences)):
            prev_embedding = np.array(embeddings[i-1]).reshape(1, -1)
            curr_embedding = np.array(embeddings[i]).reshape(1, -1)
            
            # Calculate cosine similarity
            similarity = cosine_similarity(prev_embedding, curr_embedding)[0][0]
            
            if similarity >= self.threshold:
                # Semantically similar, keep in same chunk
                current_chunk_sentences.append(sentences[i])
            else:
                # Semantic break, start new chunk
                chunk_text = " ".join(current_chunk_sentences)
                chunks.append({
                    "text": chunk_text,
                    "metadata": self._get_chunk_metadata(chunk_text, text, pages)
                })
                current_chunk_sentences = [sentences[i]]
                
        if current_chunk_sentences:
            chunk_text = " ".join(current_chunk_sentences)
            chunks.append({
                "text": chunk_text,
                "metadata": self._get_chunk_metadata(chunk_text, text, pages)
            })
            
        return chunks

    def _get_chunk_metadata(self, chunk_text: str, full_text: str, pages: List[dict] = None) -> dict:
        if not pages:
            return {}
            
        # Build page offset map
        page_map = []
        current_offset = 0
        for i, page in enumerate(pages):
            page_text_len = len(page["text"])
            page_end = current_offset + page_text_len
            page_map.append({
                "start": current_offset,
                "end": page_end,
                "page_number": page["page_number"]
            })
            # Add length of separator (\n\n) except for last page
            if i < len(pages) - 1:
                current_offset = page_end + 2
            else:
                current_offset = page_end
            
        # Find start index of chunk in full text
        # Note: This is a simple approximation. For repeated text, it might pick the first occurrence.
        start_index = full_text.find(chunk_text)
        if start_index == -1:
            return {}
            
        end_index = start_index + len(chunk_text)
        
        chunk_pages = []
        for pm in page_map:
            # Check overlap
            if (start_index < pm["end"] and end_index > pm["start"]):
                if pm["page_number"] not in chunk_pages:
                    chunk_pages.append(pm["page_number"])
                    
        return {"page_numbers": chunk_pages}

    def get_strategy_name(self) -> str:
        return "semantic"

    def get_default_config(self) -> dict:
        return {
            "threshold": 0.8
        }
