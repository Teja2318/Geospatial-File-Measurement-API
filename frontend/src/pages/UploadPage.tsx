import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  FileCode,
  FileArchive,
  ArrowRight,
  Info,
  Sparkles,
  Zap,
  Compass,
} from 'lucide-react';
import { useUploadFile } from '@/hooks/useApi';
import { LoadingSpinner } from '@/components/ui/components';
import { formatFileSize } from '@/lib/utils';
import type { FileUploadResponse } from '@/types/api';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<FileUploadResponse | null>(null);

  const uploadMutation = useUploadFile();

  const handleSelectFile = (file: File) => {
    setErrorMsg(null);
    setUploadResult(null);

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (ext !== '.kml' && ext !== '.zip') {
      setErrorMsg(`Unsupported file format '${ext}'. Only .kml and .zip (Shapefiles) are supported.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg(`File size (${formatFileSize(file.size)}) exceeds the maximum allowed limit of 50 MB.`);
      return;
    }

    if (file.size === 0) {
      setErrorMsg('Selected file is empty.');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setErrorMsg(null);
    setProgress(0);

    uploadMutation.mutate(
      {
        file: selectedFile,
        onProgress: (p) => setProgress(p),
      },
      {
        onSuccess: (data) => {
          setUploadResult(data);
          setSelectedFile(null);
          setProgress(100);
        },
        onError: (err: any) => {
          setErrorMsg(err.message || 'Failed to upload and process geospatial file.');
        },
      }
    );
  };

  return (
    <div className="page-wrapper">
      <div className="upload-page-container">
        {/* Page Header */}
        <div className="page-header-row mb-2">
          <div className="page-title-group">
            <span className="page-badge-tag">
              <Zap className="w-3 h-3" />
              Ingestion Pipeline
            </span>
            <h1 className="page-main-title">
              Upload Geospatial Datasets
            </h1>
            <p className="page-subtitle">
              Upload Google Earth KML documents or ESRI Shapefile archives to calculate high-precision metric SI measurements
            </p>
          </div>
        </div>

        {/* Validation Error Alert */}
        {errorMsg && (
          <div className="flex items-start gap-3 p-4 rounded-2xl border border-rose-500/30 bg-rose-950/40 text-rose-300 shadow-xl backdrop-blur-xl text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <div className="flex-1">
              <h4 className="font-bold text-rose-200">Validation Error</h4>
              <p className="mt-0.5 text-xs text-rose-300/90">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Success Banner */}
        {uploadResult && (
          <div className="p-6 rounded-2xl border border-emerald-500/40 bg-emerald-950/40 backdrop-blur-xl shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {uploadResult.filename} processed successfully!
                  </h3>
                  <p className="text-xs text-emerald-300/90 mt-0.5">
                    Extracted {uploadResult.feature_count ?? 0} features &bull; Source CRS: {uploadResult.source_crs || 'WGS84'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setUploadResult(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Upload Another
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/files/${uploadResult.id}`)}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  Inspect Map & Features
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hero Dropzone Card */}
        <div className="upload-hero-card">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`upload-dropzone-inner ${dragOver ? 'is-dragover' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".kml,.zip"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleSelectFile(e.target.files[0]);
                }
              }}
            />

            <div className="upload-icon-circle">
              <Upload className="w-9 h-9" />
            </div>

            <h3 className="upload-headline">
              Drop your dataset here, or{' '}
              <span className="text-cyan-400 underline underline-offset-4 decoration-cyan-400/50">
                browse files
              </span>
            </h3>

            <p className="upload-subheadline">
              Supports Google Earth KML (.kml) and ESRI Shapefile Archives (.zip) up to 50 MB
            </p>

            <div className="format-tags-row">
              <span className="format-pill-tag">
                <FileCode className="w-4 h-4 text-cyan-400" />
                .kml (Keyhole Markup)
              </span>
              <span className="format-pill-tag">
                <FileArchive className="w-4 h-4 text-amber-400" />
                .zip (Shapefile Archive)
              </span>
            </div>
          </div>

          {/* Selected File Confirmation & Action */}
          {selectedFile && (
            <div className="selected-file-banner">
              <div className="selected-file-details">
                <div className="selected-file-info-group">
                  <div className="file-format-avatar">
                    {selectedFile.name.endsWith('.kml') ? (
                      <FileCode className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <FileArchive className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      {selectedFile.name}
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {formatFileSize(selectedFile.size)}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  disabled={uploadMutation.isPending}
                  className="text-xs text-slate-400 hover:text-rose-400 transition-colors font-medium px-3 py-1.5 rounded-lg border border-slate-800 hover:border-rose-900/60"
                >
                  Change File
                </button>
              </div>

              {/* Progress Bar while Uploading */}
              {uploadMutation.isPending && (
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-2 text-cyan-400">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      Computing projected UTM coordinates...
                    </span>
                    <span className="font-mono">{progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all duration-300 shadow-[0_0_12px_#38bdf8]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={uploadMutation.isPending}
                className="btn-upload-submit"
              >
                {uploadMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Processing Geometries...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Upload & Analyze Geometries</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Informational Guidance Cards (Balanced 3-Column Grid) */}
        <div className="info-cards-grid">
          {/* Card 1: Shapefile Archive Anatomy */}
          <div className="info-feature-card">
            <div className="info-card-header">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Shapefile Archive Anatomy</span>
            </div>
            <p className="info-card-desc">
              Ensure your <strong>.zip</strong> archive contains all mandatory companion files defined by ESRI:
            </p>
            <ul className="info-list-stack">
              <li className="info-list-item">
                <span className="item-bullet-dot bullet-cyan" />
                <span><strong>.shp</strong>: Vector feature geometries & coordinates</span>
              </li>
              <li className="info-list-item">
                <span className="item-bullet-dot bullet-cyan" />
                <span><strong>.shx</strong>: Spatial index offset positional records</span>
              </li>
              <li className="info-list-item">
                <span className="item-bullet-dot bullet-cyan" />
                <span><strong>.dbf</strong>: dBASE table of tabular feature attributes</span>
              </li>
              <li className="info-list-item">
                <span className="item-bullet-dot bullet-cyan" />
                <span><strong>.prj</strong>: Coordinate reference system (CRS) definition</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Geodesic Metric Precision */}
          <div className="info-feature-card">
            <div className="info-card-header">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Geodesic Metric Precision</span>
            </div>
            <p className="info-card-desc">
              Raw geographic degrees (like WGS84) distort measurements. GeoMeasure automatically projects features:
            </p>
            <ul className="info-list-stack">
              <li className="info-list-item">
                <span className="item-bullet-dot bullet-emerald" />
                <span><strong>Polygons</strong>: Planar surface area (m², ha, km²)</span>
              </li>
              <li className="info-list-item">
                <span className="item-bullet-dot bullet-emerald" />
                <span><strong>LineStrings</strong>: Curvilinear path length (m, km)</span>
              </li>
              <li className="info-list-item">
                <span className="item-bullet-dot bullet-emerald" />
                <span><strong>Optimal UTM</strong>: Auto meridian zone selection per geometry</span>
              </li>
              <li className="info-list-item">
                <span className="item-bullet-dot bullet-emerald" />
                <span><strong>Sub-meter accuracy</strong>: Calibrated ellipsoid geodesy</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Ingestion Pipeline & Architecture */}
          <div className="info-feature-card">
            <div className="info-card-header">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Ingestion Pipeline Architecture</span>
            </div>
            <p className="info-card-desc">
              Robust validation and fast in-memory execution pipeline built for GIS engineers:
            </p>
            <ul className="info-list-stack">
              <li className="info-list-item">
                <span className="item-bullet-dot bullet-indigo" />
                <span><strong>Zero Disk Spills</strong>: Secure in-memory stream processing</span>
              </li>
              <li className="info-list-item">
                <span className="item-bullet-dot bullet-indigo" />
                <span><strong>PROJ 9 / GDAL</strong>: Industry-standard GIS computation backend</span>
              </li>
              <li className="info-list-item">
                <span className="item-bullet-dot bullet-indigo" />
                <span><strong>Multi-Format Exports</strong>: Download CSV, GeoJSON, and JSON</span>
              </li>
              <li className="info-list-item">
                <span className="item-bullet-dot bullet-indigo" />
                <span><strong>Interactive Inspection</strong>: Live vector canvas mapping</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
