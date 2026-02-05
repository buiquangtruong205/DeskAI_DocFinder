from fastapi import APIRouter, HTTPException
from qdrant_client.http import models as qm
from typing import List
import uuid

from app.core.qdrant_client import get_client, ensure_collection, COLLECTION
from app.services.embeddings import embedding_service
from app.schemas.search_schemas import IndexRequest, IndexResponse

router = APIRouter(prefix='/index', tags=['index'])

@router.post('/', response_model=IndexResponse)
async def index_chunks(req: IndexRequest):
    try:
        if not req.chunks:
            return IndexResponse(indexed_count=0)

        client = get_client()
        ensure_collection(client)

        texts = [c.text for c in req.chunks]
        ids = []
        
        # Ensure all IDs are valid UUIDs
        for c in req.chunks:
            try:
                # Try to parse as UUID
                uuid_obj = uuid.UUID(c.chunkId)
                ids.append(str(uuid_obj))
            except ValueError:
                # If not valid UUID, generate a new one
                new_id = str(uuid.uuid4())
                ids.append(new_id)
                print(f"Generated new UUID {new_id} for invalid ID: {c.chunkId}")
        
        # Batch Embed
        embeddings = embedding_service.embed_batch(texts)
        
        points = []
        for i, chunk in enumerate(req.chunks):
            # Construct Payload
            # Keep snippet small if needed, but for now we store full metadata
            # text is used for embedding, do we store it in payload?
            # User requirement: store snippet.
            payload = chunk.metadata.copy()
            payload["file_id"] = chunk.fileId
            payload["snippet"] = chunk.text[:300] # store first 300 chars as partial snippet
            # payload["text"] = chunk.text # optional: store full text if needed

            points.append(qm.PointStruct(
                id=ids[i],
                vector=embeddings[i],
                payload=payload
            ))

        client.upsert(
            collection_name=COLLECTION,
            points=points
        )
        
        return IndexResponse(indexed_count=len(points))

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
