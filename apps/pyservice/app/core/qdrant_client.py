from qdrant_client import QdrantClient
from qdrant_client.http import models as qm
import os

QDRANT_URL = os.getenv("QDRANT_URL", "http://127.0.0.1:6333")
QDRANT_MODE = os.getenv("QDRANT_MODE", "server")  # "server" or "memory"

# Collection specifically for text chunks
COLLECTION = "chunks_v1"
# Dimension of sentence-transformers/all-MiniLM-L6-v2
VECTOR_SIZE = 384 

# Singleton client
_client = None

def get_client() -> QdrantClient:
    global _client
    if _client is not None:
        return _client
    
    # Check if we should use local mode (default if no URL provided)
    if not QDRANT_URL or "localhost" in QDRANT_URL or "127.0.0.1" in QDRANT_URL:
        # Use local file storage - no server needed!
        storage_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "qdrant_data")
        os.makedirs(storage_path, exist_ok=True)
        print(f"Using local Qdrant storage at: {storage_path}")
        _client = QdrantClient(path=storage_path)
    elif QDRANT_MODE == "memory":
        print("Using Qdrant in-memory mode")
        _client = QdrantClient(":memory:")
    else:
        try:
            _client = QdrantClient(url=QDRANT_URL)
            # Test connection
            _client.get_collections()
            print(f"Connected to Qdrant server at {QDRANT_URL}")
        except Exception as e:
            print(f"Failed to connect to Qdrant server: {e}")
            print("Falling back to local storage")
            storage_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "qdrant_data")
            os.makedirs(storage_path, exist_ok=True)
            _client = QdrantClient(path=storage_path)
    
    return _client

def ensure_collection(client: QdrantClient):
    # Check if collection exists
    try:
        existing = [c.name for c in client.get_collections().collections]
        if COLLECTION in existing:
            return
    except Exception as e:
        print(f"Warning: Could not check collections: {e}")
        return

    # Create collection
    try:
        client.create_collection(
            collection_name=COLLECTION,
            vectors_config=qm.VectorParams(
                size=VECTOR_SIZE,
                distance=qm.Distance.COSINE
            )
        )
        
        # Create Indexes for filtering performance
        client.create_payload_index(COLLECTION, "source_id", qm.PayloadSchemaType.KEYWORD)
        client.create_payload_index(COLLECTION, "type", qm.PayloadSchemaType.KEYWORD)
        client.create_payload_index(COLLECTION, "tags", qm.PayloadSchemaType.KEYWORD)
        client.create_payload_index(COLLECTION, "mtime_ms", qm.PayloadSchemaType.INTEGER)
        client.create_payload_index(COLLECTION, "file_id", qm.PayloadSchemaType.KEYWORD)

        print(f"Collection {COLLECTION} created with indexes.")
    except Exception as e:
        print(f"Error creating collection: {e}")
