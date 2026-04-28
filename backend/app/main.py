"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from .auth.router import router as auth_router
from .chat.router import router as chat_router
from .config import settings
from .db import init_db
from .health import router as health_router
from .static import mount_spa


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="Prelegal API", lifespan=lifespan)
app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(chat_router, prefix="/api")

if settings.static_dir is not None:
    mount_spa(app, settings.static_dir)


__all__ = ["app", "settings"]
