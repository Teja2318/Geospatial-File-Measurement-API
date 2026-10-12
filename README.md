# GeoMeasure — Geospatial File Measurement & Analytics Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.0+-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB.svg?logo=python&logoColor=white)](https://python.org)

**GeoMeasure** is a full-stack, enterprise-grade geospatial analytics and measurement platform. It enables users to upload vector datasets (**Google Earth KML** and **ESRI Shapefile ZIP archives**), automatically project geometries into optimal local coordinate systems, calculate high-precision metric measurements (area, perimeter, curvilinear length), visualize features on an interactive Leaflet map, and export results in CSV, JSON, and GeoJSON formats.

---

## 🌟 Key Features

- **Multi-Format Ingestion**: Synchronously ingests and validates `.kml` documents and `.zip` Shapefile packages (with `.shp`, `.shx`, `.dbf`, and optional `.prj` components).
- **Accurate Geodesic & Metric Calculations**: Automatically determines the local UTM zone or appropriate equal-area projected CRS for geometries to calculate metric measurements (square meters, hectares, square kilometers, meters, kilometers) rather than degree-based distortions.
- **Interactive Geospatial Visualization**: Interactive Leaflet map with multi-layer basemaps (CartoDB Positron, OpenStreetMap, CartoDB Dark), automatic bounding-box fitting, color-coded geometry types, and interactive feature popups.
- **Bi-Directional Feature Synchronization**: Select any row in the measurements table to highlight and zoom into the geometry on the map, and click any map feature to highlight its row and examine its raw attributes.
- **Customizable Preferences**: User-configurable area units (`m²`, `ha`, `km²`), length units (`m`, `km`), and dark/light/system theme toggles persisted in `localStorage`.
- **Multi-Format Export Engine**: Export processed dataset measurements as clean CSV tables, JSON reports, or WGS84 GeoJSON FeatureCollections ready for GIS software like QGIS or ArcGIS.
- **Robust Automated Test Suites**: Comprehensive backend tests (pytest) and frontend unit tests (vitest).

---

## 🏗️ Architecture

```
Geospatial-File-Measurement-API/
├── app/                              # FastAPI Backend
│   ├── api/
│   │   └── routes.py                 # REST endpoints for upload, get, measurements, export, delete
│   ├── core/
│   │   ├── config.py                 # File size limits, allowed extensions, CORS configuration
│   │   └── exceptions.py             # Custom GIS and validation exception hierarchy
│   ├── repositories/
│   │   └── file_repository.py        # File metadata persistence layer
│   ├── schemas/
│   │   ├── files.py                  # Pydantic models for file uploads and responses
│   │   └── measurements.py           # Pydantic models for measurements and summaries
│   ├── services/
│   │   ├── geo_processor.py          # Geopandas / Shapely / PyProj CRS projection & measurements
│   │   └── export_service.py         # CSV, JSON, and GeoJSON export formatters
│   └── main.py                       # FastAPI application entrypoint & middleware
├── frontend/                         # React 19 + TypeScript + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/Layout.tsx     # Responsive desktop sidebar and mobile navigation drawer
│   │   │   ├── map/MapView.tsx       # Leaflet GeoJSON map with layer switcher and popups
│   │   │   └── ui/components.tsx     # Card, StatusBadge, LoadingSpinner, ConfirmDialog, EmptyState
│   │   ├── hooks/
│   │   │   ├── useApi.ts             # TanStack Query hooks for files, measurements, geojson, upload
│   │   │   └── usePreferences.ts     # User units & theme preference hook with localStorage
│   │   ├── lib/
│   │   │   ├── api-client.ts         # Axios client with upload progress tracking & error interceptors
│   │   │   └── utils.ts              # Unit conversion, formatting, and color helpers
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx         # Overview metrics, Recharts analytics, recent files
│   │   │   ├── UploadPage.tsx        # Drag & drop uploader with progress and format guidance
│   │   │   ├── FileHistoryPage.tsx   # Searchable & filterable file repository with quick export
│   │   │   ├── FileDetailPage.tsx    # Split interactive map and synchronized measurements table
│   │   │   └── SettingsPage.tsx      # Display unit preferences, theme toggle, and system diagnostics
│   │   ├── types/api.ts              # TypeScript interfaces mirroring Pydantic schemas
│   │   ├── App.tsx                   # React Router route registry
│   │   └── main.tsx                  # React entry point
│   ├── package.json
│   └── vite.config.ts
├── tests/
│   └── test_api.py                   # Pytest test suite (health, upload, measurements, exports)
└── requirements.txt                  # Python dependencies
```

---

## 🧮 Geodesic & Projection Methodology

Calculations on geographic coordinate reference systems (such as WGS84 EPSG:4326) yield areas in "square degrees" and lengths in "degrees", which are physically meaningless and vary heavily by latitude.

GeoMeasure solves this by:
1. Detecting the input dataset's native Coordinate Reference System (`source_crs`).
2. If unprojected (geographic WGS84) or missing:
   - Calculating the centroid longitude and latitude of each feature.
   - Dynamically selecting the appropriate **Universal Transverse Mercator (UTM)** zone (e.g. `EPSG:32610` for California) or an equal-area projection.
3. Transforming coordinates into metric projected space via `pyproj` and `geopandas`.
4. Computing planar surface area in square meters ($m^2$), curvilinear perimeter in meters ($m$), and path length in meters ($m$) using exact Shapely geometries.
5. Exporting GeoJSON geometries back into standard WGS84 (`EPSG:4326`) for universal Leaflet/web compatibility.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API status and documentation link |
| `GET` | `/health` | Health check endpoint |
| `POST` | `/api/files/` | Upload a KML file or Shapefile ZIP package |
| `GET` | `/api/files/` | List all processed geospatial files |
| `GET` | `/api/files/{id}` | Get metadata and summary for a file |
| `GET` | `/api/files/{id}/measurements` | Get per-feature metric measurements and dataset summary |
| `GET` | `/api/files/{id}/geojson` | Get WGS84 GeoJSON FeatureCollection |
| `GET` | `/api/files/{id}/export` | Export dataset measurements (`format=csv`, `json`, `geojson`) |
| `DELETE` | `/api/files/{id}` | Delete uploaded file and measurement records |

Interactive OpenAPI documentation is available at `http://localhost:8000/docs`.

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.9+
- Node.js 18+ & npm
- GDAL / GEOS libraries (bundled with `geopandas` / `pyogrio` / `shapely` binary wheels)

### 2. Backend Setup
```bash
# Clone the repository
cd Geospatial-File-Measurement-API

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```
Backend will be live at `http://localhost:8000`.

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend will be live at `http://localhost:5173`.

---

## 🧪 Running Tests

### Backend Tests (Pytest)
```bash
# In the root repository directory with virtual environment activated:
pytest -v
```

### Frontend Tests (Vitest)
```bash
# In the frontend directory:
cd frontend
npm test
```

### Frontend Production Build
```bash
cd frontend
npm run build
```

---

## 📄 License
MIT License.