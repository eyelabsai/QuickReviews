#!/usr/bin/env python3
"""
Google Reviews Link Generator with Auto-5-Star Selection

This script helps generate proper Google Reviews links that can pre-select 5 stars.
"""

import re
import urllib.parse

def generate_google_reviews_link(place_id=None, business_name=None, address=None):
    """
    Generate a Google Reviews link that can auto-select 5 stars.
    
    Args:
        place_id: Google Place ID (preferred method)
        business_name: Business name for search
        address: Business address for search
    
    Returns:
        str: Google Reviews URL with 5-star pre-selection
    """
    
    if place_id:
        # Method 1: Using Place ID (most reliable)
        base_url = "https://search.google.com/local/writereview"
        params = {
            'placeid': place_id,
            'rating': '5'  # Pre-select 5 stars
        }
        return f"{base_url}?{urllib.parse.urlencode(params)}"
    
    elif business_name and address:
        # Method 2: Using business name and address
        search_query = f"{business_name} {address}"
        encoded_query = urllib.parse.quote(search_query)
        base_url = "https://search.google.com/local/writereview"
        params = {
            'q': search_query,
            'rating': '5'  # Pre-select 5 stars
        }
        return f"{base_url}?{urllib.parse.urlencode(params)}"
    
    else:
        # Method 3: Generic search-based approach
        return "https://search.google.com/local/writereview?rating=5"

def extract_place_id_from_url(url):
    """
    Extract Place ID from existing Google URL if possible.
    """
    # Common patterns for Google Place IDs
    patterns = [
        r'place_id=([^&]+)',
        r'0x[0-9a-f]+:0x[0-9a-f]+',
        r'ChI[^/]+'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    return None

def create_review_link_with_5_stars(existing_url=None, business_name=None, address=None):
    """
    Create a new Google Reviews link with 5-star pre-selection.
    """
    if existing_url:
        place_id = extract_place_id_from_url(existing_url)
        if place_id:
            return generate_google_reviews_link(place_id=place_id)
    
    if business_name and address:
        return generate_google_reviews_link(business_name=business_name, address=address)
    
    return generate_google_reviews_link()

# Example usage
if __name__ == "__main__":
    print("Google Reviews Link Generator with Auto-5-Star Selection")
    print("=" * 60)
    
    # Example 1: Using Place ID
    print("\n1. Using Place ID (most reliable):")
    place_id_example = "ChIJN1t_tDeuEmsRUsoyG83frY4"
    link1 = generate_google_reviews_link(place_id=place_id_example)
    print(f"   Place ID: {place_id_example}")
    print(f"   Link: {link1}")
    
    # Example 2: Using business name and address
    print("\n2. Using business name and address:")
    business_name = "Matthew Hirabayashi MD"
    address = "123 Medical Center Dr, City, State"
    link2 = generate_google_reviews_link(business_name=business_name, address=address)
    print(f"   Business: {business_name}")
    print(f"   Address: {address}")
    print(f"   Link: {link2}")
    
    # Example 3: Generic link
    print("\n3. Generic 5-star review link:")
    link3 = generate_google_reviews_link()
    print(f"   Link: {link3}")
    
    print("\n" + "=" * 60)
    print("Note: Google may not always respect the rating parameter.")
    print("The most reliable method is using a Place ID.")
