from pydantic import BaseModel
from typing import Optional, List, Literal, Dict, Any

class SearchFilters(BaseModel):
    source_ids: Optional[List[str]] = None
    types: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    from_mtime_ms: Optional[int] = None
    to_mtime_ms: Optional[int] = None

class SearchRequest(BaseModel):
    query: str
    top_k: int = 10
    filters: Optional[SearchFilters] = None

class SearchHit(BaseModel):
    chunk_id: str
    file_id: str
    score: float
    snippet: str | None = None
    payload: dict

class SearchResponse(BaseModel):
    hits: List[SearchHit]

class ChunkInput(BaseModel):
    chunkId: str
    text: str # For embedding
    fileId: str
    metadata: Dict[str, Any] # full payload for qdrant

class IndexRequest(BaseModel):
    chunks: List[ChunkInput]

class IndexResponse(BaseModel):
    indexed_count: int
