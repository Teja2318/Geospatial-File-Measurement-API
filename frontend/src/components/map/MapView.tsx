import { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON as LeafletGeoJSON,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import type { GeoJSONFeatureCollection, AreaUnit, LengthUnit } from '@/types/api';
import { formatArea, formatLength } from '@/lib/utils';
import { MapPin } from 'lucide-react';

interface MapViewProps {
  data: GeoJSONFeatureCollection | null;
  selectedFeatureId: number | null;
  onSelectFeature?: (featureId: number | null) => void;
  areaUnit: AreaUnit;
  lengthUnit: LengthUnit;
  className?: string;
}

// Auto-fit map bounds
function FitBounds({ data, selectedFeatureId }: { data: GeoJSONFeatureCollection | null; selectedFeatureId: number | null }) {
  const map = useMap();

  useEffect(() => {
    if (!data || !data.features || data.features.length === 0) return;

    try {
      if (selectedFeatureId != null) {
        const target = data.features.find(
          (f, idx) => (f.properties?.feature_id === selectedFeatureId) || idx === selectedFeatureId
        );
        if (target && target.geometry) {
          const layer = L.geoJSON(target as any);
          const bounds = layer.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
            return;
          }
        }
      }

      const layer = L.geoJSON(data as any);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    } catch (e) {
      console.warn('Could not fit map bounds:', e);
    }
  }, [data, selectedFeatureId, map]);

  return null;
}

