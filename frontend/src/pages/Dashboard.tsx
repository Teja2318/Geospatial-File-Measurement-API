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
import { LoadingSpinner, EmptyState } from '@/components/ui/components';
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
    { name: 'Polygon', value: geomCountMap.Polygon, color: '#38bdf8', label: 'Polygon' },
    { name: 'LineString', value: geomCountMap.LineString, color: '#f43f5e', label: 'LineString' },
    { name: 'Point', value: geomCountMap.Point, color: '#34d399', label: 'Point' },
  ].filter((d) => d.value > 0);

  // Format distribution
  const formatCounts = {
    KML: files.filter((f) => f.format === 'KML').length,
    Shapefile: files.filter((f) => f.format === 'Shapefile').length,
  };

  const formatChartData = [
    { name: 'KML', count: formatCounts.KML },
    { name: 'Shapefile', count: formatCounts.Shapefile },
  ];

  return (
    <div className="page-wrapper">
      {/* Top Header Bar */}
      <div className="page-header-row">
        <div className="page-title-group">
          <h1 className="page-main-title">
            Geospatial Intelligence Dashboard
          </h1>
          <p className="page-subtitle">
            Analyze, measure, and visualize KML and Shapefile vector geometries
          </p>
        </div>

        <div className="header-actions-group">
          {/* Health Status Indicator */}
          <div className="status-pill-healthy">
            <span
              className={`dot-indicator ${isHealthError ? 'offline' : ''}`}
            />
            <span>{isHealthError ? 'API: offline' : `API: ${healthData?.status || 'healthy'}`}</span>
          </div>

          <Link
            to="/upload"
            className="btn-upload-primary"
          >
            <Upload className="w-4 h-4" />
            Upload File
          </Link>
        </div>
      </div>

      {/* Metrics Row (4 Cards) */}
      <div className="metric-grid-4">
        {/* Metric 1: Files Processed */}
        <div className="metric-card-wrapper">
          <div className="metric-card-glow bg-blue-500" />
          <div className="metric-header">
            <span className="metric-label-title">
              Files Processed
            </span>
            <div className="metric-icon-box icon-box-blue">
              <Files className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="metric-value-number">
              {isLoading ? '...' : totalFiles}
            </div>
            <div className="metric-subtext">
              <span>Ingested Vector Datasets</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Total Features */}
        <div className="metric-card-wrapper">
          <div className="metric-card-glow bg-purple-500" />
          <div className="metric-header">
            <span className="metric-label-title">
              Total Features
            </span>
            <div className="metric-icon-box icon-box-purple">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="metric-value-number">
              {isLoading ? '...' : totalFeatures.toLocaleString()}
            </div>
            <div className="metric-subtext">
              <span>Geometries Analyzed</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Total Surface Area */}
        <div className="metric-card-wrapper">
          <div className="metric-card-glow bg-emerald-500" />
          <div className="metric-header">
            <span className="metric-label-title">
              Total Surface Area
            </span>
            <div className="metric-icon-box icon-box-emerald">
              <Maximize2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="metric-value-number">
              {isLoading ? '...' : formatArea(totalArea, preferences.areaUnit)}
            </div>
            <div className="metric-subtext">
              <span>Projected UTM Geodesy</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Total Length */}
        <div className="metric-card-wrapper">
          <div className="metric-card-glow bg-amber-500" />
          <div className="metric-header">
            <span className="metric-label-title">
              Total Length
            </span>
            <div className="metric-icon-box icon-box-amber">
              <Ruler className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="metric-value-number">
              {isLoading ? '...' : formatLength(totalLength, preferences.lengthUnit)}
            </div>
            <div className="metric-subtext">
              <span>Linear Paths & Perimeters</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Visualizations */}
      {files.length > 0 && (
        <div className="analytics-grid-2">
          {/* Geometry Breakdown Donut Chart */}
          <div className="analytics-card-container">
            <div className="analytics-card-header">
              <div className="analytics-title-group">
                <Compass className="w-4 h-4 text-cyan-400" />
                <h3 className="analytics-card-title">
                  Geometry Type Breakdown
                </h3>
              </div>
              <span className="analytics-count-pill">
                {totalGeomItems} Instances
              </span>
            </div>

            <div className="chart-content-box">
              {geomChartData.length > 0 ? (
                <div className="donut-chart-flex">
                  <div className="donut-visual-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={geomChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={78}
                          paddingAngle={4}
                          cornerRadius={4}
                        >
                          {geomChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              stroke="#0b1120"
                              strokeWidth={3}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0c1322',
                            borderColor: '#334155',
                            borderRadius: '0.75rem',
                            color: '#f8fafc',
                            fontSize: '12px',
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.6)',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="donut-center-kpi">
                      <span className="donut-kpi-value">{totalFeatures}</span>
                      <span className="donut-kpi-label">Features</span>
                    </div>
                  </div>

                  {/* Clean Legend */}
                  <div className="donut-legend-stack">
                    {geomChartData.map((item) => {
                      const pct = totalGeomItems > 0 ? Math.round((item.value / totalGeomItems) * 100) : 0;
                      return (
                        <div key={item.name} className="donut-legend-row">
                          <div className="legend-label-group">
                            <span
                              className="legend-color-dot"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="legend-name-text">{item.label}</span>
                          </div>
                          <div className="legend-value-group">
                            <span className="legend-count-num">{item.value}</span>
                            <span className="legend-percent-tag">{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center text-xs text-slate-400">
                  No geometry distribution available
                </div>
              )}
            </div>
          </div>

          {/* Format Distribution Bar Chart */}
          <div className="analytics-card-container">
            <div className="analytics-card-header">
              <div className="analytics-title-group">
                <Activity className="w-4 h-4 text-blue-400" />
                <h3 className="analytics-card-title">
                  Format Distribution
                </h3>
              </div>
              <span className="analytics-count-pill">
                {files.length} Datasets
              </span>
            </div>

            <div className="chart-content-box">
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={formatChartData} margin={{ top: 15, right: 25, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="barBlueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(56, 189, 248, 0.05)' }}
                    contentStyle={{
                      backgroundColor: '#0c1322',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.6)',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#barBlueGradient)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={52}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Recent Files Table Section */}
      <div className="mt-8">
        <div className="recent-section-header">
          <div className="recent-title-group">
            <h2>Recent Files</h2>
            <p>Processed datasets and measurement status</p>
          </div>
          {files.length > 0 && (
            <Link
              to="/files"
              className="link-view-all-files"
            >
              <span>View all files</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="geo-table-shell p-8 text-center text-rose-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-400" />
            <p className="font-semibold text-sm">Failed to retrieve files</p>
            <p className="text-xs text-slate-400 mt-1">{(error as Error).message}</p>
          </div>
        ) : files.length === 0 ? (
          <div className="geo-table-shell p-6">
            <EmptyState
              icon={<Upload className="w-8 h-8" />}
              title="No geospatial files uploaded yet"
              description="Upload your first KML document or Shapefile ZIP archive to calculate measurements and render boundaries."
              action={
                <Link
                  to="/upload"
                  className="btn-upload-primary mt-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload First File
                </Link>
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
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {files.slice(0, 5).map((file) => (
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
                            <div className="file-timestamp-sub">
                              {formatDateShort(file.upload_timestamp)}
                            </div>
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
                      <td className="text-slate-400 font-mono text-xs">
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
                      <td>
                        <span
                          className={`status-badge-custom ${
                            file.status === 'COMPLETED'
                              ? 'completed'
                              : file.status === 'PROCESSING'
                              ? 'processing'
                              : 'failed'
                          }`}
                        >
                          <span className="badge-dot" />
                          {file.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <Link
                          to={`/files/${file.id}`}
                          className="btn-table-action"
                        >
                          <span>View Map</span>
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
