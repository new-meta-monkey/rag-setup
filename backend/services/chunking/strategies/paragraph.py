"""
Paragraph Chunking Strategy
"""
from typing import List
from backend.services.chunking.base.chunking_strategy import ChunkingStrategy

class ParagraphChunkingStrategy(ChunkingStrategy):
    """Splits text by paragraphs (double newlines)"""
    
    def __init__(self, min_chunk_size: int = 100):
        self.min_chunk_size = min_chunk_size
        
    def chunk(self, text: str, pages: List[dict] = None) -> List[dict]:
        """
        Split text into paragraph chunks
        
        Args:
            text: Input text
            pages: Optional list of page objects for metadata mapping
            
        Returns:
            List of dicts with text and metadata
        """
        if not text:
            return []
            
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

        # Split by double newlines (standard paragraph break)
        # We use a regex to keep delimiters or just track offsets manually
        # Simpler: track offsets as we iterate
        raw_paragraphs = text.split("\n\n")
        
        chunks = []
        current_chunk_text = ""
        current_chunk_start = 0
        current_pos = 0
        
        for i, p in enumerate(raw_paragraphs):
            # p is the paragraph text
            # The actual text in original string includes \n\n after it, except last one
            # But wait, split consumes the delimiter.
            # We need to account for it in current_pos.
            
            p_len = len(p)
            
            # Skip empty paragraphs but advance position (they are just \n\n\n\n etc)
            # Actually split('\n\n') on "a\n\n\n\nb" gives ['a', '', 'b']
            # So empty string means a double newline sequence.
            
            if not p.strip():
                current_pos += p_len + 2 # +2 for the split delimiter
                continue

            # If this is the first paragraph in a new chunk
            if not current_chunk_text:
                current_chunk_start = current_pos
                current_chunk_text = p
            else:
                if len(current_chunk_text) + 2 + len(p) < self.min_chunk_size:
                    # Merge
                    current_chunk_text += "\n\n" + p
                else:
                    # Finalize current chunk
                    chunk_pages = []
                    if page_map:
                        chunk_end = current_chunk_start + len(current_chunk_text)
                        for pm in page_map:
                            if current_chunk_start < pm["end"] and chunk_end > pm["start"]:
                                chunk_pages.append(pm["page_number"])

                    chunks.append({
                        "text": current_chunk_text,
                        "metadata": {
                            "page_numbers": chunk_pages
                        }
                    })
                    
                    # Start new chunk
                    current_chunk_start = current_pos
                    current_chunk_text = p
            
            # Advance position
            current_pos += p_len + 2 # +2 for the \n\n that was split out
                
        # Final chunk
        if current_chunk_text:
            chunk_pages = []
            if page_map:
                chunk_end = current_chunk_start + len(current_chunk_text)
                for pm in page_map:
                    if current_chunk_start < pm["end"] and chunk_end > pm["start"]:
                        chunk_pages.append(pm["page_number"])
                        
            chunks.append({
                "text": current_chunk_text,
                "metadata": {
                    "page_numbers": chunk_pages
                }
            })
            
        return chunks

    def get_strategy_name(self) -> str:
        return "paragraph"

    def get_default_config(self) -> dict:
        return {
            "min_chunk_size": 100
        }
