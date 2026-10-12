// API response types matching the backend Pydantic schemas

export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type MeasurementStatus = 'COMPLETED' | 'NOT_REQUIRED' | 'UNSUPPORTED' | 'INVALID_GEOMETRY' | 'FAILED';
export type FileFormat = 'KML' | 'Shapefile' | 'Unknown';

export interface FileUploadResponse {
  id: string;
  filename: string;
  format: FileFormat;
  status: ProcessingStatus;
  feature_count: number | null;
  source_crs: string | null;
  upload_timestamp: string;
  message: string;
}

export interface FileInfo {
  id: string;
  filename: string;
  format: FileFormat;
  file_size_bytes: number;
  status: ProcessingStatus;
  feature_count: number | null;
  source_crs: string | null;
  upload_timestamp: string;
  error_message: string | null;
  geometry_types: string[];
  total_area_sq_m: number | null;
  total_length_m: number | null;
}

export interface FileListResponse {
  files: FileInfo[];
  total: number;
}

export interface FeatureMeasurement {
  feature_id: number;
  geometry_type: string;
  measurement_status: MeasurementStatus;
  area_sq_m: number | null;
  length_m: number | null;
  perimeter_m: number | null;
  source_crs: string | null;
  measurement_crs: string | null;
  properties: Record<string, unknown>;
  geometry: GeoJSONGeometry | null;
}

export interface MeasurementSummary {
  total_features: number;
  polygon_count: number;
  line_count: number;
  point_count: number;
  other_count: number;
  total_area_sq_m: number;
  total_length_m: number;
  completed_count: number;
  failed_count: number;
}

export interface MeasurementsResponse {
  file_id: string;
  filename: string;
  source_crs: string | null;
  total_features: number;
  measurements: FeatureMeasurement[];
  summary: MeasurementSummary;
}

export interface GeoJSONGeometry {
  type: string;
  coordinates: unknown;
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONGeometry;
  properties: Record<string, unknown>;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
  crs?: {
    type: string;
    properties: { name: string };
  };
  metadata?: {
    file_id: string;
    filename: string;
    source_crs: string | null;
    total_features: number;
  };
}

export interface ApiError {
  detail: string;
}

export interface DeleteResponse {
  message: string;
  id: string;
}

export interface HealthResponse {
  status: string;
  service: string;
}

// Display preferences
export type AreaUnit = 'sq_m' | 'hectares' | 'sq_km';
export type LengthUnit = 'm' | 'km';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  areaUnit: AreaUnit;
  lengthUnit: LengthUnit;
  defaultMapLayers: boolean;
}
