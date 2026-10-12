"""API routes for geospatial file operations."""

from __future__ import annotations

import json
import logging
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Tuple

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import Response

from app.core.config import (
    ALLOWED_EXTENSIONS,
    MAX_UPLOAD_SIZE_BYTES,
    MAX_UPLOAD_SIZE_MB,
    UPLOAD_DIR,
)
from app.core.exceptions import FileValidationError, GeoProcessingError
from app.repositories.file_repository import file_repository
from app.schemas.files import (
    ErrorResponse,
    FileFormat,
    FileInfoResponse,
    FileListResponse,
    FileUploadResponse,
    ProcessingStatus,
)
from app.schemas.measurements import (
    FeatureMeasurement,
    MeasurementSummary,
    MeasurementsResponse,
)
from app.services.export_service import (
    export_measurements_csv,
    export_measurements_geojson,
    export_measurements_json,
)
from app.services.geo_processor import (
    compute_summary,
    process_geometries,
    read_geospatial_file,
    validate_zip_contents,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/files", tags=["files"])


def _detect_format(filename: str) -> FileFormat:
    """Detect file format from extension."""
    ext = Path(filename).suffix.lower()
    if ext == ".kml":
        return FileFormat.KML
    elif ext == ".zip":
        return FileFormat.SHAPEFILE
    return FileFormat.UNKNOWN


def _validate_file(upload: UploadFile) -> Tuple[str, FileFormat]:
    """Validate uploaded file.

    Returns:
        Tuple of (safe_filename, file_format).
    """
    if not upload.filename:
        raise FileValidationError("No filename provided.")

    # Sanitize filename — take only the basename to prevent path traversal
    filename = Path(upload.filename).name
    if not filename:
        raise FileValidationError("Invalid filename.")

    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise FileValidationError(
            f"Unsupported file type '{ext}'. Allowed types: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    file_format = _detect_format(filename)
    return filename, file_format


@router.post(
    "/",
    response_model=FileUploadResponse,
    status_code=201,
    responses={400: {"model": ErrorResponse}, 413: {"model": ErrorResponse}},
)
async def upload_file(file: UploadFile = File(...)):
    """Upload a geospatial file (KML or Shapefile ZIP) for processing.

    The file is validated, parsed, and measurements are calculated
    synchronously. Results are persisted to disk.
    """
    # Validate file
    try:
        filename, file_format = _validate_file(file)
    except FileValidationError as e:
        raise HTTPException(status_code=400, detail=e.message)

    # Read file content and check size
    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="File too large ({:.1f} MB). Maximum allowed size is {} MB.".format(
                len(content) / 1024 / 1024, MAX_UPLOAD_SIZE_MB
            ),
        )

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Generate unique file ID and save
    file_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc)

    # Save uploaded file
    upload_path = UPLOAD_DIR / "{}{}".format(file_id, Path(filename).suffix)
    upload_path.write_bytes(content)

    # Initialize metadata
    metadata = {
        "id": file_id,
        "filename": filename,
        "format": file_format.value,
        "file_size_bytes": len(content),
        "status": ProcessingStatus.PROCESSING.value,
        "upload_timestamp": timestamp.isoformat(),
        "feature_count": None,
        "source_crs": None,
        "error_message": None,
        "geometry_types": [],
        "total_area_sq_m": None,
        "total_length_m": None,
        "measurements": [],
    }
    file_repository.save(file_id, metadata)

    # Process the file
    extract_dir = None
    try:
        if file_format == FileFormat.SHAPEFILE:
            extract_dir = validate_zip_contents(upload_path)
            gdf = read_geospatial_file(extract_dir, "Shapefile")
        else:
            gdf = read_geospatial_file(upload_path, "KML")

        # Detect CRS
        source_crs = str(gdf.crs) if gdf.crs else "Unknown"

        # Process geometries
        measurements = process_geometries(gdf)
        summary = compute_summary(measurements)

        # Get unique geometry types
        geometry_types = list(set(
            m["geometry_type"] for m in measurements if m["geometry_type"] != "Empty"
        ))

        # Update metadata
        metadata.update({
            "status": ProcessingStatus.COMPLETED.value,
            "feature_count": len(measurements),
            "source_crs": source_crs,
            "geometry_types": geometry_types,
            "total_area_sq_m": summary["total_area_sq_m"],
            "total_length_m": summary["total_length_m"],
            "measurements": measurements,
        })
        file_repository.save(file_id, metadata)

        return FileUploadResponse(
            id=file_id,
            filename=filename,
            format=file_format,
            status=ProcessingStatus.COMPLETED,
            feature_count=len(measurements),
            source_crs=source_crs,
            upload_timestamp=timestamp,
            message="File uploaded and processed successfully",
        )

    except FileValidationError as e:
        metadata["status"] = ProcessingStatus.FAILED.value
        metadata["error_message"] = e.message
        file_repository.save(file_id, metadata)
        raise HTTPException(status_code=400, detail=e.message)

    except GeoProcessingError as e:
        metadata["status"] = ProcessingStatus.FAILED.value
        metadata["error_message"] = e.message
        file_repository.save(file_id, metadata)
        raise HTTPException(status_code=422, detail=e.message)

    except Exception as e:
        logger.exception("Unexpected error processing file %s", file_id)
        metadata["status"] = ProcessingStatus.FAILED.value
        metadata["error_message"] = "An unexpected error occurred during processing."
        file_repository.save(file_id, metadata)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during file processing.",
        )

    finally:
        # Clean up temporary extraction directory
        if extract_dir and extract_dir.exists():
            try:
                shutil.rmtree(extract_dir)
            except OSError:
                logger.warning("Failed to clean up temp dir: %s", extract_dir)


