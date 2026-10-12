import axios from 'axios';
import type {
  FileUploadResponse,
  FileListResponse,
  FileInfo,
  MeasurementsResponse,
  GeoJSONFeatureCollection,
  DeleteResponse,
  HealthResponse,
} from '@/types/api';

// Use Vite proxy in dev, or VITE_API_BASE_URL for production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for large file uploads
  headers: {
    'Accept': 'application/json',
  },
});

// Response interceptor for consistent error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const detail = error.response.data?.detail || error.response.statusText || 'An error occurred';
      const enhancedError = new Error(detail);
      (enhancedError as Error & { status: number }).status = error.response.status;
      return Promise.reject(enhancedError);
    }
    if (error.request) {
      return Promise.reject(new Error('Unable to reach the server. Please check your connection.'));
    }
    return Promise.reject(error);
  }
);

// API functions
export const api = {
  // Health
  health: async (): Promise<HealthResponse> => {
    const { data } = await apiClient.get<HealthResponse>('/health');
    return data;
  },

  // Files
  uploadFile: async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiClient.post<FileUploadResponse>('/api/files/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (event.total && onProgress) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    });
    return data;
  },

  listFiles: async (): Promise<FileListResponse> => {
    const { data } = await apiClient.get<FileListResponse>('/api/files/');
    return data;
  },

  getFile: async (fileId: string): Promise<FileInfo> => {
    const { data } = await apiClient.get<FileInfo>(`/api/files/${fileId}`);
    return data;
  },

  getMeasurements: async (fileId: string): Promise<MeasurementsResponse> => {
    const { data } = await apiClient.get<MeasurementsResponse>(`/api/files/${fileId}/measurements`);
    return data;
  },

  getGeoJSON: async (fileId: string): Promise<GeoJSONFeatureCollection> => {
    const { data } = await apiClient.get<GeoJSONFeatureCollection>(`/api/files/${fileId}/geojson`);
    return data;
  },

  exportFile: async (fileId: string, format: 'csv' | 'json' | 'geojson'): Promise<Blob> => {
    const { data } = await apiClient.get(`/api/files/${fileId}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return data;
  },

  deleteFile: async (fileId: string): Promise<DeleteResponse> => {
    const { data } = await apiClient.delete<DeleteResponse>(`/api/files/${fileId}`);
    return data;
  },
};

export default apiClient;
