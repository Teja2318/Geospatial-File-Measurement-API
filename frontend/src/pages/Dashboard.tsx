import { Link } from 'react-router-dom';
import {
  Files,
  Maximize2,
  Ruler,
  Layers,
  Upload,
  ArrowRight,
  Activity,
  AlertCircle,
  FileCode,
  FileArchive,
  Compass,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useFiles, useHealth } from '@/hooks/useApi';
import { usePreferences } from '@/hooks/usePreferences';
import { Card, StatusBadge, LoadingSpinner, EmptyState } from '@/components/ui/components';
import { formatArea, formatLength, formatFileSize, formatDateShort } from '@/lib/utils';

export function Dashboard() {
  const { data: filesData, isLoading, error } = useFiles();
  const { data: healthData, isError: isHealthError } = useHealth();
  const { preferences } = usePreferences();

  const files = filesData?.files || [];

  // Aggregated metrics
  const totalFiles = files.length;
  const completedFiles = files.filter((f) => f.status === 'COMPLETED');
  const totalFeatures = completedFiles.reduce((acc, f) => acc + (f.feature_count || 0), 0);
  const totalArea = completedFiles.reduce((acc, f) => acc + (f.total_area_sq_m || 0), 0);
  const totalLength = completedFiles.reduce((acc, f) => acc + (f.total_length_m || 0), 0);

  // Geometry distribution counts
  const geomCountMap: Record<string, number> = {
    Polygon: 0,
    LineString: 0,
    Point: 0,
  };

  files.forEach((f) => {
    (f.geometry_types || []).forEach((t) => {
      if (t.includes('Polygon')) geomCountMap.Polygon += 1;
      else if (t.includes('Line')) geomCountMap.LineString += 1;
      else if (t.includes('Point')) geomCountMap.Point += 1;
    });
  });

  const totalGeomItems = Object.values(geomCountMap).reduce((a, b) => a + b, 0);

  const geomChartData = [
    { name: 'Polygon', value: geomCountMap.Polygon, color: '#38bdf8', label: 'Polygons' },
    { name: 'LineString', value: geomCountMap.LineString, color: '#818cf8', label: 'Lines' },
    { name: 'Point', value: geomCountMap.Point, color: '#34d399', label: 'Points' },
  ].filter((d) => d.value > 0);

  // Format distribution
  const formatCounts = {
    KML: files.filter((f) => f.format === 'KML').length,
    Shapefile: files.filter((f) => f.format === 'Shapefile').length,
  };

  const formatChartData = [
    { name: 'KML', count: formatCounts.KML, fill: '#38bdf8' },
    { name: 'Shapefile', count: formatCounts.Shapefile, fill: '#818cf8' },
  ];

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Real-Time GIS Engine
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Geospatial Intelligence Platform
          </h1>
          <p className="text-sm text-slate-400">
            Automated geodesic metric extraction and boundary visualization for KML & Shapefiles
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Health Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-300 shadow-inner">
            <span
              className={`w-2 h-2 rounded-full ${
                isHealthError ? 'bg-rose-500 animate-ping' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
              }`}
            />
            <span>{isHealthError ? 'API Offline' : `API: ${healthData?.status || 'Online'}`}</span>
          </div>

          <Link
            to="/upload"
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 hover:shadow-cyan-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <Upload className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
            Upload Dataset
          </Link>
        </div>
      </div>

      {/* Metrics Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Files Processed
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Files className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {isLoading ? '...' : totalFiles}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span>Ingested Vector Datasets</span>
          </div>
        </Card>

        {/* Metric 2 */}
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Features
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {isLoading ? '...' : totalFeatures.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span>Geometries Analyzed</span>
          </div>
        </Card>

        {/* Metric 3 */}
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Surface Area
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Maximize2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {isLoading ? '...' : formatArea(totalArea, preferences.areaUnit)}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span>Projected UTM Geodesy</span>
          </div>
        </Card>

        {/* Metric 4 */}
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Length
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Ruler className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {isLoading ? '...' : formatLength(totalLength, preferences.lengthUnit)}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span>Linear Geometries & Paths</span>
          </div>
        </Card>
      </div>

      {/* Analytics Visualizations */}
      {files.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donut Chart Card */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Geometry Distribution
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {totalGeomItems} Total Layer Instances
              </span>
            </div>

            {geomChartData.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
                <div className="h-56 w-56 relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={geomChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={5}
                        cornerRadius={4}
                      >
                        {geomChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke="#0f172a"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '0.75rem',
                          color: '#f8fafc',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Centered label inside Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-white">{totalFeatures}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Features</span>
                  </div>
                </div>

                {/* Modern Legend */}
                <div className="flex-1 space-y-3 w-full">
                  {geomChartData.map((item) => {
                    const pct = totalGeomItems > 0 ? Math.round((item.value / totalGeomItems) * 100) : 0;
                    return (
                      <div
                        key={item.name}
                        className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs font-semibold text-slate-200">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-white">{item.value}</span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-xs text-slate-400">
                No geometry breakdown data available
              </div>
            )}
          </Card>

          {/* Bar Chart Card */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Format Distribution
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {files.length} Datasets Total
              </span>
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formatChartData} margin={{ top: 15, right: 20, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                    }}
                  />
                  <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* Recent Files Table Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Geospatial Files</h2>
            <p className="text-xs text-slate-400">Processed datasets and measurement status</p>
          </div>
          {files.length > 0 && (
            <Link
              to="/files"
              className="group inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View file repository
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <Card className="text-center py-8 text-rose-400 border-rose-900/50 bg-rose-950/20">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="font-semibold text-sm">Failed to retrieve files</p>
            <p className="text-xs text-slate-400 mt-1">{(error as Error).message}</p>
          </Card>
        ) : files.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Upload className="w-8 h-8" />}
              title="No geospatial files uploaded yet"
              description="Upload your first KML document or Shapefile ZIP archive to calculate measurements and render boundaries."
              action={
                <Link
                  to="/upload"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold hover:opacity-90 shadow-lg shadow-indigo-600/30"
                >
                  <Upload className="w-4 h-4" />
                  Upload First File
                </Link>
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
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {files.slice(0, 5).map((file) => (
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
                            <div className="truncate max-w-[220px] font-semibold text-sm text-slate-100 group-hover:text-cyan-300">
                              {file.filename}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {formatDateShort(file.upload_timestamp)}
                            </div>
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
                      <td className="px-5 py-4">
                        <StatusBadge status={file.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/files/${file.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-xs font-semibold text-slate-200 hover:text-white hover:bg-cyan-600 hover:border-cyan-500 transition-all shadow-sm"
                        >
                          View Map
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
