import { describe, it, expect } from 'vitest';
import {
  convertArea,
  convertLength,
  formatArea,
  formatLength,
  formatFileSize,
  statusColor,
  geometryTypeColor,
} from '@/lib/utils';

describe('Unit Conversion Utilities', () => {
  it('converts area correctly between units', () => {
    // 10,000 sq m = 1 hectare
    expect(convertArea(10000, 'hectares')).toBe(1);
    // 1,000,000 sq m = 1 sq km
    expect(convertArea(1000000, 'sq_km')).toBe(1);
    // identity for sq_m
    expect(convertArea(500, 'sq_m')).toBe(500);
  });

  it('converts length correctly between units', () => {
    // 1000 m = 1 km
    expect(convertLength(1000, 'km')).toBe(1);
    expect(convertLength(2500, 'km')).toBe(2.5);
    // identity for m
    expect(convertLength(750, 'm')).toBe(750);
  });

  it('formats area strings properly', () => {
    expect(formatArea(null, 'sq_m')).toBe('—');
    expect(formatArea(undefined, 'sq_m')).toBe('—');
    expect(formatArea(500, 'sq_m')).toBe('500.00 m²');
    expect(formatArea(10000, 'hectares')).toBe('1.00 ha');
    expect(formatArea(1000000, 'sq_km')).toBe('1.00 km²');
  });

  it('formats length strings properly', () => {
    expect(formatLength(null, 'm')).toBe('—');
    expect(formatLength(undefined, 'km')).toBe('—');
    expect(formatLength(150, 'm')).toBe('150.00 m');
    expect(formatLength(5000, 'km')).toBe('5.00 km');
  });

  it('formats file sizes accurately', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1048576)).toBe('1 MB');
  });

  it('maps status to correct styling classes', () => {
    expect(statusColor('COMPLETED')).toContain('green');
    expect(statusColor('FAILED')).toContain('red');
    expect(statusColor('PROCESSING')).toContain('blue');
  });

  it('maps geometry types to proper theme colors', () => {
    expect(geometryTypeColor('Polygon')).toBe('#3b82f6');
    expect(geometryTypeColor('LineString')).toBe('#ef4444');
    expect(geometryTypeColor('Point')).toBe('#22c55e');
  });
});
