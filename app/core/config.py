"""Application configuration."""

from __future__ import annotations

import os
from pathlib import Path


# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent
STORAGE_DIR = BASE_DIR / "storage"
UPLOAD_DIR = STORAGE_DIR / "uploads"
METADATA_DIR = STORAGE_DIR / "metadata"

# Ensure directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
METADATA_DIR.mkdir(parents=True, exist_ok=True)

# Upload limits
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024

# Allowed extensions
ALLOWED_EXTENSIONS = {".kml", ".zip"}

# Required shapefile components
REQUIRED_SHP_EXTENSIONS = {".shp", ".shx", ".dbf"}

# CORS
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
).split(",")

# API
API_PREFIX = "/api"
