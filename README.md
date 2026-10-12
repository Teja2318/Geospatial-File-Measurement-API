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
- **Interactive Geospatial Visualization**: Interactive Leaflet map with multi-layer basemaps (Esri Dark Canvas, Esri Satellite Imagery, OpenStreetMap), automatic bounding-box fitting, color-coded geometry types, and interactive feature popups.
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
│   │   ├── App.css                   # Custom theme tokens, card layouts, dropzone & table styles
│   │   ├── App.tsx                   # React Router route registry
│   │   └── main.tsx                  # React entry point
│   ├── package.json
│   └── vite.config.ts
├── tests/
│   └── test_api.py                   # Pytest test suite (health, upload, measurements, exports)
├── storage/                          # Auto-created runtime storage for uploads & metadata
├── requirements.txt                  # Python backend dependencies
└── README.md
```

---

## 🧮 Geodesic & Projection Methodology

Calculations on geographic coordinate reference systems (such as WGS84 EPSG:4326) yield areas in "square degrees" and lengths in "degrees", which are physically meaningless and vary heavily by latitude.

GeoMeasure solves this by:
1. Detecting the input dataset's native Coordinate Reference System (`source_crs`).
2. If unprojected (geographic WGS84) or missing:
   - Calculating the centroid longitude and latitude of each feature.
   - Dynamically selecting the appropriate **Universal Transverse Mercator (UTM)** zone (e.g. `EPSG:32610` for Northern California) or an optimal projected meridian.
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

## 🚀 Step-by-Step Setup Instructions

### 1. Prerequisites

Before installing, ensure your system has the following installed:

- **Python**: Version `3.9` or higher (`python3 --version`)
- **Node.js**: Version `18.0.0` or higher (`node --version`)
- **npm**: Version `9.0.0` or higher (`npm --version`)
- **Git**: (`git --version`)

> **Note on Geospatial Dependencies**: Binary wheels for `geopandas`, `shapely`, `pyproj`, and `fiona` automatically bundle GDAL, GEOS, and PROJ for macOS, Linux, and Windows. If installing from source on Linux, ensure system libraries are installed (e.g. `sudo apt-get install gdal-bin libgdal-dev`).

---

### 2. Clone the Repository

```bash
git clone https://github.com/Teja2318/Geospatial-File-Measurement-API.git
cd Geospatial-File-Measurement-API
```

---

### 3. Backend Setup (FastAPI)

#### Step 3.1: Create and Activate a Virtual Environment

**On macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

**On Windows (PowerShell):**
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

**On Windows (Command Prompt):**
```cmd
python -m venv .venv
.venv\Scripts\activate.bat
```

#### Step 3.2: Install Backend Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### Step 3.3: Configure Environment Variables

Create a `.env` file in the root directory (or copy from `.env.example`):

```bash
cp .env.example .env
```

Default settings in `.env`:
```ini
# Maximum file upload limit in megabytes
MAX_UPLOAD_SIZE_MB=50

# Allowed CORS origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
```

#### Step 3.4: Start the Backend Server

```bash
uvicorn app.main:app --reload --port 8000
```

- **API Base URL**: `http://localhost:8000`
- **Swagger Interactive API Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/health`

---

### 4. Frontend Setup (React + Vite)

Open a **new terminal tab or window** and navigate to the `frontend` directory.

#### Step 4.1: Install Node Dependencies

```bash
cd frontend
npm install
```

#### Step 4.2: Configure Frontend Environment Variables

Create a `.env` file inside the `frontend/` directory (or copy from `.env.example`):

```bash
cp .env.example .env
```

Contents of `frontend/.env`:
```ini
# Backend API base URL
VITE_API_BASE_URL=http://localhost:8000
```

#### Step 4.3: Start the Frontend Development Server

```bash
npm run dev
```

- **Frontend Application URL**: `http://localhost:5173`

The application will automatically connect to the FastAPI backend running on port 8000.

---

## 🧪 Testing & Validation

### 1. Backend Automated Tests (Pytest)

Run the test suite in the root directory with the virtual environment activated:

```bash
# Run all tests with verbose output
pytest -v

# Run with test coverage
pytest --tb=short
```

Tests validate:
- System health checks and metadata endpoints
- KML file upload and parsing
- ESRI Shapefile archive validation (checking `.shp`, `.shx`, `.dbf`)
- UTM projection accuracy and SI metric area/length calculations
- Multi-format export generation (`CSV`, `JSON`, `GeoJSON`)
- Error handling for invalid geometries or oversized payloads

### 2. Frontend Unit Tests (Vitest)

In the `frontend/` directory:

```bash
cd frontend
npm test
```

Tests validate:
- Metric unit conversion functions (meters, kilometers, square meters, hectares, square kilometers)
- File size formatting helpers
- Status badge and geometry styling token resolvers

### 3. Frontend Production Build Check

Verify that TypeScript types and Vite bundling succeed without errors:

```bash
cd frontend
npm run build
```

The compiled production bundle will be written to `frontend/dist/`.

---

## 📂 Testing with Geospatial Datasets

### Supported Formats:
1. **Google Earth KML (`.kml`)**: Standard XML vector file containing Points, LineStrings, or Polygons.
2. **ESRI Shapefile Archive (`.zip`)**: A standard `.zip` archive containing at minimum:
   - `<name>.shp` (Geometry shapes)
   - `<name>.shx` (Shape index)
   - `<name>.dbf` (Attribute table)
   - *(Optional)* `<name>.prj` (Coordinate Reference System definition)

### Quick Upload Verification:
1. Open the web app at `http://localhost:5173`.
2. Click **Upload Data** in the sidebar or header.
3. Drag and drop any `.kml` or `.zip` file into the upload zone (or click to browse).
4. Click **Upload & Analyze Geometries**.
5. Once processing completes, click **Inspect Map & Features** to explore the interactive Leaflet map, feature attributes, and metric calculations.

---

## 🛠️ Common Troubleshooting

### 1. `CORS error` when calling the API
- Ensure the backend server is running on `http://localhost:8000`.
- Verify that `CORS_ORIGINS` in your root `.env` includes `http://localhost:5173`.

### 2. `Shapefile ZIP validation failed`
- Ensure the root of the `.zip` archive directly contains `.shp`, `.shx`, and `.dbf` companion files without being nested inside extra parent folders.

### 3. `ModuleNotFoundError: No module named 'geopandas'` (or `fiona`)
- Ensure your Python virtual environment is activated (`source .venv/bin/activate` or `.venv\Scripts\activate`).
- Run `pip install -r requirements.txt`.

### 4. Port 8000 or 5173 Already in Use
- **Backend on custom port**: `uvicorn app.main:app --reload --port 8080` (update `VITE_API_BASE_URL=http://localhost:8080` in `frontend/.env`).
- **Frontend on custom port**: `npm run dev -- --port 3000` (ensure `http://localhost:3000` is listed in backend `CORS_ORIGINS`).

---

## 📄 License
This project is licensed under the MIT License.
