from qdrant_client.http import models as qm
from app.schemas.search_schemas import SearchFilters

def build_filter(f: SearchFilters | None) -> qm.Filter | None:
    if not f:
        return None

    must = []

    if f.source_ids:
        must.append(qm.FieldCondition(
            key="source_id",
            match=qm.MatchAny(any=f.source_ids)
        ))

    if f.types:
        must.append(qm.FieldCondition(
            key="type",
            match=qm.MatchAny(any=f.types)
        ))

    if f.tags:
        must.append(qm.FieldCondition(
            key="tags",
            match=qm.MatchAny(any=f.tags)
        ))

    if f.from_mtime_ms is not None or f.to_mtime_ms is not None:
        must.append(qm.FieldCondition(
            key="mtime_ms",
            range=qm.Range(
                gte=f.from_mtime_ms,
                lte=f.to_mtime_ms
            )
        ))

    return qm.Filter(must=must) if must else None
