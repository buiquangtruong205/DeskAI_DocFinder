"""
Ask API Schemas
"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class AskContext(BaseModel):
    """Context for the ask request"""
    sources: Optional[str] = "all"  # 'all' or specific source ID
    source_ids: Optional[List[str]] = None


class AskRequest(BaseModel):
    """Request model for /ask endpoint"""
    question: str
    mode: str = "answer"  # answer, summarize, explain
    context: Optional[AskContext] = None
    top_k: int = 3  # Reduced for faster response


class Citation(BaseModel):
    """A citation/reference to a document chunk"""
    id: str
    name: str
    path: str
    type: str
    snippet: str
    score: float


class AskResponse(BaseModel):
    """Response model for /ask endpoint"""
    id: str
    answer: str
    citations: List[Citation]
    followUps: List[str]  # camelCase to match frontend
    confidence: float
    usedTokens: int  # camelCase to match frontend
