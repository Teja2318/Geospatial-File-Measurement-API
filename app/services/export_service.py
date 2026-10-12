"""Export service for generating CSV, JSON, and GeoJSON exports."""

from __future__ import annotations

import csv
import io
import json
from typing import Any, Dict, List


def export_measurements_csv(
    measurements: List[Dict[str, Any]],
    filename: str,
) -> str:
    """Export measurements to CSV format.

    Args:
        measurements: List of feature measurement dicts.
        filename: Original filename for reference.

    Returns:
        CSV string with proper escaping.
    """
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_ALL)

    # Header
    writer.writerow([
        "Feature ID",
        "Geometry Type",
        "Measurement Status",
        "Area (sq m)",
        "Area (hectares)",
        "Area (sq km)",
        "Length (m)",
        "Length (km)",
        "Perimeter (m)",
        "Source CRS",
        "Measurement CRS",
        "Properties",
    ])

    for m in measurements:
        area_sq_m = m.get("area_sq_m")
        length_m = m.get("length_m")
        perimeter_m = m.get("perimeter_m")

        writer.writerow([
            m.get("feature_id", ""),
            m.get("geometry_type", ""),
            m.get("measurement_status", ""),
            "{:.4f}".format(area_sq_m) if area_sq_m is not None else "",
            "{:.6f}".format(area_sq_m / 10000) if area_sq_m is not None else "",
            "{:.8f}".format(area_sq_m / 1000000) if area_sq_m is not None else "",
            "{:.4f}".format(length_m) if length_m is not None else "",
            "{:.6f}".format(length_m / 1000) if length_m is not None else "",
            "{:.4f}".format(perimeter_m) if perimeter_m is not None else "",
            m.get("source_crs", ""),
            m.get("measurement_crs", ""),
            json.dumps(m.get("properties", {}), ensure_ascii=False),
        ])

    return output.getvalue()


def export_measurements_json(
    measurements: List[Dict[str, Any]],
    file_info: Dict[str, Any],
) -> Dict[str, Any]:
    """Export measurements to JSON format.

    Args:
        measurements: List of feature measurement dicts.
        file_info: File metadata.

    Returns:
        Dictionary with measurement data and metadata.
    """
    # Strip geometry from JSON export to keep it lightweight
    clean_measurements = []
    for m in measurements:
        clean = {k: v for k, v in m.items() if k != "geometry"}
        clean_measurements.append(clean)

    return {
        "file_id": file_info.get("id", ""),
        "filename": file_info.get("filename", ""),
        "source_crs": file_info.get("source_crs"),
        "export_format": "JSON",
        "measurements": clean_measurements,
    }


def export_measurements_geojson(
    measurements: List[Dict[str, Any]],
    file_info: Dict[str, Any],
) -> Dict[str, Any]:
    """Export measurements as GeoJSON FeatureCollection.

    Geometry coordinates are in WGS84 (EPSG:4326) as per GeoJSON spec (RFC 7946).

    Args:
        measurements: List of feature measurement dicts (must include geometry).
        file_info: File metadata.

    Returns:
        GeoJSON FeatureCollection dict.
    """
    features = []
    for m in measurements:
        geom = m.get("geometry")
        if geom is None:
            continue

        properties: Dict[str, Any] = {
            "feature_id": m.get("feature_id"),
            "geometry_type": m.get("geometry_type"),
            "measurement_status": m.get("measurement_status"),
            "area_sq_m": m.get("area_sq_m"),
            "length_m": m.get("length_m"),
            "perimeter_m": m.get("perimeter_m"),
            "source_crs": m.get("source_crs"),
            "measurement_crs": m.get("measurement_crs"),
        }
        # Merge original properties
        for k, v in m.get("properties", {}).items():
            if k not in properties:
                properties[k] = v

        features.append({
            "type": "Feature",
            "geometry": geom,
            "properties": properties,
        })

    return {
        "type": "FeatureCollection",
        "crs": {
            "type": "name",
            "properties": {"name": "urn:ogc:def:crs:EPSG::4326"}
        },
        "features": features,
        "metadata": {
            "file_id": file_info.get("id", ""),
            "filename": file_info.get("filename", ""),
            "source_crs": file_info.get("source_crs"),
            "total_features": len(features),
        }
    }
