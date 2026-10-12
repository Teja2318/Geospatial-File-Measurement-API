"""Pydantic schemas for file-related API requests and responses."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class ProcessingStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class MeasurementStatus(str, Enum):
    COMPLETED = "COMPLETED"
    NOT_REQUIRED = "NOT_REQUIRED"
    UNSUPPORTED = "UNSUPPORTED"
    INVALID_GEOMETRY = "INVALID_GEOMETRY"
    FAILED = "FAILED"


class FileFormat(str, Enum):
    KML = "KML"
    SHAPEFILE = "Shapefile"
    UNKNOWN = "Unknown"


class FileUploadResponse(BaseModel):
    id: str
    filename: str
    format: FileFormat
    status: ProcessingStatus
    feature_count: Optional[int] = None
    source_crs: Optional[str] = None
    upload_timestamp: datetime
    message: str = "File uploaded and processed successfully"


class FileInfoResponse(BaseModel):
    id: str
    filename: str
    format: FileFormat
    file_size_bytes: int
    status: ProcessingStatus
    feature_count: Optional[int] = None
    source_crs: Optional[str] = None
    upload_timestamp: datetime
    error_message: Optional[str] = None
    geometry_types: List[str] = Field(default_factory=list)
    total_area_sq_m: Optional[float] = None
    total_length_m: Optional[float] = None


class FileListResponse(BaseModel):
    files: List[FileInfoResponse]
    total: int


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
