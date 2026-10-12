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
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            File History & Repository
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Browse, inspect, export, or manage all previously uploaded geospatial datasets
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[hsl(var(--border))] text-xs font-medium hover:bg-[hsl(var(--muted))] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              placeholder="Search by filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Format:</span>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] focus:outline-none"
              >
                <option value="ALL">All Formats</option>
                <option value="KML">KML</option>
                <option value="Shapefile">Shapefile</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] focus:outline-none"
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

      {/* Files Table / State */}
      {isLoading ? (
        <div className="py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <Card className="text-center py-12 text-red-500">
          <AlertCircle className="w-10 h-10 mx-auto mb-3" />
          <p className="font-semibold">Error Loading Files</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{(error as Error).message}</p>
        </Card>
      ) : files.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileSpreadsheet className="w-8 h-8" />}
            title="No files found"
            description="Upload KML or Shapefile packages to get started."
            action={
              <Link
                to="/upload"
                className="px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-white text-xs font-medium hover:opacity-90"
              >
                Upload File
              </Link>
            }
          />
        </Card>
      ) : filteredFiles.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Filter className="w-8 h-8" />}
            title="No matching files"
            description="No files match your current search and filter criteria."
            action={
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedFormat('ALL');
                  setSelectedStatus('ALL');
                }}
                className="px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] text-xs font-medium hover:bg-[hsl(var(--muted))]"
              >
                Clear Filters
              </button>
            }
          />
        </Card>
      ) : (
        <Card padding={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[hsl(var(--muted))]/50 border-b border-[hsl(var(--border))] text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Filename</th>
                  <th className="px-5 py-3.5 font-medium">Format</th>
                  <th className="px-5 py-3.5 font-medium">Size</th>
                  <th className="px-5 py-3.5 font-medium">Features</th>
                  <th className="px-5 py-3.5 font-medium">Total Area</th>
                  <th className="px-5 py-3.5 font-medium">Total Length</th>
                  <th className="px-5 py-3.5 font-medium">Uploaded Date</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {filteredFiles.map((file) => (
                  <tr
                    key={file.id}
                    className="hover:bg-[hsl(var(--muted))]/40 transition-colors"
                  >
                    <td className="px-5 py-4 font-medium text-[hsl(var(--foreground))]">
                      <Link
                        to={`/files/${file.id}`}
                        className="hover:text-[hsl(var(--primary))] flex items-center gap-2.5"
                      >
                        {file.format === 'KML' ? (
                          <FileCode className="w-4 h-4 text-blue-500 shrink-0" />
                        ) : (
                          <FileArchive className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <span className="truncate max-w-[200px]">{file.filename}</span>
                      </Link>
                      {file.error_message && (
                        <div className="text-xs text-red-500 mt-1 truncate max-w-[250px]" title={file.error_message}>
                          {file.error_message}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]">
                        {file.format}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-[hsl(var(--muted-foreground))]">
                      {formatFileSize(file.file_size_bytes)}
                    </td>
                    <td className="px-5 py-4 font-semibold">
                      {file.feature_count ?? '—'}
                    </td>
                    <td className="px-5 py-4 text-xs text-[hsl(var(--muted-foreground))]">
                      {formatArea(file.total_area_sq_m, preferences.areaUnit)}
                    </td>
                    <td className="px-5 py-4 text-xs text-[hsl(var(--muted-foreground))]">
                      {formatLength(file.total_length_m, preferences.lengthUnit)}
                    </td>
                    <td className="px-5 py-4 text-xs text-[hsl(var(--muted-foreground))]">
                      {formatDate(file.upload_timestamp)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={file.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/files/${file.id}`}
                          className="p-1.5 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] transition-colors"
                          title="View Details & Interactive Map"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {/* Export Quick Buttons */}
                        {file.status === 'COMPLETED' && (
                          <div className="relative inline-flex items-center group">
                            <button
                              onClick={() => handleExport(file, 'csv')}
                              disabled={exportingId === `${file.id}-csv`}
                              className="p-1.5 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] transition-colors"
                              title="Export CSV"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => setFileToDelete(file)}
                          className="p-1.5 rounded-lg border border-[hsl(var(--border))] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 transition-colors"
                          title="Delete Dataset"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Confirmation Dialog for Deletion */}
      <ConfirmDialog
        open={fileToDelete !== null}
        title="Delete Dataset"
        message={`Are you sure you want to delete "${fileToDelete?.filename}"? This action cannot be undone.`}
        confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setFileToDelete(null)}
      />
    </div>
  );
}
