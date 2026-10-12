import { useState } from 'react';
import {
  Maximize2,
  Moon,
  Sun,
  Laptop,
  Server,
  Check,
} from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';
import { useHealth } from '@/hooks/useApi';
import { Card } from '@/components/ui/components';
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
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Preferences & Settings
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Customize display units, user interface theme, and review system configuration
          </p>
        </div>

        {savedAlert && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-fade">
            <Check className="w-4 h-4" />
            Preferences Saved
          </div>
        )}
      </div>

      {/* Unit Preferences */}
      <Card className="space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-[hsl(var(--border))]">
          <Maximize2 className="w-5 h-5 text-[hsl(var(--primary))]" />
          <div>
            <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
              Measurement Units
            </h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Choose default units for geometric measurements across tables, cards, and maps
            </p>
          </div>
        </div>

        {/* Area Units */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">
            Preferred Area Unit
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'sq_m', label: 'Square Meters', unit: 'm²', desc: 'Standard SI metric unit' },
              { id: 'hectares', label: 'Hectares', unit: 'ha', desc: '1 ha = 10,000 m²' },
              { id: 'sq_km', label: 'Square Kilometers', unit: 'km²', desc: '1 km² = 1,000,000 m²' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleAreaUnitChange(option.id as AreaUnit)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  preferences.areaUnit === option.id
                    ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 shadow-sm ring-1 ring-[hsl(var(--primary))]'
                    : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/50'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm text-[hsl(var(--foreground))]">
                    {option.label}
                  </span>
                  <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]">
                    {option.unit}
                  </span>
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{option.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Length Units */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">
            Preferred Length & Perimeter Unit
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'm', label: 'Meters', unit: 'm', desc: 'Standard metric length' },
              { id: 'km', label: 'Kilometers', unit: 'km', desc: '1 km = 1,000 m' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleLengthUnitChange(option.id as LengthUnit)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  preferences.lengthUnit === option.id
                    ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 shadow-sm ring-1 ring-[hsl(var(--primary))]'
                    : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/50'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm text-[hsl(var(--foreground))]">
                    {option.label}
                  </span>
                  <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]">
                    {option.unit}
                  </span>
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{option.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Theme Preferences */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[hsl(var(--border))]">
          <Sun className="w-5 h-5 text-[hsl(var(--primary))]" />
          <div>
            <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
              Appearance & Theme
            </h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Select your color preference for high-contrast viewing
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'system', label: 'System Default', icon: Laptop },
            { id: 'light', label: 'Light Mode', icon: Sun },
            { id: 'dark', label: 'Dark Mode', icon: Moon },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleThemeChange(item.id as 'light' | 'dark' | 'system')}
              className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                preferences.theme === item.id
                  ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 shadow-sm ring-1 ring-[hsl(var(--primary))]'
                  : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/50'
              }`}
            >
              <item.icon className="w-5 h-5 text-[hsl(var(--primary))]" />
              <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* System Information & API Diagnostics */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[hsl(var(--border))]">
          <Server className="w-5 h-5 text-[hsl(var(--primary))]" />
          <div>
            <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
              System Diagnostics
            </h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Backend API status and configuration parameters
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-[hsl(var(--muted))]/40 border border-[hsl(var(--border))] space-y-1">
            <span className="text-[hsl(var(--muted-foreground))]">Backend Service:</span>
            <div className="font-semibold text-sm flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${health?.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'}`} />
              {isHealthLoading ? 'Connecting...' : `${health?.service || 'GeoMeasure API'} (${health?.status || 'Active'})`}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[hsl(var(--muted))]/40 border border-[hsl(var(--border))] space-y-1">
            <span className="text-[hsl(var(--muted-foreground))]">API Target URL:</span>
            <div className="font-mono font-medium text-sm">
              {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[hsl(var(--muted))]/40 border border-[hsl(var(--border))] space-y-1">
            <span className="text-[hsl(var(--muted-foreground))]">Supported Formats:</span>
            <div className="font-semibold text-sm">
              KML (.kml), ESRI Shapefile (.zip)
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[hsl(var(--muted))]/40 border border-[hsl(var(--border))] space-y-1">
            <span className="text-[hsl(var(--muted-foreground))]">Max Upload Size:</span>
            <div className="font-semibold text-sm">
              50 MB (Synchronous in-memory parse)
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
