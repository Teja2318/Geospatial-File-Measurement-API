import { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON as LeafletGeoJSON,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import type { GeoJSONFeatureCollection, AreaUnit, LengthUnit } from '@/types/api';
import { formatArea, formatLength, geometryTypeColor } from '@/lib/utils';
import { Layers, MapPin } from 'lucide-react';

interface MapViewProps {
  data: GeoJSONFeatureCollection | null;
  selectedFeatureId: number | null;
  onSelectFeature?: (featureId: number | null) => void;
  areaUnit: AreaUnit;
  lengthUnit: LengthUnit;
  className?: string;
}

// Helper component to auto-fit map bounds when GeoJSON changes
function FitBounds({ data, selectedFeatureId }: { data: GeoJSONFeatureCollection | null; selectedFeatureId: number | null }) {
  const map = useMap();

  useEffect(() => {
    if (!data || !data.features || data.features.length === 0) return;

    try {
      if (selectedFeatureId != null) {
        // Find selected feature and fit to its bounds
        const target = data.features.find(
          (f, idx) => (f.properties?.feature_id === selectedFeatureId) || idx === selectedFeatureId
        );
        if (target && target.geometry) {
          const layer = L.geoJSON(target as any);
          const bounds = layer.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
            return;
          }
        }
      }

      // Default: fit all features
      const layer = L.geoJSON(data as any);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
      }
    } catch (e) {
      console.warn('Could not fit map bounds:', e);
    }
  }, [data, selectedFeatureId, map]);

  return null;
}

const TILE_PROVIDERS = [
  {
    name: 'CartoDB Positron',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    name: 'CartoDB Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
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
  const [tileIndex, setTileIndex] = useState(0);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

  // Style function for Leaflet GeoJSON features
  const styleFeature = (feature: any) => {
    const featId = feature?.properties?.feature_id;
    const isSelected = selectedFeatureId != null && featId === selectedFeatureId;
    const geomType = feature?.geometry?.type || '';
    const baseColor = geometryTypeColor(geomType);

    return {
      fillColor: isSelected ? '#eab308' : baseColor,
      weight: isSelected ? 4 : 2,
      opacity: 1,
      color: isSelected ? '#ca8a04' : baseColor,
      fillOpacity: isSelected ? 0.6 : 0.35,
    };
  };

  // Point to layer creation using nice circle markers
  const pointToLayer = (feature: any, latlng: L.LatLng) => {
    const featId = feature?.properties?.feature_id;
    const isSelected = selectedFeatureId != null && featId === selectedFeatureId;
    return L.circleMarker(latlng, {
      radius: isSelected ? 10 : 7,
      fillColor: isSelected ? '#eab308' : '#22c55e',
      color: isSelected ? '#ca8a04' : '#15803d',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.85,
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
      <div style="font-family: inherit; font-size: 13px; min-width: 180px; padding: 2px;">
        <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
          Feature #${featId}
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #64748b;">Type:</span>
          <span style="font-weight: 600; color: #0f172a;">${geomType}</span>
        </div>
    `;

    if (area) {
      popupContent += `
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #64748b;">Area:</span>
          <span style="font-weight: 600; color: #2563eb;">${area}</span>
        </div>
      `;
    }

    if (length) {
      popupContent += `
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #64748b;">Length:</span>
          <span style="font-weight: 600; color: #dc2626;">${length}</span>
        </div>
      `;
    }

    if (perimeter) {
      popupContent += `
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #64748b;">Perimeter:</span>
          <span style="font-weight: 600; color: #dc2626;">${perimeter}</span>
        </div>
      `;
    }

    // Include other notable attributes
    const extraProps = Object.entries(props).filter(
      ([k]) => !['feature_id', 'geometry_type', 'area_sq_m', 'length_m', 'perimeter_m', 'measurement_status', 'source_crs', 'measurement_crs'].includes(k)
    );

    if (extraProps.length > 0) {
      popupContent += `
        <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #e2e8f0;">
          <span style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 600;">Attributes</span>
      `;
      extraProps.slice(0, 4).forEach(([k, v]) => {
        popupContent += `
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 2px;">
            <span style="color: #64748b; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${k}:</span>
            <span style="font-weight: 500; color: #334155; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${String(v)}</span>
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
    <div className={`relative w-full h-full rounded-xl overflow-hidden border border-[hsl(var(--border))] ${className || ''}`}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[400px]"
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

      {/* Layer Switcher Controls */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="p-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-md hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="Switch Basemap"
          >
            <Layers className="w-4 h-4 text-[hsl(var(--primary))]" />
            <span className="hidden sm:inline">{activeTile.name}</span>
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 mt-1 py-1 w-44 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-xl text-xs z-[1001]">
              {TILE_PROVIDERS.map((provider, idx) => (
                <button
                  key={provider.name}
                  onClick={() => {
                    setTileIndex(idx);
                    setShowLayerMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-[hsl(var(--muted))] flex items-center justify-between ${
                    idx === tileIndex ? 'font-bold text-[hsl(var(--primary))]' : 'text-[hsl(var(--foreground))]'
                  }`}
                >
                  {provider.name}
                  {idx === tileIndex && <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-[hsl(var(--card))]/90 backdrop-blur-sm border border-[hsl(var(--border))] rounded-lg p-2.5 shadow-md text-xs space-y-1.5">
        <div className="font-semibold text-[hsl(var(--foreground))] mb-1 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
          Geometries
        </div>
        <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
          <span className="w-3 h-3 rounded bg-blue-500 border border-blue-600 shrink-0" />
          <span>Polygon (Area)</span>
        </div>
        <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
          <span className="w-3 h-1 bg-red-500 shrink-0" />
          <span>LineString (Length)</span>
        </div>
        <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 border border-green-600 shrink-0" />
          <span>Point</span>
        </div>
      </div>
    </div>
  );
}
