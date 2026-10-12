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
} from 'lucide-react';
import { useUploadFile } from '@/hooks/useApi';
import { Card, LoadingSpinner } from '@/components/ui/components';
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
      setErrorMsg(`Unsupported file extension '${ext}'. Only .kml and .zip (Shapefiles) are supported.`);
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
    <div className="p-6 md:p-10 space-y-8 max-w-4xl mx-auto">
      <div className="space-y-1">
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider inline-flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-cyan-400" />
          Ingestion Pipeline
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          Upload Geospatial Datasets
        </h1>
        <p className="text-sm text-slate-400">
          Upload Google Earth KML documents or ESRI Shapefile archives to calculate high-precision metric SI measurements
        </p>
      </div>

      {/* Error Callout */}
      {errorMsg && (
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-rose-500/30 bg-rose-950/40 text-rose-300 shadow-xl backdrop-blur-xl text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <div className="flex-1">
            <h4 className="font-bold">Validation Error</h4>
            <p className="mt-0.5 text-xs text-rose-200">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Success Notification Card */}
      {uploadResult && (
        <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">
                  {uploadResult.filename} processed successfully!
                </h3>
                <p className="text-xs text-emerald-300 mt-0.5">
                  Extracted {uploadResult.feature_count ?? 0} features &bull; Source CRS: {uploadResult.source_crs || 'WGS84'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setUploadResult(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Upload Another
              </button>
              <button
                onClick={() => navigate(`/files/${uploadResult.id}`)}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5"
              >
                Inspect Map & Features
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drag & Drop Hero Box */}
      <Card className="p-8 md:p-10 relative overflow-hidden">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
            dragOver
              ? 'border-cyan-400 bg-cyan-500/10 scale-[0.99] shadow-2xl shadow-cyan-500/20'
              : 'border-slate-800 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/60'
          }`}
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

          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500/10 via-indigo-500/20 to-purple-500/10 border border-indigo-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-cyan-500/10 group-hover:scale-105 transition-transform">
            <Upload className="w-9 h-9" />
          </div>

          <h3 className="text-lg font-bold text-white mb-1">
            Drop your dataset here, or{' '}
            <span className="text-cyan-400 underline underline-offset-4 decoration-cyan-400/50">browse files</span>
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Supports Google Earth KML (.kml) and ESRI Shapefile Archives (.zip) up to 50 MB
          </p>

          <div className="mt-6 flex items-center justify-center gap-6 text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <FileCode className="w-4 h-4 text-cyan-400" />
              .kml
            </span>
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <FileArchive className="w-4 h-4 text-amber-400" />
              .zip (Shapefile)
            </span>
          </div>
        </div>

        {/* Selected file confirmation & upload action */}
        {selectedFile && (
          <div className="mt-6 p-5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
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
                  <div className="text-xs text-slate-400 font-mono">
                    {formatFileSize(selectedFile.size)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                disabled={uploadMutation.isPending}
                className="text-xs text-slate-400 hover:text-rose-400 transition-colors font-medium px-2 py-1"
              >
                Change File
              </button>
            </div>

            {/* Progress bar */}
            {uploadMutation.isPending && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-2 text-cyan-400">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    Computing projected UTM coordinates...
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all duration-300 shadow-[0_0_12px_#38bdf8]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={uploadMutation.isPending}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {uploadMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" />
                  Processing Geometries...
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  Upload & Analyze Geometries
                </>
              )}
            </button>
          </div>
        )}
      </Card>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Info className="w-4 h-4 text-cyan-400" />
            Shapefile Archive Anatomy
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Ensure your <strong>.zip</strong> archive contains all companion files required by the ESRI specification:
          </p>
          <ul className="text-xs space-y-2 text-slate-400 list-none">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <strong>.shp</strong>: Vector geometry shape definition
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <strong>.shx</strong>: Spatial index offset records
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <strong>.dbf</strong>: dBASE table of feature attributes
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <strong>.prj</strong>: Coordinate system projection specification
            </li>
          </ul>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Geodesic Metric Precision
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Raw degrees from geographic systems (like WGS84) distort measurements. GeoMeasure automatically transforms datasets:
          </p>
          <ul className="text-xs space-y-2 text-slate-400 list-none">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <strong>Polygons</strong>: Planar surface area (m², ha, km²)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <strong>LineStrings</strong>: Exact curvilinear path length (m, km)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <strong>Automatic UTM</strong>: Optimal meridian projection per feature
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
