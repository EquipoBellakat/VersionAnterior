import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para los iconos de Leaflet en React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconRetinaUrl: iconRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface HistoryPoint {
  time: string;
  lat: number;
  lon: number;
  vmax?: number;
  mslp?: number;
  type?: string;
}

interface PredictionPoint {
  step: number;
  lat: number;
  lon: number;
  time: string;
}

interface InteractivePredictionMapProps {
  history?: HistoryPoint[];
  predictions: PredictionPoint[];
  stormId: string;
}

// Componente para ajustar el zoom automáticamente
function MapBounds({ history, predictions }: { history?: HistoryPoint[]; predictions: PredictionPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (!history || history.length === 0 || predictions.length === 0) return;

    const allPoints = [
      ...(history || []).map(p => [p.lat, p.lon] as [number, number]),
      ...predictions.map(p => [p.lat, p.lon] as [number, number])
    ];

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [history, predictions, map]);

  return null;
}

export const InteractivePredictionMap = ({ history, predictions, stormId }: InteractivePredictionMapProps) => {
  const mapRef = useRef<L.Map | null>(null);

  // Preparar datos para las líneas
  const historyPath = history?.map(p => [p.lat, p.lon] as [number, number]) || [];
  const predictionPath = predictions.map(p => [p.lat, p.lon] as [number, number]);

  // Calcular centro inicial
  const allLats = [
    ...(history || []).map(p => p.lat),
    ...predictions.map(p => p.lat)
  ];
  const allLons = [
    ...(history || []).map(p => p.lon),
    ...predictions.map(p => p.lon)
  ];

  const centerLat = allLats.length > 0 
    ? (Math.min(...allLats) + Math.max(...allLats)) / 2 
    : 20;
  const centerLon = allLons.length > 0 
    ? (Math.min(...allLons) + Math.max(...allLons)) / 2 
    : -80;

  if (historyPath.length === 0 && predictionPath.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        height: '400px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px'
      }}>
        <p>No hay datos para mostrar</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '500px', borderRadius: '8px', overflow: 'hidden', position: 'relative', zIndex: 0 }}>
      {/* Leyenda del mapa */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: 'white',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 1000,
        fontSize: '12px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        minWidth: '180px'
      }}>
        <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#1f2937', fontSize: '13px' }}>
          Leyenda
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ width: '20px', height: '4px', backgroundColor: '#1e40af', marginRight: '8px', borderRadius: '2px' }}></div>
          <span>Trayectoria Histórica</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ width: '20px', height: '3px', background: 'repeating-linear-gradient(to right, #dc2626 0, #dc2626 8px, transparent 8px, transparent 12px)', marginRight: '8px' }}></div>
          <span>Predicción (48h)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#1e40af', border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', marginRight: '8px' }}></div>
          <span>Punto Actual</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#dc2626', border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', marginRight: '8px' }}></div>
          <span>Fin Predicción</span>
        </div>
      </div>

      <MapContainer
        center={[centerLat, centerLon]}
        zoom={5}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        ref={mapRef}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBounds history={history} predictions={predictions} />

        {/* Línea de trayectoria histórica - más gruesa y visible */}
        {historyPath.length > 1 && (
          <Polyline
            positions={historyPath}
            pathOptions={{
              color: '#1e40af',
              weight: 4,
              opacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
        )}

        {/* Círculos pequeños en puntos clave del historial (cada 6 puntos para mostrar trayectoria sin saturar) */}
        {history?.map((point, index) => {
          // Solo mostrar círculos en puntos clave, no todos
          if (index > 0 && index < history.length - 1 && index % 6 !== 0) {
            return null;
          }
          return (
            <CircleMarker
              key={`hist-circle-${index}`}
              center={[point.lat, point.lon]}
              radius={4}
              pathOptions={{
                fillColor: '#3b82f6',
                color: '#1e40af',
                fillOpacity: 0.8,
                weight: 1.5
              }}
            >
              <Popup>
                <div style={{ fontSize: '12px' }}>
                  <strong>Historial</strong>
                  <br />
                  {new Date(point.time).toLocaleString()}
                  <br />
                  Lat: {point.lat.toFixed(2)}, Lon: {point.lon.toFixed(2)}
                  {point.vmax && <><br />Vmax: {point.vmax} kts</>}
                  {point.type && <><br />Tipo: {point.type}</>}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Marcador del punto actual (último del historial) - más visible */}
        {history && history.length > 0 && (
          <Marker 
            position={[history[history.length - 1].lat, history[history.length - 1].lon]}
            icon={L.divIcon({
              className: 'custom-marker',
              html: `<div style="
                width: 24px;
                height: 24px;
                background: #1e40af;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 11px;
              ">A</div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            })}
          >
            <Popup>
              <div style={{ fontSize: '12px' }}>
                <strong style={{ color: '#1e40af' }}>ACTUAL</strong>
                <br />
                {new Date(history[history.length - 1].time).toLocaleString()}
                <br />
                Lat: {history[history.length - 1].lat.toFixed(2)}, Lon: {history[history.length - 1].lon.toFixed(2)}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Línea de predicción - más visible y con mejor contraste */}
        {predictionPath.length > 1 && (
          <Polyline
            positions={predictionPath}
            pathOptions={{
              color: '#dc2626',
              weight: 3,
              opacity: 0.85,
              dashArray: '8, 4',
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
        )}

        {/* Círculos pequeños en puntos clave de predicción (cada 12 horas) */}
        {predictions.map((point, index) => {
          // Solo mostrar círculos cada 12 horas para no saturar
          if (index > 0 && index % 12 !== 0 && index !== predictions.length - 1) {
            return null;
          }
          return (
            <CircleMarker
              key={`pred-circle-${index}`}
              center={[point.lat, point.lon]}
              radius={3}
              pathOptions={{
                fillColor: '#ef4444',
                color: '#dc2626',
                fillOpacity: 0.7,
                weight: 1
              }}
            >
              <Popup>
                <div style={{ fontSize: '12px' }}>
                  <strong>Predicción</strong>
                  <br />
                  +{point.step} horas
                  <br />
                  {new Date(point.time).toLocaleString()}
                  <br />
                  Lat: {point.lat.toFixed(2)}, Lon: {point.lon.toFixed(2)}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Marcador del punto final de predicción - más visible */}
        {predictions.length > 0 && (
          <Marker 
            position={[predictions[predictions.length - 1].lat, predictions[predictions.length - 1].lon]}
            icon={L.divIcon({
              className: 'custom-marker',
              html: `<div style="
                width: 28px;
                height: 28px;
                background: #dc2626;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 10px;
              ">FIN</div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            })}
          >
            <Popup>
              <div style={{ fontSize: '12px' }}>
                <strong style={{ color: '#dc2626' }}>Fin de Predicción</strong>
                <br />
                {new Date(predictions[predictions.length - 1].time).toLocaleString()}
                <br />
                {predictions.length} horas de predicción
                <br />
                Lat: {predictions[predictions.length - 1].lat.toFixed(2)}, Lon: {predictions[predictions.length - 1].lon.toFixed(2)}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

