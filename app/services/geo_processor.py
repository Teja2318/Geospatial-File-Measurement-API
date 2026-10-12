"""Geospatial file processing service.

Handles parsing KML and Shapefile formats, CRS detection,
coordinate transformation, and geometry measurement.
"""

from __future__ import annotations

import logging
import math
import tempfile
import zipfile
from pathlib import Path
from typing import Any, Dict, List, Tuple

import fiona
import geopandas as gpd
import pyproj
from shapely.geometry import mapping, shape
from shapely.validation import make_valid

from app.core.exceptions import (
    CRSError,
    FileValidationError,
    GeoProcessingError,
)
from app.schemas.files import MeasurementStatus

logger = logging.getLogger(__name__)

# Maximum number of files to extract from a ZIP
MAX_ZIP_ENTRIES = 100
# Maximum uncompressed size of a ZIP (200 MB)
MAX_ZIP_UNCOMPRESSED_SIZE = 200 * 1024 * 1024


def determine_utm_crs(longitude: float, latitude: float) -> pyproj.CRS:
    """Determine the appropriate UTM CRS for a given point.

    Args:
        longitude: Longitude in degrees.
        latitude: Latitude in degrees.

    Returns:
        A pyproj CRS object for the appropriate UTM zone.
    """
    zone_number = int((longitude + 180) / 6) + 1
    # Clamp to valid range
    zone_number = max(1, min(60, zone_number))

    if latitude >= 0:
        epsg = 32600 + zone_number  # Northern hemisphere
    else:
        epsg = 32700 + zone_number  # Southern hemisphere

    return pyproj.CRS.from_epsg(epsg)


def select_measurement_crs(gdf: gpd.GeoDataFrame) -> Tuple[pyproj.CRS, str]:
    """Select an appropriate projected CRS for measurement.

    Uses UTM for small/medium extents, or an equal-area projection
    for datasets spanning large areas.

    Args:
        gdf: GeoDataFrame with geometry data.

    Returns:
        Tuple of (CRS object, CRS description string).
    """
    if gdf.empty or gdf.geometry.is_empty.all():
        raise CRSError("Cannot determine measurement CRS for empty dataset")

    # Ensure we're working in geographic coordinates for centroid calculation
    if gdf.crs and not gdf.crs.is_geographic:
        gdf_geo = gdf.to_crs(epsg=4326)
    else:
        gdf_geo = gdf

    bounds = gdf_geo.total_bounds  # [minx, miny, maxx, maxy]
    centroid_lon = (bounds[0] + bounds[2]) / 2
    centroid_lat = (bounds[1] + bounds[3]) / 2
    lon_span = abs(bounds[2] - bounds[0])
    lat_span = abs(bounds[3] - bounds[1])

    # For datasets spanning more than 6 degrees of longitude (wider than one UTM zone)
    # or more than 16 degrees of latitude, use an equal-area projection
    if lon_span > 6 or lat_span > 16:
        # Use Lambert Azimuthal Equal Area centered on dataset centroid
        crs = pyproj.CRS.from_proj4(
            f"+proj=laea +lat_0={centroid_lat} +lon_0={centroid_lon} "
            f"+x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs"
        )
        desc = f"LAEA (centered at {centroid_lat:.2f}, {centroid_lon:.2f})"
        return crs, desc

    # Use UTM
    utm_crs = determine_utm_crs(centroid_lon, centroid_lat)
    zone_number = int((centroid_lon + 180) / 6) + 1
    hemisphere = "N" if centroid_lat >= 0 else "S"
    desc = f"UTM Zone {zone_number}{hemisphere} (EPSG:{utm_crs.to_epsg()})"
    return utm_crs, desc


