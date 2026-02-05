"""
Ask API Endpoint

Implements RAG (Retrieval-Augmented Generation) pipeline:
1. Search Qdrant for relevant chunks
2. Build context from retrieved chunks
3. Generate answer using Gemini
4. Return answer with citations
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import uuid

from app.schemas.ask_schemas import AskRequest, AskResponse, Citation
from app.services.embeddings import embedding_service
from app.core.qdrant_client import get_client, ensure_collection, COLLECTION
from app.services.rag_answerer import generate_answer

router = APIRouter(prefix='/ask', tags=['ask'])


async def retrieve_chunks(
    question: str,
    top_k: int = 5,
    source_ids: List[str] = None
) -> List[Dict[str, Any]]:
    """
    Retrieve relevant chunks from Qdrant
    """
    try:
        client = get_client()
        ensure_collection(client)
        
        # Embed the question
        query_vector = embedding_service.embed_text(question)
        
        # Build filter
        qdrant_filter = None
        if source_ids:
            from qdrant_client.http import models as qm
            qdrant_filter = qm.Filter(
                must=[
                    qm.FieldCondition(
                        key="source_id",
                        match=qm.MatchAny(any=source_ids)
                    )
                ]
            )
        
        # Search Qdrant - using query_points for newer qdrant-client versions
        results = client.query_points(
            collection_name=COLLECTION,
            query=query_vector,
            query_filter=qdrant_filter,
            limit=top_k,
            with_payload=True
        ).points
        
        # Convert to chunk dictionaries
        chunks = []
        for result in results:
            payload = result.payload or {}
            chunks.append({
                "chunk_id": str(result.id),
                "file_id": payload.get("file_id", ""),
                "file_name": payload.get("file_name", "Unknown"),
                "file_path": payload.get("file_path", ""),
                "file_type": payload.get("type", "doc"),
                "source_id": payload.get("source_id", ""),
                "text": payload.get("text", payload.get("snippet", "")),
                "snippet": payload.get("snippet", ""),
                "score": float(result.score)
            })
        
        return chunks
        
    except Exception as e:
        print(f"Error retrieving chunks: {e}")
        import traceback
        traceback.print_exc()
        return []


@router.post('/', response_model=AskResponse)
async def ask(req: AskRequest):
    """
    Answer a question using RAG pipeline
    """
    try:
        print(f"[Ask API] Received question: {req.question}, mode: {req.mode}")
        
        # 1. Parse context filters
        source_ids = None
        if req.context and req.context.source_ids:
            source_ids = req.context.source_ids
        elif req.context and req.context.sources and req.context.sources != "all":
            source_ids = [req.context.sources]
        
        # 2. Retrieve relevant chunks
        chunks = await retrieve_chunks(
            question=req.question,
            top_k=req.top_k,
            source_ids=source_ids
        )
        
        print(f"[Ask API] Retrieved {len(chunks)} chunks")
        
        # 3. Generate answer using RAG
        result = await generate_answer(
            question=req.question,
            chunks=chunks,
            mode=req.mode
        )
        
        # 4. Build response
        response = AskResponse(
            id=str(uuid.uuid4()),
            answer=result["answer"],
            citations=[
                Citation(
                    id=c["id"],
                    name=c["name"],
                    path=c["path"],
                    type=c["type"],
                    snippet=c["snippet"],
                    score=c["score"]
                ) for c in result["citations"]
            ],
            followUps=result["follow_ups"],
            confidence=result["confidence"],
            usedTokens=result["used_tokens"]
        )
        
        print(f"[Ask API] Generated answer with {len(response.citations)} citations")
        return response
        
    except Exception as e:
        print(f"[Ask API] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
