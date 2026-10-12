"""Integration tests for GeoMeasure FastAPI application."""

import io
import tempfile
import zipfile
from pathlib import Path

import geopandas as gpd
import pytest
from fastapi.testclient import TestClient
from shapely.geometry import LineString, Point, Polygon

from app.main import app

client = TestClient(app)

SAMPLE_KML = """<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Sample Farm</name>
      <description>Agricultural parcel</description>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              -122.084,37.422,0
              -122.082,37.422,0
              -122.082,37.420,0
              -122.084,37.420,0
              -122.084,37.422,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
    <Placemark>
      <name>Boundary Road</name>
      <description>Access road</description>
      <LineString>
        <coordinates>
          -122.084,37.422,0
          -122.080,37.422,0
        </coordinates>
      </LineString>
    </Placemark>
    <Placemark>
      <name>Survey Marker</name>
      <Point>
        <coordinates>-122.083,37.421,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>
"""


def create_sample_shapefile_zip() -> io.BytesIO:
    """Create an in-memory Shapefile ZIP containing Polygon and LineString features."""
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        shp_path = temp_path / "test_parcels.shp"

        # Create sample GeoDataFrame with Polygons (ESRI Shapefiles require homogenous geometry types)
        gdf = gpd.GeoDataFrame(
            {
                "name": ["Parcel A", "Parcel B"],
                "category": ["Commercial", "Residential"],
                "geometry": [
                    Polygon([(0.0, 0.0), (0.01, 0.0), (0.01, 0.01), (0.0, 0.01), (0.0, 0.0)]),
                    Polygon([(0.02, 0.02), (0.03, 0.02), (0.03, 0.03), (0.02, 0.03), (0.02, 0.02)]),
                ],
            },
            crs="EPSG:4326",
        )
        gdf.to_file(shp_path, driver="ESRI Shapefile")

        # Create zip buffer
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for file in temp_path.glob("test_parcels.*"):
                zip_file.write(file, arcname=file.name)

        zip_buffer.seek(0)
        return zip_buffer


def test_home_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "GeoMeasure API" in data["message"]
    assert data["version"] == "1.0.0"


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "geomeasure-api"


def test_list_files_empty_or_existing():
    response = client.get("/api/files/")
    assert response.status_code == 200
    data = response.json()
    assert "files" in data
    assert "total" in data
    assert isinstance(data["files"], list)


def test_upload_invalid_extension():
    file_bytes = b"sample plain text file content"
    files = {"file": ("data.txt", file_bytes, "text/plain")}
    response = client.post("/api/files/", files=files)
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


def test_upload_empty_file():
    files = {"file": ("empty.kml", b"", "application/vnd.google-earth.kml+xml")}
    response = client.post("/api/files/", files=files)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_upload_and_measure_kml_file():
    files = {"file": ("test_farm.kml", SAMPLE_KML.encode("utf-8"), "application/vnd.google-earth.kml+xml")}
    response = client.post("/api/files/", files=files)
    assert response.status_code == 201
    data = response.json()
    assert data["filename"] == "test_farm.kml"
    assert data["format"] == "KML"
    assert data["status"] == "COMPLETED"
    assert data["feature_count"] == 3
    file_id = data["id"]

    # Retrieve file info
    get_res = client.get(f"/api/files/{file_id}")
    assert get_res.status_code == 200
    file_info = get_res.json()
    assert file_info["id"] == file_id
    assert file_info["feature_count"] == 3
    assert file_info["total_area_sq_m"] is not None
    assert file_info["total_area_sq_m"] > 0
    assert file_info["total_length_m"] is not None
    assert file_info["total_length_m"] > 0

    # Retrieve measurements
    meas_res = client.get(f"/api/files/{file_id}/measurements")
    assert meas_res.status_code == 200
    meas_data = meas_res.json()
    assert meas_data["total_features"] == 3
    assert len(meas_data["measurements"]) == 3
    assert meas_data["summary"]["polygon_count"] == 1
    assert meas_data["summary"]["line_count"] == 1
    assert meas_data["summary"]["point_count"] == 1
    assert meas_data["summary"]["total_area_sq_m"] > 0

    # Retrieve GeoJSON
    geo_res = client.get(f"/api/files/{file_id}/geojson")
    assert geo_res.status_code == 200
    geojson = geo_res.json()
    assert geojson["type"] == "FeatureCollection"
    assert len(geojson["features"]) == 3

    # Export CSV
    csv_res = client.get(f"/api/files/{file_id}/export?format=csv")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers.get("content-type", "")
    assert "Feature ID" in csv_res.text

    # Export JSON
    json_res = client.get(f"/api/files/{file_id}/export?format=json")
    assert json_res.status_code == 200
    assert json_res.json()["file_id"] == file_id

    # Export GeoJSON
    export_geo_res = client.get(f"/api/files/{file_id}/export?format=geojson")
    assert export_geo_res.status_code == 200
    assert export_geo_res.json()["type"] == "FeatureCollection"

    # Export invalid format
    bad_export = client.get(f"/api/files/{file_id}/export?format=parquet")
    assert bad_export.status_code == 400

    # Delete file
    del_res = client.delete(f"/api/files/{file_id}")
    assert del_res.status_code == 200

    # Verify not found after delete
    not_found_res = client.get(f"/api/files/{file_id}")
    assert not_found_res.status_code == 404


def test_upload_and_measure_shapefile_zip():
    zip_buffer = create_sample_shapefile_zip()
    files = {"file": ("test_parcels.zip", zip_buffer.getvalue(), "application/zip")}
    response = client.post("/api/files/", files=files)
    assert response.status_code == 201
    data = response.json()
    assert data["format"] == "Shapefile"
    assert data["status"] == "COMPLETED"
    assert data["feature_count"] == 2
    file_id = data["id"]

    # Verify measurements
    meas_res = client.get(f"/api/files/{file_id}/measurements")
    assert meas_res.status_code == 200
    meas_data = meas_res.json()
    assert meas_data["summary"]["polygon_count"] == 2
    assert meas_data["summary"]["line_count"] == 0
    assert meas_data["summary"]["total_area_sq_m"] > 0

    # Clean up
    client.delete(f"/api/files/{file_id}")


def test_get_nonexistent_file():
    response = client.get("/api/files/nonexistent-uuid-1234")
    assert response.status_code == 404
