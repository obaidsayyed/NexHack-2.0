import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import API_TITLE, API_DESCRIPTION, API_VERSION, settings
from app.core.logging_config import setup_logging

setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(title=API_TITLE, description=API_DESCRIPTION, version=API_VERSION)

cors_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": API_TITLE, "status": "running", "version": API_VERSION}
