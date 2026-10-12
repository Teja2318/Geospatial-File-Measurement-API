import { useState } from 'react';
import {
  Maximize2,
  Moon,
  Sun,
  Laptop,
  Server,
  Check,
  Sliders,
} from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';
import { useHealth } from '@/hooks/useApi';
import type { AreaUnit, LengthUnit } from '@/types/api';

export function SettingsPage() {
  const { preferences, setPreferences } = usePreferences();
  const { data: health, isLoading: isHealthLoading } = useHealth();
  const [savedAlert, setSavedAlert] = useState(false);

  const showSaved = () => {
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2500);
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setPreferences({ theme });
    showSaved();
  };

  const handleAreaUnitChange = (areaUnit: AreaUnit) => {
    setPreferences({ areaUnit });
    showSaved();
  };

  const handleLengthUnitChange = (lengthUnit: LengthUnit) => {
    setPreferences({ lengthUnit });
    showSaved();
  };

  return (
    <div className="page-wrapper max-w-5xl space-y-8">
      {/* Page Header */}
      <div className="page-header-row mb-0">
        <div className="page-title-group">
          <span className="page-badge-tag">
            <Sliders className="w-3 h-3" />
            Display Configuration
          </span>
          <h1 className="page-main-title">
            Preferences & Settings
          </h1>
          <p className="page-subtitle">
            Customize display units, color schemes, and inspect backend geospatial service parameters
          </p>
        </div>

        {savedAlert && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold animate-fade shadow-lg shadow-emerald-500/20">
            <Check className="w-4 h-4" />
            Preferences Saved
          </div>
        )}
      </div>

      {/* Unit Preferences Card */}
      <div className="analytics-card-container space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Maximize2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Measurement Metric Units
            </h2>
            <p className="text-xs text-slate-400">
              Select preferred default units for planar area and curvilinear path lengths
            </p>
          </div>
        </div>

        {/* Area Units */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Preferred Planar Area Unit
          </label>
          <div className="settings-options-grid settings-options-grid-3">
            {[
              { id: 'sq_m', label: 'Square Meters', unit: 'm²', desc: 'Standard SI metric unit' },
              { id: 'hectares', label: 'Hectares', unit: 'ha', desc: '1 ha = 10,000 m²' },
              { id: 'sq_km', label: 'Square Kilometers', unit: 'km²', desc: '1 km² = 1,000,000 m²' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleAreaUnitChange(option.id as AreaUnit)}
                className={`setting-option-btn ${preferences.areaUnit === option.id ? 'active' : ''}`}
              >
                <div className="setting-option-header">
                  <span className="setting-option-title">
                    {option.label}
                  </span>
                  <span className="setting-option-badge">
                    {option.unit}
                  </span>
                </div>
                <p className="setting-option-desc">{option.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Length Units */}
        <div className="space-y-3 pt-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Preferred Path Length & Perimeter Unit
          </label>
          <div className="settings-options-grid settings-options-grid-2">
            {[
              { id: 'm', label: 'Meters', unit: 'm', desc: 'Standard metric length' },
              { id: 'km', label: 'Kilometers', unit: 'km', desc: '1 km = 1,000 meters' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleLengthUnitChange(option.id as LengthUnit)}
                className={`setting-option-btn ${preferences.lengthUnit === option.id ? 'active' : ''}`}
              >
                <div className="setting-option-header">
                  <span className="setting-option-title">
                    {option.label}
                  </span>
                  <span className="setting-option-badge amber">
                    {option.unit}
                  </span>
                </div>
                <p className="setting-option-desc">{option.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Theme Modes */}
      <div className="analytics-card-container space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Interface Theme
            </h2>
            <p className="text-xs text-slate-400">
              High-contrast dark obsidian canvas optimized for GIS spatial clarity
            </p>
          </div>
        </div>

        <div className="settings-options-grid settings-options-grid-3">
          {[
            { id: 'system', label: 'System Automatic', icon: Laptop },
            { id: 'dark', label: 'Dark Obsidian', icon: Moon },
            { id: 'light', label: 'Light Mode', icon: Sun },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleThemeChange(item.id as 'light' | 'dark' | 'system')}
              className={`p-4 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                preferences.theme === item.id
                  ? 'border-indigo-500 bg-indigo-500/20 shadow-lg shadow-indigo-500/15 ring-1 ring-indigo-500/50'
                  : 'border-slate-800 bg-slate-950/70 hover:bg-slate-900/90 hover:border-slate-700'
              }`}
            >
              <item.icon className="w-5 h-5 text-indigo-400" />
              <span className="text-sm font-semibold text-white">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* System Diagnostics */}
      <div className="analytics-card-container space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              System Service Diagnostics
            </h2>
            <p className="text-xs text-slate-400">
              Live FastAPI backend connectivity and runtime parameters
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
            <span className="text-slate-400">Backend Service Engine:</span>
            <div className="font-bold text-sm flex items-center gap-2 text-white">
              <span className={`w-2.5 h-2.5 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'}`} />
              {isHealthLoading ? 'Connecting...' : `${health?.service || 'GeoMeasure API'} (${health?.status || 'Online'})`}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
            <span className="text-slate-400">API Gateway URL:</span>
            <div className="font-mono font-bold text-sm text-cyan-400">
              {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
            <span className="text-slate-400">Supported Formats:</span>
            <div className="font-bold text-sm text-white">
              KML (.kml), ESRI Shapefile (.zip)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
            <span className="text-slate-400">Upload Size Limit:</span>
            <div className="font-bold text-sm text-white">
              50 MB (In-memory synchronous parsing)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
