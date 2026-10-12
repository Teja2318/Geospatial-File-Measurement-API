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
        <h2 className="text-xl font-bold text-rose-400">Dataset Not Located</h2>
        <p className="text-sm text-slate-400">
          The requested geospatial file could not be found in storage.
        </p>
        <Link
          to="/files"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to File History
        </Link>
      </div>
    );
  }

  return (
    <div className="page-wrapper space-y-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link to="/files" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          File Repository
        </Link>
        <span>/</span>
        <span className="text-slate-200 font-semibold truncate max-w-xs">
          {file.filename}
        </span>
      </div>

      {/* Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-4 border-b border-slate-800/80">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center shrink-0">
              {file.format === 'KML' ? (
                <FileCode className="w-5 h-5 text-cyan-400" />
              ) : (
                <FileArchive className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white truncate max-w-md md:max-w-xl">
              {file.filename}
            </h1>
            <StatusBadge status={file.status} />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatDate(file.upload_timestamp)}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              Source CRS: <strong className="text-slate-300 font-mono">{file.source_crs || 'EPSG:4326'}</strong>
            </span>
            <span>&bull;</span>
            <span>Size: {formatFileSize(file.file_size_bytes)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {file.status === 'COMPLETED' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport('csv')}
                disabled={isExporting !== null}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-900/80 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors shadow-sm"
                title="Download CSV"
              >
                <Download className="w-3.5 h-3.5" />
                CSV
              </button>
              <button
                onClick={() => handleExport('geojson')}
                disabled={isExporting !== null}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-900/80 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors shadow-sm"
                title="Download GeoJSON"
              >
                <Download className="w-3.5 h-3.5" />
                GeoJSON
              </button>
              <button
                onClick={() => handleExport('json')}
                disabled={isExporting !== null}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-900/80 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors shadow-sm"
                title="Download JSON"
              >
                <Download className="w-3.5 h-3.5" />
                JSON
              </button>
            </div>
          )}

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2.5 text-rose-400 hover:text-rose-300 bg-slate-900/80 hover:bg-rose-950/60 rounded-xl border border-slate-700/80 hover:border-rose-800 transition-colors"
            title="Delete File"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Callout */}
      {file.error_message && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-950/30 text-rose-300 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <div>
            <h4 className="font-bold">Processing Interrupted</h4>
            <p className="mt-0.5 text-xs text-rose-200">{file.error_message}</p>
          </div>
        </div>
      )}

      {/* Metric Stat Cards */}
      <div className="metric-grid-4">
        <div className="metric-card-wrapper">
          <div className="metric-header">
            <span className="metric-label-title">
              Features
            </span>
            <div className="metric-icon-box icon-box-purple">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="metric-value-number">
              {file.feature_count ?? 0}
            </div>
            <div className="metric-subtext truncate">
              {summary ? `${summary.polygon_count} Poly, ${summary.line_count} Line, ${summary.point_count} Point` : 'Geometries Analyzed'}
            </div>
          </div>
        </div>

        <div className="metric-card-wrapper">
          <div className="metric-header">
            <span className="metric-label-title">
              Total Surface Area
            </span>
            <div className="metric-icon-box icon-box-emerald">
              <Maximize2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="metric-value-number text-cyan-400">
              {formatArea(file.total_area_sq_m, preferences.areaUnit)}
            </div>
            <div className="metric-subtext">
              <span>Local UTM Projected SI</span>
            </div>
          </div>
        </div>

        <div className="metric-card-wrapper">
          <div className="metric-header">
            <span className="metric-label-title">
              Total Length
            </span>
            <div className="metric-icon-box icon-box-amber">
              <Ruler className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="metric-value-number text-amber-400">
              {formatLength(file.total_length_m, preferences.lengthUnit)}
            </div>
            <div className="metric-subtext">
              <span>Curvilinear Geodesic Path</span>
            </div>
          </div>
        </div>

        <div className="metric-card-wrapper">
          <div className="metric-header">
            <span className="metric-label-title">
              Measurement Success
            </span>
            <div className="metric-icon-box icon-box-emerald">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="metric-value-number text-emerald-400">
              {summary && summary.total_features > 0
                ? `${Math.round((summary.completed_count / summary.total_features) * 100)}%`
                : '100%'}
            </div>
            <div className="metric-subtext">
              <span>{summary?.completed_count ?? 0} features measured</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Map & Table */}
      <div className="space-y-6">
        {/* Map View */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white tracking-wide">
                Interactive Geospatial Viewer
              </h2>
            </div>
            {selectedFeatureId != null && (
              <button
                onClick={() => setSelectedFeatureId(null)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/20"
              >
                Clear Selection (#{selectedFeatureId})
              </button>
            )}
          </div>

          <div className="h-[500px] w-full">
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
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No geometry coordinates to render
              </div>
            )}
          </div>
        </div>

        {/* Feature Measurements Table */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/60">
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Feature Attributes & Metric Measurements
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Showing {filteredFeatures.length} of {measurements.length} features
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter feature attributes..."
                  value={featureSearch}
                  onChange={(e) => setFeatureSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 w-56 md:w-64"
                />
              </div>

              <select
                value={selectedGeomFilter}
                onChange={(e) => setSelectedGeomFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-200 focus:outline-none focus:border-cyan-400"
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
              <thead className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Geometry</th>
                  <th className="px-5 py-3">Area</th>
                  <th className="px-5 py-3">Length</th>
                  <th className="px-5 py-3">Perimeter</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Attributes Preview</th>
                  <th className="px-5 py-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredFeatures.map((m) => {
                  const isSelected = selectedFeatureId === m.feature_id;
                  const propKeys = Object.keys(m.properties || {});

                  return (
                    <tr
                      key={m.feature_id}
                      onClick={() => setSelectedFeatureId(isSelected ? null : m.feature_id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-cyan-500/15 border-l-4 border-l-cyan-400'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="px-5 py-3.5 font-bold text-white">
                        #{m.feature_id}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            m.geometry_type.includes('Polygon')
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              : m.geometry_type.includes('Line')
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {m.geometry_type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-cyan-400 font-semibold font-mono">
                        {formatArea(m.area_sq_m, preferences.areaUnit)}
                      </td>
                      <td className="px-5 py-3.5 text-rose-400 font-semibold font-mono">
                        {formatLength(m.length_m, preferences.lengthUnit)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-300 font-mono">
                        {formatLength(m.perimeter_m, preferences.lengthUnit)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={m.measurement_status} />
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 max-w-[220px] truncate">
                        {propKeys.length > 0 ? (
                          <span>{propKeys.slice(0, 3).map((k) => `${k}: ${m.properties[k]}`).join(', ')}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectedFeature(m);
                          }}
                          className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700"
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
        </div>
      </div>

      {/* Property Inspection Drawer/Modal */}
      {inspectedFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setInspectedFeature(null)} />
          <div className="relative bg-slate-900/95 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl backdrop-blur-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-base text-white">
                Feature #{inspectedFeature.feature_id} Attributes
              </h3>
              <button
                onClick={() => setInspectedFeature(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div>
                  <span className="text-slate-400">Geometry Type:</span>
                  <div className="font-bold text-sm text-white mt-0.5">{inspectedFeature.geometry_type}</div>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <div className="mt-0.5"><StatusBadge status={inspectedFeature.measurement_status} /></div>
                </div>
                <div>
                  <span className="text-slate-400">Calculated Area:</span>
                  <div className="font-bold text-sm text-cyan-400 mt-0.5">
                    {formatArea(inspectedFeature.area_sq_m, preferences.areaUnit)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Length / Perimeter:</span>
                  <div className="font-bold text-sm text-amber-400 mt-0.5">
                    {formatLength(inspectedFeature.length_m || inspectedFeature.perimeter_m, preferences.lengthUnit)}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs text-slate-300 mb-2 uppercase tracking-wider">
                  Raw Key-Value Attributes
                </h4>
                {Object.keys(inspectedFeature.properties || {}).length > 0 ? (
                  <div className="border border-slate-800 rounded-xl divide-y divide-slate-800 bg-slate-950/60 overflow-hidden">
                    {Object.entries(inspectedFeature.properties).map(([k, v]) => (
                      <div key={k} className="flex justify-between p-3">
                        <span className="font-medium text-slate-400">{k}</span>
                        <span className="font-mono text-slate-200 font-semibold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No additional properties encoded in geometry.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectedFeature(null)}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-white hover:bg-slate-700"
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
        confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete Dataset'}
        destructive
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
