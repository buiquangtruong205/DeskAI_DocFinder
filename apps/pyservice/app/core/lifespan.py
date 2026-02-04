from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app):
    # startup tasks
    yield
    # shutdown tasks