def validate_zip_contents(zip_path: Path) -> Path:
    """Validate and extract shapefile from a ZIP archive.

    Security checks:
    - No path traversal
    - Reasonable file count
    - Reasonable total size
    - Required .shp, .shx, .dbf files present

    Args:
        zip_path: Path to the ZIP file.

    Returns:
        Path to the directory containing extracted files.

    Raises:
        FileValidationError: If the ZIP is invalid or malicious.
    """
    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            # Check for zip bomb / too many entries
            if len(zf.namelist()) > MAX_ZIP_ENTRIES:
                raise FileValidationError(
                    f"ZIP contains too many files ({len(zf.namelist())}). Maximum is {MAX_ZIP_ENTRIES}."
                )

            # Check total uncompressed size
            total_size = sum(info.file_size for info in zf.infolist())
            if total_size > MAX_ZIP_UNCOMPRESSED_SIZE:
                raise FileValidationError(
                    f"ZIP uncompressed size ({total_size / 1024 / 1024:.1f} MB) "
                    f"exceeds maximum ({MAX_ZIP_UNCOMPRESSED_SIZE / 1024 / 1024:.0f} MB)."
                )

            # Check for path traversal
            for name in zf.namelist():
                if name.startswith("/") or ".." in name:
                    raise FileValidationError(
                        "ZIP contains unsafe paths (path traversal detected)."
                    )

            # Find shapefile components
            extensions = {Path(name).suffix.lower() for name in zf.namelist()}
            required = {".shp", ".shx", ".dbf"}
            missing = required - extensions
            if missing:
                raise FileValidationError(
                    f"ZIP is missing required Shapefile components: {', '.join(sorted(missing))}. "
                    f"A valid Shapefile ZIP must contain .shp, .shx, and .dbf files."
                )

            # Extract to a temp directory
            extract_dir = Path(tempfile.mkdtemp(prefix="geomeasure_"))
            zf.extractall(extract_dir)

            # Find the .shp file
            shp_files = list(extract_dir.rglob("*.shp"))
            if not shp_files:
                raise FileValidationError("No .shp file found in extracted contents.")

            return extract_dir

    except zipfile.BadZipFile:
        raise FileValidationError("The uploaded file is not a valid ZIP archive.")


def read_geospatial_file(file_path: Path, file_format: str) -> gpd.GeoDataFrame:
    """Read a geospatial file into a GeoDataFrame.

    Args:
        file_path: Path to the file or directory containing shapefile.
        file_format: 'KML' or 'Shapefile'.

    Returns:
        GeoDataFrame with the file's features.
    """
    try:
        if file_format == "KML":
            # fiona/gpd can read KML with the libkml or KML driver
            fiona.drvsupport.supported_drivers["KML"] = "r"
            gdf = gpd.read_file(file_path, driver="KML")
        elif file_format == "Shapefile":
            # Find the .shp file in the directory
            if file_path.is_dir():
                shp_files = list(file_path.rglob("*.shp"))
                if not shp_files:
                    raise GeoProcessingError("No .shp file found in extracted directory.")
                gdf = gpd.read_file(shp_files[0])
            else:
                gdf = gpd.read_file(file_path)
        else:
            raise GeoProcessingError(f"Unsupported format: {file_format}")

        return gdf

    except GeoProcessingError:
        raise
    except Exception as e:
        raise GeoProcessingError(
            f"Failed to read {file_format} file",
            detail=str(e)
        )