const TILE_PROVIDERS = [
  {
    name: 'Esri Dark Canvas',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
  },
  {
    name: 'Esri Satellite Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri, i-cubed, USDA, USGS',
  },
  {
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
];

export function MapView({
  data,
  selectedFeatureId,
  onSelectFeature,
  areaUnit,
  lengthUnit,
  className,
}: MapViewProps) {
  const [tileIndex, setTileIndex] = useState(0); // Default to Esri Dark Canvas!
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

  const styleFeature = (feature: any) => {
    const featId = feature?.properties?.feature_id;
    const isSelected = selectedFeatureId != null && featId === selectedFeatureId;
    const geomType = feature?.geometry?.type || '';

    let baseFill = '#38bdf8';
    let baseStroke = '#0284c7';

    if (geomType.includes('Line')) {
      baseFill = '#fb7185';
      baseStroke = '#f43f5e';
    } else if (geomType.includes('Point')) {
      baseFill = '#34d399';
      baseStroke = '#10b981';
    }

    return {
      fillColor: isSelected ? '#fbbf24' : baseFill,
      weight: isSelected ? 4 : 2.5,
      opacity: 1,
      color: isSelected ? '#f59e0b' : baseStroke,
      fillOpacity: isSelected ? 0.75 : 0.4,
    };
  };

  const pointToLayer = (feature: any, latlng: L.LatLng) => {
    const featId = feature?.properties?.feature_id;
    const isSelected = selectedFeatureId != null && featId === selectedFeatureId;
    return L.circleMarker(latlng, {
      radius: isSelected ? 11 : 7,
      fillColor: isSelected ? '#fbbf24' : '#34d399',
      color: isSelected ? '#f59e0b' : '#059669',
      weight: isSelected ? 3 : 2,
      opacity: 1,
      fillOpacity: 0.9,
    });
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const props = feature.properties || {};
    const featId = props.feature_id != null ? props.feature_id : '—';
    const geomType = feature.geometry?.type || 'Unknown';
    const area = props.area_sq_m != null ? formatArea(props.area_sq_m as number, areaUnit) : null;
    const length = props.length_m != null ? formatLength(props.length_m as number, lengthUnit) : null;
    const perimeter = props.perimeter_m != null ? formatLength(props.perimeter_m as number, lengthUnit) : null;

    let popupContent = `
      <div style="font-family: inherit; font-size: 13px; min-width: 200px; padding: 4px; color: #f8fafc;">
        <div style="font-weight: 800; font-size: 14px; margin-bottom: 6px; color: #38bdf8; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px; display: flex; justify-content: space-between;">
          <span>Feature #${featId}</span>
          <span style="font-size: 11px; padding: 2px 6px; background: rgba(56,189,248,0.15); border-radius: 4px; color: #7dd3fc;">${geomType}</span>
        </div>
    `;

    if (area) {
      popupContent += `
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span style="color: #94a3b8;">Planar Area:</span>
          <span style="font-weight: 700; color: #38bdf8;">${area}</span>
        </div>
      `;
    }

    if (length) {
      popupContent += `
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span style="color: #94a3b8;">Path Length:</span>
          <span style="font-weight: 700; color: #fb7185;">${length}</span>
        </div>
      `;
    }

    if (perimeter) {
      popupContent += `
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span style="color: #94a3b8;">Perimeter:</span>
          <span style="font-weight: 700; color: #fb7185;">${perimeter}</span>
        </div>
      `;
    }

    const extraProps = Object.entries(props).filter(
      ([k]) => !['feature_id', 'geometry_type', 'area_sq_m', 'length_m', 'perimeter_m', 'measurement_status', 'source_crs', 'measurement_crs'].includes(k)
    );

    if (extraProps.length > 0) {
      popupContent += `
        <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.1);">
          <span style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px;">Properties</span>
      `;
      extraProps.slice(0, 4).forEach(([k, v]) => {
        popupContent += `
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 3px;">
            <span style="color: #94a3b8; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${k}:</span>
            <span style="font-weight: 500; color: #e2e8f0; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${String(v)}</span>
          </div>
        `;
      });
      popupContent += `</div>`;
    }

    popupContent += `</div>`;
    layer.bindPopup(popupContent);

    layer.on({
      click: () => {
        if (onSelectFeature && props.feature_id != null) {
          onSelectFeature(props.feature_id as number);
        }
      },
    });
  };

  const activeTile = TILE_PROVIDERS[tileIndex];

  return (
    <div className={`relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl ${className || ''}`}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[420px]"
      >
        <TileLayer
          key={activeTile.url}
          attribution={activeTile.attribution}
          url={activeTile.url}
        />

        {data && data.features && data.features.length > 0 && (
          <>
            <LeafletGeoJSON
              key={`geojson-${selectedFeatureId}-${tileIndex}-${data.features.length}`}
              ref={geoJsonLayerRef}
              data={data as any}
              style={styleFeature}
              pointToLayer={pointToLayer}
              onEachFeature={onEachFeature}
            />
            <FitBounds data={data} selectedFeatureId={selectedFeatureId} />
          </>
        )}
      </MapContainer>

      {/* Floating Segmented Basemap Switcher */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center p-1 bg-slate-950/85 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl space-x-1">
        {TILE_PROVIDERS.map((provider, idx) => (
          <button
            key={provider.name}
            type="button"
            onClick={() => setTileIndex(idx)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              tileIndex === idx
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            {provider.name}
          </button>
        ))}
      </div>

      {/* Floating Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs space-y-2">
        <div className="font-bold text-white flex items-center gap-1.5 pb-1 border-b border-slate-800">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          Layer Types
        </div>
        <div className="flex items-center gap-2.5 text-slate-300">
          <span className="w-3.5 h-3.5 rounded bg-sky-400/80 border border-sky-300 shrink-0 shadow-sm" />
          <span>Polygon (Area)</span>
        </div>
        <div className="flex items-center gap-2.5 text-slate-300">
          <span className="w-3.5 h-1.5 bg-rose-400 rounded-full shrink-0 shadow-sm" />
          <span>LineString (Path)</span>
        </div>
        <div className="flex items-center gap-2.5 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-emerald-300 shrink-0 shadow-[0_0_6px_#34d399]" />
          <span>Point (Marker)</span>
        </div>
      </div>
    </div>
  );
}
