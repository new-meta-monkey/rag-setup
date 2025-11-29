"""
Test script for text cleaning functionality
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.utils.text_cleaner import TextCleaner

def test_unicode_fixing():
    """Test ftfy Unicode fixing"""
    print("=" * 60)
    print("TEST 1: Unicode Fixing")
    print("=" * 60)
    
    # Test mojibake (common encoding issue)
    garbled = "Itâ€™s a test with â€œquotesâ€"
    fixed = TextCleaner.clean_text(garbled)
    print(f"Input:  {repr(garbled)}")
    print(f"Output: {repr(fixed)}")
    print()

def test_whitespace_normalization():
    """Test whitespace normalization"""
    print("=" * 60)
    print("TEST 2: Whitespace Normalization")
    print("=" * 60)
    
    messy = """This   has    multiple     spaces


And multiple newlines

And\ttabs\there"""
    
    cleaned = TextCleaner.clean_text(messy)
    print(f"Input:\n{repr(messy)}")
    print(f"\nOutput:\n{repr(cleaned)}")
    print()

def test_html_removal():
    """Test HTML tag removal"""
    print("=" * 60)
    print("TEST 3: HTML Tag Removal")
    print("=" * 60)
    
    html = """
    <html>
        <body>
            <h1>Title</h1>
            <p>This is a <b>bold</b> paragraph with <a href="#">links</a>.</p>
            <ul>
                <li>Item 1</li>
                <li>Item 2</li>
            </ul>
        </body>
    </html>
    """
    
    cleaned = TextCleaner.remove_html_tags(html)
    print(f"Input:\n{html}")
    print(f"\nOutput:\n{cleaned}")
    print()

def test_artifact_removal():
    """Test artifact removal (page numbers, etc.)"""
    print("=" * 60)
    print("TEST 4: Artifact Removal")
    print("=" * 60)
    
    text_with_artifacts = """
This is page content.

Page 1

More content here.
Some dots.......from table of contents.

- 2 -

Final content.
"""
    
    cleaned = TextCleaner.clean_text(text_with_artifacts)
    print(f"Input:\n{text_with_artifacts}")
    print(f"\nOutput:\n{cleaned}")
    print()

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("TEXT CLEANING TESTS")
    print("=" * 60 + "\n")
    
    try:
        test_unicode_fixing()
        test_whitespace_normalization()
        test_html_removal()
        test_artifact_removal()
        
        print("=" * 60)
        print("✅ ALL TESTS COMPLETED")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
