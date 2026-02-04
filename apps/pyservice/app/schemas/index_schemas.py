from pydantic import BaseModel

class IndexRequest(BaseModel):
    path: str
