"""
Hierarchical Chunking Strategy
"""
from typing import List, Dict, Any, Optional
import re
from backend.services.chunking.base.chunking_strategy import ChunkingStrategy

class HierarchicalChunkingStrategy(ChunkingStrategy):
    """
    Splits text based on document hierarchy (headers).
    Currently supports Markdown-style headers (#, ##, ###).
    """
    
    def __init__(self, split_level: int = 2):
        """
        Args:
            split_level: The header level to split on (1 for #, 2 for ##, etc.)
        """
        self.split_level = split_level
        
    def chunk(self, text: str, pages: List[dict] = None) -> List[dict]:
        """
        Split text based on headers
        
        Args:
            text: Input text
            pages: Optional list of page objects
            
        Returns:
            List of chunk objects
        """
        if not text:
            return []
            
        # Regex to find headers up to the specified level
        # e.g., if split_level is 2, matches # and ##
        header_pattern = r'(^#{1,' + str(self.split_level) + r'}\s+.+$)'
        
        # Split by headers, keeping the headers
        splits = re.split(header_pattern, text, flags=re.MULTILINE)
        
        chunks = []
        current_section = "Introduction" # Default section
        
        # The first element is usually text before the first header
        if splits[0].strip():
            chunks.append({
                "text": splits[0].strip(),
                "metadata": {
                    "section": current_section,
                    **self._get_page_metadata(splits[0], text, pages)
                }
            })
            
        # Iterate through the rest (header, content pairs)
        for i in range(1, len(splits), 2):
            header = splits[i].strip()
            content = splits[i+1].strip() if i+1 < len(splits) else ""
            
            # Update current section
            current_section = header.lstrip('#').strip()
            
            full_chunk_text = f"{header}\n{content}"
            
            chunks.append({
                "text": full_chunk_text,
                "metadata": {
                    "section": current_section,
                    **self._get_page_metadata(full_chunk_text, text, pages)
                }
            })
            
        return chunks

    def _get_page_metadata(self, chunk_text: str, full_text: str, pages: List[dict] = None) -> dict:
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
        start_index = full_text.find(chunk_text)
        if start_index == -1:
            # Try finding just the content if full chunk not found (e.g. whitespace diffs)
            start_index = full_text.find(chunk_text[:50])
            
        if start_index == -1:
            return {}
            
        end_index = start_index + len(chunk_text)
        
        chunk_pages = []
        for pm in page_map:
            if (start_index < pm["end"] and end_index > pm["start"]):
                if pm["page_number"] not in chunk_pages:
                    chunk_pages.append(pm["page_number"])
                    
        return {"page_numbers": chunk_pages}

    def get_strategy_name(self) -> str:
        return "hierarchical"

    def get_default_config(self) -> dict:
        return {
            "split_level": 2
        }
