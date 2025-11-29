"""
Recursive Chunking Strategy
"""
import re
from typing import List, Dict, Any, Optional
from backend.services.chunking.base.chunking_strategy import ChunkingStrategy

class RecursiveChunkingStrategy(ChunkingStrategy):
    """
    Splits text recursively by different characters (separators) 
    to find the best split point that fits within the chunk size.
    """
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200, separators: List[str] = None):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = separators or ["\n\n", "\n", " ", ""]
        
    def chunk(self, text: str, pages: List[dict] = None) -> List[dict]:
        """
        Split text into chunks recursively
        
        Args:
            text: Input text
            pages: Optional list of page objects for metadata mapping
            
        Returns:
            List of dicts with text and metadata
        """
        if not text:
            return []
            
        # Perform the split
        final_chunks = self._split_text(text, self.separators)
        
        # Map metadata (pages) to chunks
        # This is a bit complex for recursive splitting because we lose exact offsets easily.
        # We'll try to map back by finding the chunk in the original text.
        # Note: This simple finding might be ambiguous if text repeats, but it's a reasonable approximation.
        
        results = []
        current_search_start = 0
        
        # Build page offset map if pages provided (same as Character strategy)
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

        for chunk_text in final_chunks:
            # Find start index of this chunk in original text
            # We search from current_search_start to avoid matching earlier occurrences
            start_index = text.find(chunk_text, current_search_start)
            
            if start_index == -1:
                # Fallback: search from beginning if something went wrong with tracking
                start_index = text.find(chunk_text)
                
            if start_index != -1:
                # Update search start for next chunk (account for overlap)
                # We can't just jump to end because of overlap, but we can jump to start + 1
                # A better heuristic for overlap is: next chunk starts roughly at end - overlap
                current_search_start = max(current_search_start, start_index + 1)
                
                # Find pages
                chunk_pages = []
                if page_map:
                    chunk_end = start_index + len(chunk_text)
                    for p in page_map:
                        if start_index < p["end"] and chunk_end > p["start"]:
                            chunk_pages.append(p["page_number"])
                            
                results.append({
                    "text": chunk_text,
                    "metadata": {
                        "page_numbers": chunk_pages
                    }
                })
            else:
                # Should not happen if logic is correct
                results.append({
                    "text": chunk_text,
                    "metadata": {}
                })
                
        return results

    def _split_text(self, text: str, separators: List[str]) -> List[str]:
        """
        Recursively split text using the provided separators.
        """
        final_chunks = []
        
        # Get appropriate separator
        separator = separators[-1]
        new_separators = []
        
        for i, sep in enumerate(separators):
            if sep == "":
                separator = ""
                break
            if self._regex_escape(sep) in text or sep in text:
                separator = sep
                new_separators = separators[i + 1:]
                break
                
        # Split
        if separator:
            splits = text.split(separator)
        else:
            splits = list(text) # Split by character if empty separator
            
        # Now merge splits to form chunks
        good_splits = []
        current_chunk = []
        current_length = 0
        
        for split in splits:
            split_len = len(split)
            if current_length + split_len + (len(separator) if current_chunk else 0) > self.chunk_size:
                # Current chunk is full
                if current_chunk:
                    # Join and add to good splits
                    doc = separator.join(current_chunk)
                    if doc.strip():
                        good_splits.append(doc)
                    
                    # Handle overlap logic for next chunk
                    # For simplicity in this custom implementation, we reset.
                    # A full implementation with overlap is complex here. 
                    # Let's try to keep some overlap if possible.
                    
                    # Simple overlap: keep last few items that fit within overlap size
                    overlap_chunk = []
                    overlap_len = 0
                    for item in reversed(current_chunk):
                        if overlap_len + len(item) < self.chunk_overlap:
                            overlap_chunk.insert(0, item)
                            overlap_len += len(item) + len(separator)
                        else:
                            break
                    
                    current_chunk = overlap_chunk
                    current_length = overlap_len
                
                # If the single split is too big, we need to recurse on it
                if split_len > self.chunk_size and new_separators:
                    sub_chunks = self._split_text(split, new_separators)
                    good_splits.extend(sub_chunks)
                    # No current chunk after a big split recursion (simplified)
                    current_chunk = []
                    current_length = 0
                else:
                    # Add to new chunk
                    current_chunk.append(split)
                    current_length += split_len
            else:
                # Add to current chunk
                if current_chunk:
                    current_length += len(separator)
                current_chunk.append(split)
                current_length += split_len
                
        # Add remaining
        if current_chunk:
            doc = separator.join(current_chunk)
            if doc.strip():
                good_splits.append(doc)
                
        return good_splits

    def _regex_escape(self, s: str) -> str:
        return re.escape(s)

    def get_strategy_name(self) -> str:
        return "recursive"

    def get_default_config(self) -> dict:
        return {
            "chunk_size": 1000,
            "chunk_overlap": 200,
            "separators": ["\n\n", "\n", " ", ""]
        }
