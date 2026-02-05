from fastapi import APIRouter, HTTPException
from qdrant_client.http import models as qm

from app.core.qdrant_client import get_client, ensure_collection, COLLECTION
from app.services.embeddings import embedding_service
from app.schemas.search_schemas import SearchRequest, SearchResponse, SearchHit
from app.services.qdrant_search import build_filter

router = APIRouter(prefix='/search', tags=['search'])

@router.post('/', response_model=SearchResponse)
async def search(req: SearchRequest):
    try:
        client = get_client()
        ensure_collection(client)

        qvec = embedding_service.embed_text(req.query)
        qfilter = build_filter(req.filters)

        res = client.query_points(
            collection_name=COLLECTION,
            query=qvec,
            query_filter=qfilter,
            limit=req.top_k,
            with_payload=True
        ).points

        hits = []
        for p in res:
            payload = p.payload or {}
            hits.append(SearchHit(
                chunk_id=str(p.id),
                file_id=str(payload.get("file_id", "")),
                score=float(p.score),
                snippet=payload.get("snippet"),
                payload=payload
            ))

        return SearchResponse(hits=hits)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
