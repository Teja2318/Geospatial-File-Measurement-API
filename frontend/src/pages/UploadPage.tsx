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
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
          Upload Geospatial Data
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Upload KML files or Shapefile ZIP packages to extract features and compute accurate measurements
        </p>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50 text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <h4 className="font-semibold">Upload Failed</h4>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {uploadResult && (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-200">
                  {uploadResult.filename} processed successfully!
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Extracted {uploadResult.feature_count ?? 0} features &bull; CRS: {uploadResult.source_crs || 'Unknown'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setUploadResult(null)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"
              >
                Upload Another
              </button>
              <button
                onClick={() => navigate(`/files/${uploadResult.id}`)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg bg-[hsl(var(--primary))] text-white hover:opacity-90 shadow-sm"
              >
                View Map & Measurements
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Drag & Drop Upload Zone */}
      <Card>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 scale-[0.99]'
              : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/60 hover:bg-[hsl(var(--muted))]/30'
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

          <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--muted))] text-[hsl(var(--primary))] flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8" />
          </div>

          <h3 className="text-base font-semibold text-[hsl(var(--foreground))]">
            Drop your file here, or{' '}
            <span className="text-[hsl(var(--primary))] underline underline-offset-4">browse</span>
          </h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 max-w-sm mx-auto">
            Supports Google Earth KML (.kml) and ESRI Shapefile Archives (.zip) up to 50 MB
          </p>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs font-medium text-[hsl(var(--muted-foreground))]">
            <span className="flex items-center gap-1">
              <FileCode className="w-4 h-4 text-blue-500" />
              .kml
            </span>
            <span className="flex items-center gap-1">
              <FileArchive className="w-4 h-4 text-amber-500" />
              .zip (Shapefile)
            </span>
          </div>
        </div>

        {/* Selected file preview */}
        {selectedFile && (
          <div className="mt-6 p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedFile.name.endsWith('.kml') ? (
                  <FileCode className="w-8 h-8 text-blue-500 shrink-0" />
                ) : (
                  <FileArchive className="w-8 h-8 text-amber-500 shrink-0" />
                )}
                <div>
                  <div className="text-sm font-semibold text-[hsl(var(--foreground))]">
                    {selectedFile.name}
                  </div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    {formatFileSize(selectedFile.size)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                disabled={uploadMutation.isPending}
                className="text-xs text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-colors"
              >
                Remove
              </button>
            </div>

            {/* Progress bar */}
            {uploadMutation.isPending && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
                  <span>Uploading & Calculating Geometries...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                  <div
                    className="h-full bg-[hsl(var(--primary))] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={uploadMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[hsl(var(--primary))] text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {uploadMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" />
                  Processing Geometries...
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  Upload & Analyze File
                </>
              )}
            </button>
          </div>
        )}
      </Card>

      {/* Guidelines and Documentation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--foreground))]">
            <Info className="w-4 h-4 text-[hsl(var(--primary))]" />
            Shapefile Archive Guidelines
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
            Shapefiles consist of multiple interdependent files bundled inside a <strong>.zip</strong> archive.
          </p>
          <ul className="text-xs space-y-1.5 text-[hsl(var(--muted-foreground))] list-disc pl-4">
            <li><strong>.shp</strong>: Shape format feature geometry (Mandatory)</li>
            <li><strong>.shx</strong>: Positional index of geometry (Mandatory)</li>
            <li><strong>.dbf</strong>: Attribute format columnar properties (Mandatory)</li>
            <li><strong>.prj</strong>: Projection coordinate system description (Recommended)</li>
          </ul>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--foreground))]">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Precise Metric Measurements
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
            All geometries are automatically converted from geographic coordinates into an optimal local projected coordinate reference system (UTM zone or equal-area projection) to compute geodesic metrics in standard SI units:
          </p>
          <ul className="text-xs space-y-1.5 text-[hsl(var(--muted-foreground))] list-disc pl-4">
            <li><strong>Polygons</strong>: Planar surface area (m², ha, km²)</li>
            <li><strong>LineStrings</strong>: Cumulative curvilinear length (m, km)</li>
            <li><strong>Points</strong>: Feature count and coordinates</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
