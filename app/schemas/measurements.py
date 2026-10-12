"""Pydantic schemas for measurement-related API responses."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.schemas.files import MeasurementStatus


class FeatureMeasurement(BaseModel):
    feature_id: int
    geometry_type: str
    measurement_status: MeasurementStatus
    area_sq_m: Optional[float] = None
    length_m: Optional[float] = None
    perimeter_m: Optional[float] = None
    source_crs: Optional[str] = None
    measurement_crs: Optional[str] = None
    properties: Dict[str, Any] = Field(default_factory=dict)
    geometry: Optional[Dict[str, Any]] = None


class MeasurementSummary(BaseModel):
    total_features: int = 0
    polygon_count: int = 0
    line_count: int = 0
    point_count: int = 0
    other_count: int = 0
    total_area_sq_m: float = 0.0
    total_length_m: float = 0.0
    completed_count: int = 0
    failed_count: int = 0


class MeasurementsResponse(BaseModel):
    file_id: str
    filename: str
    source_crs: Optional[str] = None
    total_features: int
    measurements: List[FeatureMeasurement]
    summary: MeasurementSummary