@router.get("/", response_model=FileListResponse)
async def list_files():
    """List all uploaded files."""
    records = file_repository.get_all()
    files = []
    for r in records:
        files.append(FileInfoResponse(
            id=r["id"],
            filename=r["filename"],
            format=FileFormat(r.get("format", "Unknown")),
            file_size_bytes=r.get("file_size_bytes", 0),
            status=ProcessingStatus(r.get("status", "FAILED")),
            feature_count=r.get("feature_count"),
            source_crs=r.get("source_crs"),
            upload_timestamp=r.get("upload_timestamp", "2000-01-01T00:00:00Z"),
            error_message=r.get("error_message"),
            geometry_types=r.get("geometry_types", []),
            total_area_sq_m=r.get("total_area_sq_m"),
            total_length_m=r.get("total_length_m"),
        ))

    # Sort by upload timestamp descending
    files.sort(key=lambda f: f.upload_timestamp, reverse=True)

    return FileListResponse(files=files, total=len(files))


@router.get(
    "/{file_id}",
    response_model=FileInfoResponse,
    responses={404: {"model": ErrorResponse}},
)
async def get_file(file_id: str):
    """Get file information by ID."""
    record = file_repository.get(file_id)
    if not record:
        raise HTTPException(status_code=404, detail="File '{}' not found.".format(file_id))

    return FileInfoResponse(
        id=record["id"],
        filename=record["filename"],
        format=FileFormat(record.get("format", "Unknown")),
        file_size_bytes=record.get("file_size_bytes", 0),
        status=ProcessingStatus(record.get("status", "FAILED")),
        feature_count=record.get("feature_count"),
        source_crs=record.get("source_crs"),
        upload_timestamp=record.get("upload_timestamp", "2000-01-01T00:00:00Z"),
        error_message=record.get("error_message"),
        geometry_types=record.get("geometry_types", []),
        total_area_sq_m=record.get("total_area_sq_m"),
        total_length_m=record.get("total_length_m"),
    )


@router.get(
    "/{file_id}/measurements",
    response_model=MeasurementsResponse,
    responses={404: {"model": ErrorResponse}},
)
async def get_measurements(file_id: str):
    """Get measurement results for a file."""
    record = file_repository.get(file_id)
    if not record:
        raise HTTPException(status_code=404, detail="File '{}' not found.".format(file_id))

    measurements_data = record.get("measurements", [])
    measurements = [FeatureMeasurement(**m) for m in measurements_data]
    summary_data = compute_summary(measurements_data)
    summary = MeasurementSummary(**summary_data)

    return MeasurementsResponse(
        file_id=file_id,
        filename=record["filename"],
        source_crs=record.get("source_crs"),
        total_features=len(measurements),
        measurements=measurements,
        summary=summary,
    )


@router.get(
    "/{file_id}/geojson",
    responses={404: {"model": ErrorResponse}},
)
async def get_geojson(file_id: str):
    """Get GeoJSON representation of file features.

    Coordinates are in WGS84 (EPSG:4326).
    """
    record = file_repository.get(file_id)
    if not record:
        raise HTTPException(status_code=404, detail="File '{}' not found.".format(file_id))

    measurements = record.get("measurements", [])
    geojson = export_measurements_geojson(measurements, record)

    return geojson


@router.get(
    "/{file_id}/export",
    responses={404: {"model": ErrorResponse}},
)
async def export_file(file_id: str, format: str = "csv"):
    """Export measurement results in CSV, JSON, or GeoJSON format.

    Query params:
        format: 'csv', 'json', or 'geojson' (default: 'csv')
    """
    record = file_repository.get(file_id)
    if not record:
        raise HTTPException(status_code=404, detail="File '{}' not found.".format(file_id))

    measurements = record.get("measurements", [])
    base_name = Path(record["filename"]).stem

    if format.lower() == "csv":
        csv_content = export_measurements_csv(measurements, record["filename"])
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": 'attachment; filename="{}_measurements.csv"'.format(base_name)
            },
        )

    elif format.lower() == "json":
        json_data = export_measurements_json(measurements, record)
        return Response(
            content=json.dumps(json_data, indent=2, default=str),
            media_type="application/json",
            headers={
                "Content-Disposition": 'attachment; filename="{}_measurements.json"'.format(base_name)
            },
        )

    elif format.lower() == "geojson":
        geojson_data = export_measurements_geojson(measurements, record)
        return Response(
            content=json.dumps(geojson_data, indent=2, default=str),
            media_type="application/geo+json",
            headers={
                "Content-Disposition": 'attachment; filename="{}.geojson"'.format(base_name)
            },
        )

    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported export format '{}'. Supported: csv, json, geojson.".format(format),
        )


@router.delete(
    "/{file_id}",
    responses={404: {"model": ErrorResponse}},
)
async def delete_file(file_id: str):
    """Delete a file and its metadata."""
    record = file_repository.get(file_id)
    if not record:
        raise HTTPException(status_code=404, detail="File '{}' not found.".format(file_id))

    # Delete uploaded file
    filename = record.get("filename", "")
    ext = Path(filename).suffix
    upload_path = UPLOAD_DIR / "{}{}".format(file_id, ext)
    if upload_path.exists():
        upload_path.unlink()

    # Delete metadata
    file_repository.delete(file_id)

    return {"message": "File '{}' deleted successfully.".format(filename), "id": file_id}
