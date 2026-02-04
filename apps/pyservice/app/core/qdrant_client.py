from qdrant_client import QdrantClient
from qdrant_client.http import models as qm

QDRANT_URL = "http://127.0.0.1:6333"
# Collection specifically for text chunks
COLLECTION = "chunks_v1"
# Dimension of sentence-transformers/all-MiniLM-L6-v2
VECTOR_SIZE = 384 

def get_client() -> QdrantClient:
    return QdrantClient(url=QDRANT_URL)

def ensure_collection(client: QdrantClient):
    # Check if collection exists
    try:
        existing = [c.name for c in client.get_collections().collections]
        if COLLECTION in existing:
            return
    except Exception as e:
        print(f"Warning: Could not check collections (Qdrant might be starting): {e}")
        return

    # Create collection
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
