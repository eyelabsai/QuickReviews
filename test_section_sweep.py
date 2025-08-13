#!/usr/bin/env python3
"""
Test script to verify the section sweep functionality works correctly.
"""

import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.rag_pipeline import MedicalRAGPipeline

async def test_section_sweep():
    """Test the dominant section sweep functionality"""
    
    print("🧪 Testing Section Sweep Functionality")
    print("=" * 50)
    
    # Initialize the RAG pipeline
    print("Initializing RAG pipeline...")
    rag = MedicalRAGPipeline()
    
    try:
        await rag.initialize()
        print("✅ RAG pipeline initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize RAG pipeline: {e}")
        return
    
    # Test the dominant sections detection
    print("\n🔍 Testing dominant sections detection...")
    
    # Mock metadata for testing
    mock_metas = [
        {"section_title": "9.4 Acute Angle Closure Glaucoma", "page_number": 234},
        {"section_title": "9.4 Acute Angle Closure Glaucoma", "page_number": 235},
        {"section_title": "9.4 Acute Angle Closure Glaucoma", "page_number": 236},
        {"section_title": "9.4 Acute Angle Closure Glaucoma", "page_number": 237},
        {"section_title": "9.4 Acute Angle Closure Glaucoma", "page_number": 238},
        {"section_title": "9.4 Acute Angle Closure Glaucoma", "page_number": 239},
        {"section_title": "9.4 Acute Angle Closure Glaucoma", "page_number": 240},
        {"section_title": "9.4 Acute Angle Closure Glaucoma", "page_number": 241},
        {"section_title": "9.4 Acute Angle Closure Glaucoma", "page_number": 238},
        {"section_title": "9.4 Acute Angle Closure Glaucoma", "page_number": 239},
        {"section_title": "9.4 Acute Angle Closure Glaucoma", "page_number": 240},
        {"section_title": "9.4 Acute Angle Closure Glaucoma", "page_number": 241},
    ]
    
    try:
        dom_secs = rag._dominant_sections(mock_metas)
        print(f"✅ Dominant sections detected: {dom_secs}")
        
        if "9.4 Acute Angle Closure Glaucoma" in dom_secs:
            print("✅ Correctly identified AACG as dominant section")
        else:
            print("❌ Failed to identify AACG as dominant section")
            
    except Exception as e:
        print(f"❌ Dominant sections detection failed: {e}")
    
    # Test a comprehensive query
    print("\n🌟 Testing comprehensive mode with section sweep...")
    
    test_query = "IOP 42, fixed mid-dilated pupil, pain"
    
    try:
        response = await rag.query(
            query=test_query,
            mode="comprehensive",
            n_results=5
        )
        
        print(f"✅ Comprehensive query successful")
        print(f"Response length: {len(response.response)} characters")
        print(f"Sources: {len(response.sources)}")
        print(f"Mode: {response.mode}")
        
        if response.assembled_sections:
            print(f"Assembled sections: {len(response.assembled_sections)}")
            
            # Show section breakdown
            for i, section in enumerate(response.assembled_sections[:3]):
                print(f"\n{i+1}. {section.section_title}")
                print(f"   Subhead: {section.subhead}")
                print(f"   Page: {section.page}")
                print(f"   Chunks: {section.chunk_count}")
                print(f"   Content preview: {section.text[:100]}...")
        else:
            print("❌ No assembled sections returned")
            
        # Check if the response contains the verbatim block
        if "All Retrieved Excerpts (Verbatim)" in response.response:
            print("✅ Verbatim block found in response")
        else:
            print("❌ Verbatim block missing from response")
            
    except Exception as e:
        print(f"❌ Comprehensive query failed: {e}")
    
    print("\n" + "=" * 50)
    print("✅ Section sweep testing completed!")

if __name__ == "__main__":
    asyncio.run(test_section_sweep())