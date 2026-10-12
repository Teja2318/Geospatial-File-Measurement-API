import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

// Query keys
export const queryKeys = {
  files: ['files'] as const,
  file: (id: string) => ['file', id] as const,
  measurements: (id: string) => ['measurements', id] as const,
  geojson: (id: string) => ['geojson', id] as const,
  health: ['health'] as const,
};

export function useFiles() {
  return useQuery({
    queryKey: queryKeys.files,
    queryFn: api.listFiles,
    staleTime: 30000,
  });
}

export function useFile(fileId: string) {
  return useQuery({
    queryKey: queryKeys.file(fileId),
    queryFn: () => api.getFile(fileId),
    enabled: !!fileId,
  });
}

export function useMeasurements(fileId: string) {
  return useQuery({
    queryKey: queryKeys.measurements(fileId),
    queryFn: () => api.getMeasurements(fileId),
    enabled: !!fileId,
  });
}

export function useGeoJSON(fileId: string) {
  return useQuery({
    queryKey: queryKeys.geojson(fileId),
    queryFn: () => api.getGeoJSON(fileId),
    enabled: !!fileId,
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (p: number) => void }) =>
      api.uploadFile(file, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fileId: string) => api.deleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files });
    },
  });
}

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: api.health,
    staleTime: 60000,
    retry: 1,
  });
}
