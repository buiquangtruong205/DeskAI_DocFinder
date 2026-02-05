import os
import sys
from dotenv import load_dotenv
from qdrant_client import QdrantClient

# Load env
load_dotenv()

# Check local storage matching qdrant_client.py logic
QDRANT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "qdrant_data")
QDRANT_URL = None # Don't use URL
COLLECTION = "chunks_v1"

print(f"Checking Local Qdrant at: {QDRANT_PATH}")

try:
    if os.path.exists(QDRANT_PATH):
        print("✅ Storage directory exists.")
        client = QdrantClient(path=QDRANT_PATH)
    else:
        print("❌ Storage directory NOT found. Indexing has not created it yet.")
        sys.exit(0)
    
    # Check collections
    collections = client.get_collections()
    found = False
    for c in collections.collections:
        print(f"- Found collection: {c.name}")
        if c.name == COLLECTION:
            found = True
            
    if not found:
        print(f"❌ Collection '{COLLECTION}' NOT found!")
        print("Did you index any documents yet? Or is the collection name wrong?")
        sys.exit(0)
        
    # Get collection info
    info = client.get_collection(COLLECTION)
    print(f"\nCollection '{COLLECTION}' Info:")
    print(f"- Status: {info.status}")
    
    # Safely get counts
    points_count = getattr(info, 'points_count', 0)
    vectors_count = getattr(info, 'vectors_count', 'N/A')
    
    print(f"- Vectors Count: {vectors_count}")
    print(f"- Points Count: {points_count}")
    
    if points_count == 0:
        print("\n⚠️ Collection exists but is EMPTY. You need to index some documents first.")
    else:
        print("\n✅ Data found in Qdrant!")
        
        # Try a dummy search
        print("\nTesting retrieval with dummy vector...")
        dummy_vector = [0.1] * 384  # Assuming 384 dim
        results = client.search(
            collection_name=COLLECTION,
            query_vector=dummy_vector,
            limit=3
        )
        print(f"Found {len(results)} chunks for dummy query.")
        for r in results:
             print(f" - Score: {r.score}, Payload: {r.payload.get('file_name', 'Unknown')}")

except Exception as e:
    print(f"❌ Error connecting to Qdrant: {e}")
