import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AreaUnit, LengthUnit, UserPreferences } from '@/types/api';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Unit conversion
export function convertArea(sqMeters: number, unit: AreaUnit): number {
  switch (unit) {
    case 'hectares': return sqMeters / 10000;
    case 'sq_km': return sqMeters / 1000000;
    case 'sq_m':
    default: return sqMeters;
  }
}

export function convertLength(meters: number, unit: LengthUnit): number {
  switch (unit) {
    case 'km': return meters / 1000;
    case 'm':
    default: return meters;
  }
}

export function formatArea(sqMeters: number | null | undefined, unit: AreaUnit): string {
  if (sqMeters == null) return '—';
  const value = convertArea(sqMeters, unit);
  const unitLabel = areaUnitLabel(unit);
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M ${unitLabel}`;
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K ${unitLabel}`;
  return `${value.toFixed(2)} ${unitLabel}`;
}

export function formatLength(meters: number | null | undefined, unit: LengthUnit): string {
  if (meters == null) return '—';
  const value = convertLength(meters, unit);
  const unitLabel = lengthUnitLabel(unit);
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M ${unitLabel}`;
  if (value >= 1000) return `${(value / 1000).toFixed(2)}K ${unitLabel}`;
  return `${value.toFixed(2)} ${unitLabel}`;
}

export function areaUnitLabel(unit: AreaUnit): string {
  switch (unit) {
    case 'hectares': return 'ha';
    case 'sq_km': return 'km²';
    case 'sq_m':
    default: return 'm²';
  }
}

export function lengthUnitLabel(unit: LengthUnit): string {
  switch (unit) {
    case 'km': return 'km';
    case 'm':
    default: return 'm';
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// Preferences persistence
const PREFS_KEY = 'geomeasure_preferences';

export const defaultPreferences: UserPreferences = {
  theme: 'system',
  areaUnit: 'sq_m',
  lengthUnit: 'm',
  defaultMapLayers: true,
};

export function loadPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) };
    }
  } catch {
    // ignore
  }
  return defaultPreferences;
}

export function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

// Status color mapping
export function statusColor(status: string): string {
  switch (status) {
    case 'COMPLETED': return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950';
    case 'PROCESSING': return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950';
    case 'PENDING': return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950';
    case 'FAILED': return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950';
    case 'NOT_REQUIRED': return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900';
    case 'UNSUPPORTED': return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950';
    case 'INVALID_GEOMETRY': return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950';
    default: return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900';
  }
}

export function geometryTypeColor(type: string): string {
  switch (type) {
    case 'Polygon':
    case 'MultiPolygon': return '#3b82f6';
    case 'LineString':
    case 'MultiLineString': return '#ef4444';
    case 'Point':
    case 'MultiPoint': return '#22c55e';
    default: return '#6b7280';
  }
}
