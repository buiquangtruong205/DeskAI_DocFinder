from fastapi import FastAPI
from .api import health, index, search
# shjhdks
app = FastAPI()
app.include_router(health.router)
app.include_router(index.router)
app.include_router(search.router)
