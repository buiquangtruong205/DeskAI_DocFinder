from fastapi import APIRouter

router = APIRouter(prefix='/qa')

@router.post('/')
async def qa(payload: dict):
    return {"answer": ""}