def process_geometries(gdf: gpd.GeoDataFrame) -> List[Dict[str, Any]]:
    """Process all geometries and calculate measurements.

    For each feature:
    - Polygons/MultiPolygons: calculate area in sq meters
    - LineStrings/MultiLineStrings: calculate length in meters
    - Points/MultiPoints: no measurement required
    - Others: marked as unsupported

    Args:
        gdf: GeoDataFrame with features.

    Returns:
        List of measurement dictionaries per feature.
    """
    if gdf.empty:
        return []

    # Detect source CRS
    source_crs = gdf.crs
    source_crs_str = str(source_crs) if source_crs else None

    # Select measurement CRS
    try:
        measurement_crs, measurement_crs_desc = select_measurement_crs(gdf)
    except CRSError as e:
        logger.warning("Cannot determine measurement CRS: %s", e)
        measurement_crs = None
        measurement_crs_desc = None

    # Project to measurement CRS if available
    gdf_projected = None
    if measurement_crs is not None:
        try:
            if source_crs is None:
                logger.warning("Source CRS is unknown. Cannot project for measurement.")
            else:
                gdf_projected = gdf.to_crs(measurement_crs)
        except Exception as e:
            logger.error("CRS transformation failed: %s", e)

    measurements: List[Dict[str, Any]] = []
    property_columns = [
        col for col in gdf.columns if col != "geometry" and col != gdf.geometry.name
    ]

    for idx in range(len(gdf)):
        row = gdf.iloc[idx]
        feature_idx = idx
        geom = row.geometry
        properties: Dict[str, Any] = {}
        for col in property_columns:
            val = row[col]
            # Convert to JSON-serializable types
            if hasattr(val, "item"):  # numpy types
                val = val.item()
            try:
                if val != val:  # NaN check
                    val = None
            except (TypeError, ValueError):
                pass
            properties[col] = val

        measurement: Dict[str, Any] = {
            "feature_id": feature_idx,
            "geometry_type": geom.geom_type if geom and not geom.is_empty else "Empty",
            "source_crs": source_crs_str,
            "measurement_crs": measurement_crs_desc,
            "properties": properties,
            "area_sq_m": None,
            "length_m": None,
            "perimeter_m": None,
            "measurement_status": MeasurementStatus.FAILED.value,
        }

        # Store geometry as GeoJSON
        if geom and not geom.is_empty:
            try:
                # Ensure geometry is in WGS84 for GeoJSON
                if source_crs and not source_crs.is_geographic:
                    from pyproj import Transformer
                    from shapely.ops import transform
                    transformer = Transformer.from_crs(
                        source_crs, pyproj.CRS.from_epsg(4326), always_xy=True
                    )
                    geom_wgs84 = transform(transformer.transform, geom)
                    measurement["geometry"] = mapping(geom_wgs84)
                else:
                    measurement["geometry"] = mapping(geom)
            except Exception as e:
                logger.warning("Failed to convert geometry to GeoJSON: %s", e)
                measurement["geometry"] = mapping(geom)

        if geom is None or geom.is_empty:
            measurement["measurement_status"] = MeasurementStatus.INVALID_GEOMETRY.value
            measurement["geometry_type"] = "Empty"
            measurements.append(measurement)
            continue

        geom_type = geom.geom_type

        # Validate geometry
        if not geom.is_valid:
            try:
                geom = make_valid(geom)
            except Exception:
                measurement["measurement_status"] = MeasurementStatus.INVALID_GEOMETRY.value
                measurements.append(measurement)
                continue

        if geom_type in ("Polygon", "MultiPolygon"):
            if gdf_projected is not None:
                try:
                    projected_geom = gdf_projected.geometry.iloc[feature_idx]
                    if not projected_geom.is_valid:
                        projected_geom = make_valid(projected_geom)
                    area = projected_geom.area
                    perimeter = projected_geom.length
                    if not (math.isnan(area) or math.isinf(area)):
                        measurement["area_sq_m"] = round(area, 4)
                    if not (math.isnan(perimeter) or math.isinf(perimeter)):
                        measurement["perimeter_m"] = round(perimeter, 4)
                    measurement["measurement_status"] = MeasurementStatus.COMPLETED.value
                except Exception as e:
                    logger.error("Area calculation failed for feature %d: %s", feature_idx, e)
                    measurement["measurement_status"] = MeasurementStatus.FAILED.value
            else:
                measurement["measurement_status"] = MeasurementStatus.FAILED.value

        elif geom_type in ("LineString", "MultiLineString"):
            if gdf_projected is not None:
                try:
                    projected_geom = gdf_projected.geometry.iloc[feature_idx]
                    if not projected_geom.is_valid:
                        projected_geom = make_valid(projected_geom)
                    length = projected_geom.length
                    if not (math.isnan(length) or math.isinf(length)):
                        measurement["length_m"] = round(length, 4)
                    measurement["measurement_status"] = MeasurementStatus.COMPLETED.value
                except Exception as e:
                    logger.error("Length calculation failed for feature %d: %s", feature_idx, e)
                    measurement["measurement_status"] = MeasurementStatus.FAILED.value
            else:
                measurement["measurement_status"] = MeasurementStatus.FAILED.value

        elif geom_type in ("Point", "MultiPoint"):
            measurement["measurement_status"] = MeasurementStatus.NOT_REQUIRED.value

        elif geom_type == "GeometryCollection":
            measurement["measurement_status"] = MeasurementStatus.UNSUPPORTED.value

        else:
            measurement["measurement_status"] = MeasurementStatus.UNSUPPORTED.value

        measurements.append(measurement)

    return measurements


def compute_summary(measurements: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Compute aggregate summary from feature measurements."""
    summary: Dict[str, Any] = {
        "total_features": len(measurements),
        "polygon_count": 0,
        "line_count": 0,
        "point_count": 0,
        "other_count": 0,
        "total_area_sq_m": 0.0,
        "total_length_m": 0.0,
        "completed_count": 0,
        "failed_count": 0,
    }

    for m in measurements:
        gt = m.get("geometry_type", "")
        status = m.get("measurement_status", "")

        if gt in ("Polygon", "MultiPolygon"):
            summary["polygon_count"] += 1
        elif gt in ("LineString", "MultiLineString"):
            summary["line_count"] += 1
        elif gt in ("Point", "MultiPoint"):
            summary["point_count"] += 1
        else:
            summary["other_count"] += 1

        if status == MeasurementStatus.COMPLETED.value:
            summary["completed_count"] += 1
        elif status == MeasurementStatus.FAILED.value:
            summary["failed_count"] += 1

        if m.get("area_sq_m") is not None:
            summary["total_area_sq_m"] += m["area_sq_m"]
        if m.get("length_m") is not None:
            summary["total_length_m"] += m["length_m"]

    summary["total_area_sq_m"] = round(summary["total_area_sq_m"], 4)
    summary["total_length_m"] = round(summary["total_length_m"], 4)

    return summary
