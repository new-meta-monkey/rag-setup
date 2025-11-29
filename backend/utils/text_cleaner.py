"""
Text Cleaning and Preprocessing Utilities

Uses unstructured and ftfy packages to clean and normalize extracted text.
"""
import re
from typing import List, Optional
import ftfy
from io import BytesIO
import tempfile
import os


class TextCleaner:
    """Utility class for cleaning and preprocessing text"""
    
    @staticmethod
    def clean_text(text: str, fix_unicode: bool = True, normalize_whitespace: bool = True) -> str:
        """
        Clean and normalize text using ftfy and custom rules
        
        Args:
            text: Raw text to clean
            fix_unicode: Whether to fix Unicode/encoding issues
            normalize_whitespace: Whether to normalize whitespace
            
        Returns:
            Cleaned text
        """
        if not text:
            return ""
        
        # Step 1: Fix Unicode and encoding issues
        if fix_unicode:
            text = ftfy.fix_text(text)
        
        # Step 2: Normalize whitespace
        if normalize_whitespace:
            # Replace multiple spaces with single space
            text = re.sub(r' +', ' ', text)
            # Replace multiple newlines with double newline (paragraph breaks)
            text = re.sub(r'\n\n+', '\n\n', text)
            # Replace tabs with spaces
            text = text.replace('\t', ' ')
            # Remove trailing/leading whitespace from each line
            text = '\n'.join(line.strip() for line in text.split('\n'))
        
        # Step 3: Remove common artifacts
        text = TextCleaner._remove_artifacts(text)
        
        return text.strip()
    
    @staticmethod
    def _remove_artifacts(text: str) -> str:
        """Remove common text artifacts from extraction"""
        # Remove excessive dots (often from table of contents)
        text = re.sub(r'\.{4,}', ' ', text)
        
        # Remove common page number patterns (e.g., "Page 1", "- 1 -", "[1]")
        text = re.sub(r'\n\s*[-–—]?\s*\d+\s*[-–—]?\s*\n', '\n', text)
        text = re.sub(r'\n\s*Page\s+\d+\s*\n', '\n', text, flags=re.IGNORECASE)
        
        # Remove form feed and other control characters
        text = re.sub(r'[\f\r\v]', '', text)
        
        return text
    
    @staticmethod
    def partition_and_clean(file_content: bytes, filename: str, file_type: Optional[str] = None) -> str:
        """
        Use unstructured library to partition document and extract clean text
        
        Args:
            file_content: Raw file bytes
            filename: Original filename
            file_type: Optional file type hint (pdf, docx, etc.)
            
        Returns:
            Cleaned, structured text
        """
        try:
            from unstructured.partition.auto import partition
            
            # Create temporary file (unstructured works with file paths)
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as tmp_file:
                tmp_file.write(file_content)
                tmp_path = tmp_file.name
            
            try:
                # Partition the document into structured elements
                elements = partition(filename=tmp_path)
                
                # Convert elements to clean text
                text_parts = []
                for element in elements:
                    element_text = str(element).strip()
                    if element_text:
                        # Add element type as context (optional, can be disabled)
                        # element_type = element.category if hasattr(element, 'category') else 'Text'
                        text_parts.append(element_text)
                
                # Join with double newlines to preserve paragraph structure
                raw_text = '\n\n'.join(text_parts)
                
                # Apply additional cleaning
                clean_text = TextCleaner.clean_text(raw_text)
                
                return clean_text
                
            finally:
                # Cleanup temp file
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
                    
        except ImportError:
            # Re-raise to allow fallback
            raise
        except Exception as e:
            # If partitioning fails, re-raise to allow fallback
            print(f"Warning: Document partitioning failed: {e}. Using fallback.")
            raise
    
    @staticmethod
    def partition_and_clean_with_pages(file_content: bytes, filename: str) -> dict:
        """
        Partition document and return text grouped by pages
        
        Returns:
            dict: {
                "text": "full cleaned text",
                "pages": [
                    {"page_number": 1, "text": "page text..."}
                ]
            }
        """
        try:
            from unstructured.partition.auto import partition
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as tmp_file:
                tmp_file.write(file_content)
                tmp_path = tmp_file.name
            
            try:
                elements = partition(filename=tmp_path)
                
                # Group by page
                pages = {}
                all_text_parts = []
                
                for element in elements:
                    text = str(element).strip()
                    if not text:
                        continue
                        
                    page_num = element.metadata.page_number if hasattr(element, 'metadata') and hasattr(element.metadata, 'page_number') else 1
                    
                    if page_num not in pages:
                        pages[page_num] = []
                    
                    pages[page_num].append(text)
                    all_text_parts.append(text)
                
                # Construct result
                sorted_page_nums = sorted(pages.keys())
                result_pages = []
                
                for num in sorted_page_nums:
                    page_text = "\n\n".join(pages[num])
                    result_pages.append({
                        "page_number": num,
                        "text": TextCleaner.clean_text(page_text)
                    })
                
                full_text = "\n\n".join(all_text_parts)
                
                return {
                    "text": TextCleaner.clean_text(full_text),
                    "pages": result_pages
                }
                
            finally:
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
                    
        except ImportError:
            # Re-raise to allow fallback to legacy extraction in FileProcessor
            raise
        except Exception as e:
            print(f"Partition with pages failed: {e}")
            # Re-raise to allow fallback to legacy extraction in FileProcessor
            raise

    @staticmethod
    def remove_html_tags(text: str) -> str:
        """
        Remove HTML tags from text
        Note: unstructured handles this automatically, but this is a manual fallback
        """
        # Remove script and style elements
        text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)
        
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        
        # Decode HTML entities
        import html
        text = html.unescape(text)
        
        return text
