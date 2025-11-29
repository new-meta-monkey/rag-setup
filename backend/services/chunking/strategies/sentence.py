"""
Sentence Chunking Strategy
"""
from typing import List
import re
from backend.services.chunking.base.chunking_strategy import ChunkingStrategy

class SentenceChunkingStrategy(ChunkingStrategy):
    """Splits text by sentences and groups them"""
    
    def __init__(self, sentences_per_chunk: int = 5, overlap: int = 1):
        self.sentences_per_chunk = sentences_per_chunk
        self.overlap = overlap
        
    def _split_sentences(self, text: str) -> List[str]:
        """Simple regex-based sentence splitter (fallback if NLTK/Spacy not available)"""
        # Split by . ! ? followed by space or end of string
        # This is a simple approximation
        sentences = re.split(r'(?<=[.!?])\s+', text)
        return [s.strip() for s in sentences if s.strip()]
        
    def chunk(self, text: str, pages: List[dict] = None) -> List[dict]:
        """
        Split text into sentence-based chunks
        
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

        # Split sentences while keeping track of offsets
        # We use re.split with capturing group to keep separators
        parts = re.split(r'((?<=[.!?])\s+)', text)
        
        sentences = []
        current_pos = 0
        for part in parts:
            if not part:
                continue
            # Check if it's a separator (whitespace) or content
            # Actually, we just need to accumulate them into sentences
            # But the logic was: split by separator, then group sentences.
            # If we split by separator, we get [s1, sep1, s2, sep2...]
            # We want to group s1, s2...
            # But we need the separator length for offset tracking.
            
            # Wait, the original logic was:
            # sentences = re.split(r'(?<=[.!?])\s+', text)
            # return [s.strip() for s in sentences if s.strip()]
            
            # If we use capturing group, we get separators too.
            # We can treat separators as just advancing current_pos, 
            # and sentences as the content we care about.
            
            if not part.strip() and re.match(r'\s+', part):
                # It's a separator
                current_pos += len(part)
            else:
                # It's a sentence (or part of it)
                if part.strip():
                    sentences.append({
                        "text": part.strip(),
                        "start": current_pos,
                        "end": current_pos + len(part) # Note: strip() might remove leading/trailing spaces, but current_pos tracks raw text. 
                        # Actually, if we strip, we lose offset accuracy if there are leading spaces.
                        # But split logic splits on whitespace.
                        # Let's assume stripped sentence starts at current_pos + leading_spaces.
                    })
                current_pos += len(part)
        
        if not sentences:
            return []

        if len(sentences) <= self.sentences_per_chunk:
            # Return as one chunk
            chunk_pages = []
            if page_map:
                chunk_start = sentences[0]["start"]
                chunk_end = sentences[-1]["end"]
                for pm in page_map:
                    if chunk_start < pm["end"] and chunk_end > pm["start"]:
                        chunk_pages.append(pm["page_number"])
            return [{
                "text": text,
                "metadata": {"page_numbers": chunk_pages}
            }]
            
        chunks = []
        stride = self.sentences_per_chunk - self.overlap
        if stride < 1:
            stride = 1
            
        for i in range(0, len(sentences), stride):
            group = sentences[i : i + self.sentences_per_chunk]
            if not group:
                break
                
            # Join sentences with space
            chunk_text = " ".join([s["text"] for s in group])
            
            # Calculate start/end from the group
            # Note: The joined text length might differ from original span if separators were different than " "
            # But for page mapping, we use the start of first sentence and end of last sentence
            group_start = group[0]["start"]
            group_end = group[-1]["end"]
            
            chunk_pages = []
            if page_map:
                for pm in page_map:
                    if group_start < pm["end"] and group_end > pm["start"]:
                        chunk_pages.append(pm["page_number"])
            
            chunks.append({
                "text": chunk_text,
                "metadata": {
                    "page_numbers": chunk_pages
                }
            })
            
        return chunks

    def get_strategy_name(self) -> str:
        return "sentence"

    def get_default_config(self) -> dict:
        return {
            "sentences_per_chunk": 5,
            "overlap": 1
        }
