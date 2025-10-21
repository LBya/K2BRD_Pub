import re
from typing import List
import unicodedata

def deduplicate_urls(text: str) -> str:
    """Remove duplicate URLs from text while preserving the first occurrence"""
    url_pattern = r'https?://[^\s<>"]+|www\.[^\s<>"]+' 
    urls = re.findall(url_pattern, text)
    unique_urls = []
    
    for url in urls:
        if url not in unique_urls:
            unique_urls.append(url)
        else:
            text = text.replace(url, '')
    
    return text.strip() 

def clean_text(text: str) -> str:
    """
    Cleans a string by removing non-printable characters, weird whitespace,
    and other problematic artifacts.
    """
    if not isinstance(text, str):
        return text

    # Normalize unicode characters to a standard form
    text = unicodedata.normalize('NFKC', text)

    # Remove non-printable characters except for standard whitespace
    # This regex keeps letters, numbers, punctuation, and basic whitespace
    # It removes control characters, zero-width characters, etc.
    text = re.sub(r'[^\x20-\x7E\n\r\t]', '', text)

    # Replace multiple spaces/newlines with a single one
    text = re.sub(r'\s{2,}', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)

    return text.strip() 