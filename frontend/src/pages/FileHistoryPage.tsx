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
  Card,
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
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider inline-flex items-center gap-1.5 mb-2">
            <FolderOpen className="w-3 h-3 text-cyan-400" />
            Repository Vault
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Geospatial File History
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse, inspect, export, or manage your ingested vector datasets
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 bg-slate-900/80 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh Records
        </button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-slate-900/80">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by dataset name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-700/80 bg-slate-950/80 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-inner"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Format:</span>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-200 focus:outline-none focus:border-cyan-400"
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
                className="text-xs px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="PROCESSING">Processing</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Files Table */}
      {isLoading ? (
        <div className="py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <Card className="text-center py-12 text-rose-400 border-rose-900/50 bg-rose-950/20">
          <AlertCircle className="w-10 h-10 mx-auto mb-3" />
          <p className="font-bold">Error Loading Records</p>
          <p className="text-xs text-slate-400 mt-1">{(error as Error).message}</p>
        </Card>
      ) : files.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileSpreadsheet className="w-8 h-8" />}
            title="No datasets available"
            description="Upload KML or Shapefile packages to populate the repository."
            action={
              <Link
                to="/upload"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold hover:opacity-90 shadow-lg"
              >
                Upload Dataset
              </Link>
            }
          />
        </Card>
      ) : filteredFiles.length === 0 ? (
        <Card>
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
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Reset Filters
              </button>
            }
          />
        </Card>
      ) : (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 border-b border-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Filename</th>
                  <th className="px-5 py-3.5">Format</th>
                  <th className="px-5 py-3.5">Size</th>
                  <th className="px-5 py-3.5">Features</th>
                  <th className="px-5 py-3.5">Total Area</th>
                  <th className="px-5 py-3.5">Total Length</th>
                  <th className="px-5 py-3.5">Uploaded</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredFiles.map((file) => (
                  <tr
                    key={file.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="px-5 py-4 font-medium text-slate-100">
                      <Link
                        to={`/files/${file.id}`}
                        className="hover:text-cyan-400 flex items-center gap-3 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0">
                          {file.format === 'KML' ? (
                            <FileCode className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <FileArchive className="w-4 h-4 text-amber-400" />
                          )}
                        </div>
                        <div>
                          <div className="truncate max-w-[200px] font-semibold text-sm text-slate-100 group-hover:text-cyan-300">
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
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                          file.format === 'KML'
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {file.format}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-xs font-mono">
                      {formatFileSize(file.file_size_bytes)}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-200">
                      {file.feature_count ?? '—'}
                    </td>
                    <td className="px-5 py-4 text-slate-300 text-xs font-medium">
                      {formatArea(file.total_area_sq_m, preferences.areaUnit)}
                    </td>
                    <td className="px-5 py-4 text-slate-300 text-xs font-medium">
                      {formatLength(file.total_length_m, preferences.lengthUnit)}
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-xs">
                      {formatDate(file.upload_timestamp)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={file.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
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
                            className="p-2 rounded-xl border border-slate-700/80 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-all shadow-sm"
                            title="Export CSV"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => setFileToDelete(file)}
                          className="p-2 rounded-xl border border-slate-700/80 bg-slate-800/80 text-rose-400 hover:bg-rose-950/60 hover:border-rose-800 transition-all shadow-sm"
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
