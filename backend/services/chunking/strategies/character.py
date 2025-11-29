"""
Character Chunking Strategy
"""
from typing import List, Dict, Any
from backend.services.chunking.base.chunking_strategy import ChunkingStrategy

class CharacterChunkingStrategy(ChunkingStrategy):
    """Splits text into fixed-size character chunks with overlap"""
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        
    def chunk(self, text: str, pages: List[dict] = None) -> List[dict]:
        """
        Split text into chunks
        
        Args:
            text: Input text
            pages: Optional list of page objects for metadata mapping
            
        Returns:
            List of dicts with text and metadata
        """
        if not text:
            return []
            
        chunks = []
        start = 0
        text_len = len(text)
        
        # Build page offset map if pages provided
        page_map = []
        if pages:
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
        
        while start < text_len:
            end = start + self.chunk_size
            chunk_text = text[start:end]
            
            # Find overlapping pages
            chunk_pages = []
            if page_map:
                chunk_end = start + len(chunk_text)
                for p in page_map:
                    # Check overlap: start < p_end and end > p_start
                    if start < p["end"] and chunk_end > p["start"]:
                        chunk_pages.append(p["page_number"])
            
            chunks.append({
                "text": chunk_text,
                "metadata": {
                    "page_numbers": chunk_pages
                }
            })
            
            if end >= text_len:
                break
                
            start += self.chunk_size - self.chunk_overlap
            
        return chunks

    def get_strategy_name(self) -> str:
        return "character"

    def get_default_config(self) -> dict:
        return {
            "chunk_size": 1000,
            "chunk_overlap": 200
        }
