import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Trash2,
  Layers,
  Maximize2,
  Ruler,
  MapPin,
  FileCode,
  FileArchive,
  Search,
  Info,
  Calendar,
  Globe,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useFile, useMeasurements, useGeoJSON, useDeleteFile } from '@/hooks/useApi';
import { usePreferences } from '@/hooks/usePreferences';
import { MapView } from '@/components/map/MapView';
import {
  Card,
  StatusBadge,
  ConfirmDialog,
  LoadingSpinner,
} from '@/components/ui/components';
import {
  formatArea,
  formatLength,
  formatDate,
  formatFileSize,
  downloadBlob,
} from '@/lib/utils';
import { api } from '@/lib/api-client';
import type { FeatureMeasurement } from '@/types/api';

export function FileDetailPage() {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const { preferences } = usePreferences();

  const { data: file, isLoading: isFileLoading, error: fileError } = useFile(fileId || '');
  const { data: measurementsData } = useMeasurements(fileId || '');
  const { data: geojsonData, isLoading: isGeoLoading } = useGeoJSON(fileId || '');
  const deleteMutation = useDeleteFile();

  const [selectedFeatureId, setSelectedFeatureId] = useState<number | null>(null);
  const [selectedGeomFilter, setSelectedGeomFilter] = useState<string>('ALL');
  const [featureSearch, setFeatureSearch] = useState<string>('');
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [inspectedFeature, setInspectedFeature] = useState<FeatureMeasurement | null>(null);

  const measurements = measurementsData?.measurements || [];
  const summary = measurementsData?.summary;

  // Filter features
  const filteredFeatures = useMemo(() => {
    return measurements.filter((m) => {
      const matchesGeom =
        selectedGeomFilter === 'ALL' ||
        m.geometry_type.toLowerCase().includes(selectedGeomFilter.toLowerCase());

      const query = featureSearch.toLowerCase();
      const matchesSearch =
        query === '' ||
        String(m.feature_id).includes(query) ||
        m.geometry_type.toLowerCase().includes(query) ||
        Object.values(m.properties || {}).some((v) =>
          String(v).toLowerCase().includes(query)
        );

      return matchesGeom && matchesSearch;
    });
  }, [measurements, selectedGeomFilter, featureSearch]);

  const handleExport = async (format: 'csv' | 'json' | 'geojson') => {
    if (!fileId || !file) return;
    try {
      setIsExporting(format);
      const blob = await api.exportFile(fileId, format);
      const ext = format === 'csv' ? 'csv' : format === 'json' ? 'json' : 'geojson';
      const base = file.filename.replace(/\.[^/.]+$/, '');
      downloadBlob(blob, `${base}_measurements.${ext}`);
    } catch (e) {
      alert('Export failed: ' + (e as Error).message);
    } finally {
      setIsExporting(null);
    }
  };

  const handleDelete = () => {
    if (!fileId) return;
    deleteMutation.mutate(fileId, {
      onSuccess: () => navigate('/files'),
    });
  };

  if (isFileLoading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (fileError || !file) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center space-y-4">
        <h2 className="text-xl font-bold text-red-500">File Not Found</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          The requested dataset could not be located.
        </p>
        <Link
          to="/files"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-white text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to File History
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
        <Link to="/files" className="hover:text-[hsl(var(--foreground))] transition-colors">
          File History
        </Link>
        <span>/</span>
        <span className="text-[hsl(var(--foreground))] font-medium truncate max-w-xs">
          {file.filename}
        </span>
      </div>

      {/* Header Info & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[hsl(var(--border))]">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2.5">
              {file.format === 'KML' ? (
                <FileCode className="w-7 h-7 text-blue-500 shrink-0" />
              ) : (
                <FileArchive className="w-7 h-7 text-amber-500 shrink-0" />
              )}
              <span className="truncate max-w-md md:max-w-xl">{file.filename}</span>
            </h1>
            <StatusBadge status={file.status} />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[hsl(var(--muted-foreground))] pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(file.upload_timestamp)}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              CRS: {file.source_crs || 'WGS 84 (EPSG:4326)'}
            </span>
            <span>&bull;</span>
            <span>Size: {formatFileSize(file.file_size_bytes)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {file.status === 'COMPLETED' && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleExport('csv')}
                disabled={isExporting !== null}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted))] transition-colors shadow-sm"
                title="Download CSV measurements"
              >
                <Download className="w-3.5 h-3.5" />
                CSV
              </button>
              <button
                onClick={() => handleExport('geojson')}
                disabled={isExporting !== null}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted))] transition-colors shadow-sm"
                title="Download GeoJSON features"
              >
                <Download className="w-3.5 h-3.5" />
                GeoJSON
              </button>
              <button
                onClick={() => handleExport('json')}
                disabled={isExporting !== null}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted))] transition-colors shadow-sm"
                title="Download JSON summary"
              >
                <Download className="w-3.5 h-3.5" />
                JSON
              </button>
            </div>
          )}

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg border border-red-200 dark:border-red-900 transition-colors"
            title="Delete File"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Callout if processing failed */}
      {file.error_message && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold">Processing Failed</h4>
            <p className="mt-0.5">{file.error_message}</p>
          </div>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider flex items-center justify-between">
            Features
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-[hsl(var(--foreground))] mt-2">
            {file.feature_count ?? 0}
          </div>
          <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            {summary ? `${summary.polygon_count} Poly, ${summary.line_count} Line, ${summary.point_count} Point` : '—'}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider flex items-center justify-between">
            Total Area
            <Maximize2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-[hsl(var(--foreground))] mt-2">
            {formatArea(file.total_area_sq_m, preferences.areaUnit)}
          </div>
          <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            Computed in local UTM projection
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider flex items-center justify-between">
            Total Length
            <Ruler className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-[hsl(var(--foreground))] mt-2">
            {formatLength(file.total_length_m, preferences.lengthUnit)}
          </div>
          <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            Linear geometry length
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider flex items-center justify-between">
            Success Rate
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-[hsl(var(--foreground))] mt-2">
            {summary && summary.total_features > 0
              ? `${Math.round((summary.completed_count / summary.total_features) * 100)}%`
              : '100%'}
          </div>
          <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            {summary?.completed_count ?? 0} features measured
          </div>
        </Card>
      </div>

      {/* Main Interactive Workspace: Map on top, Detailed Table on bottom */}
      <div className="space-y-6">
        {/* Map Container Card */}
        <Card padding={false} className="overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-[hsl(var(--border))] flex items-center justify-between bg-[hsl(var(--muted))]/30">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[hsl(var(--primary))]" />
              <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                Interactive Geospatial Map
              </h2>
            </div>
            {selectedFeatureId != null && (
              <button
                onClick={() => setSelectedFeatureId(null)}
                className="text-xs text-[hsl(var(--primary))] hover:underline font-medium"
              >
                Reset feature selection
              </button>
            )}
          </div>

          <div className="h-[480px] w-full">
            {isGeoLoading ? (
              <div className="h-full flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : geojsonData ? (
              <MapView
                data={geojsonData}
                selectedFeatureId={selectedFeatureId}
                onSelectFeature={(id) => setSelectedFeatureId(id)}
                areaUnit={preferences.areaUnit}
                lengthUnit={preferences.lengthUnit}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
                No geometry coordinates available to render
              </div>
            )}
          </div>
        </Card>

        {/* Measurements Feature Table Card */}
        <Card padding={false} className="overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[hsl(var(--border))] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
                Feature Measurements & Attributes
              </h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                Showing {filteredFeatures.length} of {measurements.length} features
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <input
                  type="text"
                  placeholder="Filter features or attributes..."
                  value={featureSearch}
                  onChange={(e) => setFeatureSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]"
                />
              </div>

              <select
                value={selectedGeomFilter}
                onChange={(e) => setSelectedGeomFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] focus:outline-none"
              >
                <option value="ALL">All Geometries</option>
                <option value="Polygon">Polygons</option>
                <option value="Line">Lines</option>
                <option value="Point">Points</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[460px]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                <tr>
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Area</th>
                  <th className="px-4 py-3 font-semibold">Length</th>
                  <th className="px-4 py-3 font-semibold">Perimeter</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Attributes</th>
                  <th className="px-4 py-3 font-semibold text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {filteredFeatures.map((m) => {
                  const isSelected = selectedFeatureId === m.feature_id;
                  const propKeys = Object.keys(m.properties || {});

                  return (
                    <tr
                      key={m.feature_id}
                      onClick={() => setSelectedFeatureId(isSelected ? null : m.feature_id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[hsl(var(--primary))]/10 border-l-4 border-l-[hsl(var(--primary))] font-medium'
                          : 'hover:bg-[hsl(var(--muted))]/50'
                      }`}
                    >
                      <td className="px-4 py-3 font-bold text-[hsl(var(--foreground))]">
                        {m.feature_id}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-[hsl(var(--foreground))]">
                          {m.geometry_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-blue-600 dark:text-blue-400 font-medium">
                        {formatArea(m.area_sq_m, preferences.areaUnit)}
                      </td>
                      <td className="px-4 py-3 text-amber-600 dark:text-amber-400 font-medium">
                        {formatLength(m.length_m, preferences.lengthUnit)}
                      </td>
                      <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                        {formatLength(m.perimeter_m, preferences.lengthUnit)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={m.measurement_status} />
                      </td>
                      <td className="px-4 py-3 text-[hsl(var(--muted-foreground))] max-w-[200px] truncate">
                        {propKeys.length > 0 ? (
                          <span>{propKeys.slice(0, 3).map((k) => `${k}: ${m.properties[k]}`).join(', ')}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectedFeature(m);
                          }}
                          className="p-1 rounded hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                          title="View all properties"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Property Inspection Modal */}
      {inspectedFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[hsl(var(--border))]">
              <h3 className="font-bold text-base text-[hsl(var(--foreground))]">
                Feature #{inspectedFeature.feature_id} Details
              </h3>
              <button
                onClick={() => setInspectedFeature(null)}
                className="p-1 rounded hover:bg-[hsl(var(--muted))]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-[hsl(var(--muted))]/50">
                <div>
                  <span className="text-[hsl(var(--muted-foreground))]">Geometry:</span>
                  <div className="font-semibold text-sm">{inspectedFeature.geometry_type}</div>
                </div>
                <div>
                  <span className="text-[hsl(var(--muted-foreground))]">Status:</span>
                  <div><StatusBadge status={inspectedFeature.measurement_status} /></div>
                </div>
                <div>
                  <span className="text-[hsl(var(--muted-foreground))]">Area:</span>
                  <div className="font-semibold text-blue-600">{formatArea(inspectedFeature.area_sq_m, preferences.areaUnit)}</div>
                </div>
                <div>
                  <span className="text-[hsl(var(--muted-foreground))]">Length / Perimeter:</span>
                  <div className="font-semibold text-amber-600">
                    {formatLength(inspectedFeature.length_m || inspectedFeature.perimeter_m, preferences.lengthUnit)}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-xs text-[hsl(var(--foreground))] mb-2 uppercase tracking-wider">
                  Raw Attributes & Properties
                </h4>
                {Object.keys(inspectedFeature.properties || {}).length > 0 ? (
                  <div className="border border-[hsl(var(--border))] rounded-lg divide-y divide-[hsl(var(--border))]">
                    {Object.entries(inspectedFeature.properties).map(([k, v]) => (
                      <div key={k} className="flex justify-between p-2.5">
                        <span className="font-medium text-[hsl(var(--muted-foreground))]">{k}</span>
                        <span className="font-mono text-[hsl(var(--foreground))]">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[hsl(var(--muted-foreground))] italic">No additional properties found.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectedFeature(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-[hsl(var(--primary))] text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Dataset"
        message={`Are you sure you want to delete "${file.filename}"? All calculated measurements and spatial geometries will be removed.`}
        confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        destructive
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
