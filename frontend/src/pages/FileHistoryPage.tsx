import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Trash2,
  Download,
  Eye,
  FileCode,
  FileArchive,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  FolderOpen,
} from 'lucide-react';
import { useFiles, useDeleteFile } from '@/hooks/useApi';
import { usePreferences } from '@/hooks/usePreferences';
import {
  StatusBadge,
  ConfirmDialog,
  LoadingSpinner,
  EmptyState,
} from '@/components/ui/components';
import {
  formatArea,
  formatLength,
  formatFileSize,
  formatDate,
  downloadBlob,
} from '@/lib/utils';
import { api } from '@/lib/api-client';
import type { FileInfo } from '@/types/api';

export function FileHistoryPage() {
  const { data, isLoading, error, refetch, isRefetching } = useFiles();
  const deleteMutation = useDeleteFile();
  const { preferences } = usePreferences();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [fileToDelete, setFileToDelete] = useState<FileInfo | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const files = data?.files || [];

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchesSearch = f.filename.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFormat = selectedFormat === 'ALL' || f.format === selectedFormat;
      const matchesStatus = selectedStatus === 'ALL' || f.status === selectedStatus;
      return matchesSearch && matchesFormat && matchesStatus;
    });
  }, [files, searchQuery, selectedFormat, selectedStatus]);

  const handleExport = async (file: FileInfo, format: 'csv' | 'json' | 'geojson') => {
    try {
      setExportingId(`${file.id}-${format}`);
      const blob = await api.exportFile(file.id, format);
      const ext = format === 'csv' ? 'csv' : format === 'json' ? 'json' : 'geojson';
      const base = file.filename.replace(/\.[^/.]+$/, '');
      downloadBlob(blob, `${base}_measurements.${ext}`);
    } catch (e) {
      console.error('Export failed:', e);
      alert('Failed to export file: ' + (e as Error).message);
    } finally {
      setExportingId(null);
    }
  };

  const confirmDelete = () => {
    if (!fileToDelete) return;
    deleteMutation.mutate(fileToDelete.id, {
      onSuccess: () => setFileToDelete(null),
    });
  };

  return (
    <div className="page-wrapper space-y-6">
      {/* Header */}
      <div className="page-header-row mb-0">
        <div className="page-title-group">
          <span className="page-badge-tag">
            <FolderOpen className="w-3 h-3" />
            Repository Vault
          </span>
          <h1 className="page-main-title">
            Geospatial File History
          </h1>
          <p className="page-subtitle">
            Browse, inspect, export, or manage your ingested vector datasets
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700/80 bg-slate-900/80 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh Records
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-search-box">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="search-input-wrapper md:w-80">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search by dataset name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input-custom"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Format:</span>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="form-select-custom"
              >
                <option value="ALL">All Formats</option>
                <option value="KML">KML</option>
                <option value="Shapefile">Shapefile</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="form-select-custom"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="PROCESSING">Processing</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Files Table */}
      {isLoading ? (
        <div className="py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="geo-table-shell p-12 text-center text-rose-400">
          <AlertCircle className="w-10 h-10 mx-auto mb-3" />
          <p className="font-bold">Error Loading Records</p>
          <p className="text-xs text-slate-400 mt-1">{(error as Error).message}</p>
        </div>
      ) : files.length === 0 ? (
        <div className="geo-table-shell p-8">
          <EmptyState
            icon={<FileSpreadsheet className="w-8 h-8" />}
            title="No datasets available"
            description="Upload KML or Shapefile packages to populate the repository."
            action={
              <Link
                to="/upload"
                className="btn-upload-primary mt-2"
              >
                Upload Dataset
              </Link>
            }
          />
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="geo-table-shell p-8">
          <EmptyState
            icon={<Filter className="w-8 h-8" />}
            title="No matching records"
            description="No files match your current search and filter selections."
            action={
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedFormat('ALL');
                  setSelectedStatus('ALL');
                }}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer mt-2"
              >
                Reset Filters
              </button>
            }
          />
        </div>
      ) : (
        <div className="geo-table-shell">
          <div className="table-responsive-wrapper">
            <table className="geo-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Format</th>
                  <th>Size</th>
                  <th>Features</th>
                  <th>Total Area</th>
                  <th>Total Length</th>
                  <th>Uploaded</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.id}>
                    <td>
                      <Link
                        to={`/files/${file.id}`}
                        className="file-cell-group"
                      >
                        <div className="file-format-avatar">
                          {file.format === 'KML' ? (
                            <FileCode className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <FileArchive className="w-4 h-4 text-amber-400" />
                          )}
                        </div>
                        <div>
                          <div className="file-name-title">
                            {file.filename}
                          </div>
                          {file.error_message && (
                            <div className="text-[11px] text-rose-400 truncate max-w-[220px]">
                              {file.error_message}
                            </div>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td>
                      <span
                        className={`format-pill ${
                          file.format === 'KML' ? 'format-pill-kml' : 'format-pill-shapefile'
                        }`}
                      >
                        {file.format}
                      </span>
                    </td>
                    <td className="text-slate-400 text-xs font-mono">
                      {formatFileSize(file.file_size_bytes)}
                    </td>
                    <td className="font-bold text-white">
                      {file.feature_count ?? '—'}
                    </td>
                    <td className="text-slate-300 text-xs font-semibold">
                      {formatArea(file.total_area_sq_m, preferences.areaUnit)}
                    </td>
                    <td className="text-slate-300 text-xs font-semibold">
                      {formatLength(file.total_length_m, preferences.lengthUnit)}
                    </td>
                    <td className="text-slate-400 text-xs">
                      {formatDate(file.upload_timestamp)}
                    </td>
                    <td>
                      <StatusBadge status={file.status} />
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/files/${file.id}`}
                          className="p-2 rounded-xl border border-slate-700/80 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-cyan-600 hover:border-cyan-500 transition-all shadow-sm"
                          title="View Details & Interactive Map"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        {file.status === 'COMPLETED' && (
                          <button
                            onClick={() => handleExport(file, 'csv')}
                            disabled={exportingId === `${file.id}-csv`}
                            className="p-2 rounded-xl border border-slate-700/80 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-all shadow-sm cursor-pointer"
                            title="Export CSV"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => setFileToDelete(file)}
                          className="p-2 rounded-xl border border-slate-700/80 bg-slate-800/80 text-rose-400 hover:bg-rose-950/60 hover:border-rose-800 transition-all shadow-sm cursor-pointer"
                          title="Delete Dataset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={fileToDelete !== null}
        title="Delete Dataset"
        message={`Are you sure you want to delete "${fileToDelete?.filename}"? This action permanently removes stored geometries and measurements.`}
        confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete Dataset'}
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setFileToDelete(null)}
      />
    </div>
  );
}
