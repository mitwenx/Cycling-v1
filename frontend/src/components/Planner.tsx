import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, Undo2, Save, Route as RouteIcon } from 'lucide-react';
import { saveRoute } from '../api';

const waypointIcon = L.divIcon({
    html: `<div class="w-4 h-4 bg-white border-4 border-primary rounded-full shadow-md"></div>`,
    className: ''
});

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

export default function Planner() {
    const nav = useNavigate();
    const [waypoints, setWaypoints] = useState<any[]>([]);
    const [snappedPath, setSnappedPath] = useState<any[]>([]);
    const [stats, setStats] = useState({ distance: 0, elevation: 0 });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchRoute = async () => {
            if (waypoints.length < 2) {
                setSnappedPath(waypoints);
                setStats({ distance: 0, elevation: 0 });
                return;
            }

            setLoading(true);
            try {
                const coordString = waypoints.map(p => `${p[1]},${p[0]}`).join(';');
                const url = `https://routing.openstreetmap.de/routed-bike/route/v1/driving/${coordString}?overview=full&geometries=geojson`;

                const res = await fetch(url);
                const data = await res.json();

                if (data.routes && data.routes.length > 0) {
                    const route = data.routes[0];
                    const geometry = route.geometry.coordinates.map((c: any) => [c[1], c[0]]);
                    setSnappedPath(geometry);
                    
                    const distKm = route.distance / 1000;
                    const elev = await fetchElevation(geometry);
                    setStats({ distance: distKm, elevation: elev });
                }
            } catch (err) {
                console.error("Routing error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRoute();
    }, [waypoints]);

    const fetchElevation = async (path: any[]) => {
        if (path.length < 2) return 0;
        const step = Math.ceil(path.length / 50);
        const sampled = path.filter((_, i) => i % step === 0);
        if (sampled[sampled.length - 1] !== path[path.length - 1]) sampled.push(path[path.length - 1]);

        const lats = sampled.map(p => p[0]).join(',');
        const lons = sampled.map(p => p[1]).join(',');

        try {
            const res = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lons}`);
            const data = await res.json();
            if (!data.elevation) return 0;

            let gain = 0;
            for (let i = 1; i < data.elevation.length; i++) {
                const diff = data.elevation[i] - data.elevation[i - 1];
                if (diff > 0) gain += diff;
            }
            return Math.round(gain * 1.1);
        } catch {
            return 0;
        }
    };

    const handleMapClick = (lat: number, lng: number) => {
        setWaypoints(prev => [...prev, [lat, lng]]);
    };

    const undoLast = () => {
        setWaypoints(prev => prev.slice(0, -1));
    };

    const handleSave = async () => {
        if (snappedPath.length < 2) return alert("Please create a route first.");
        const name = prompt("Enter a name for this route:");
        if (!name) return;

        try {
            setLoading(true);
            await saveRoute({
                name,
                distance_km: stats.distance,
                elevation_m: stats.elevation,
                points: snappedPath
            });
            alert("Route saved!");
            nav('/settings');
        } catch (e) {
            alert("Failed to save route.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-background">
            <div className="p-4 flex justify-between items-center bg-background z-10 relative">
                <button onClick={() => nav(-1)} className="p-2 bg-surface rounded-full text-white">
                    <ArrowLeft size={20} />
                </button>
                <div className="font-bold flex items-center gap-2">
                    <RouteIcon size={20} className="text-primary" /> Route Planner
                </div>
                <button onClick={handleSave} className="p-2 bg-primary text-on-primary rounded-full font-bold">
                    <Save size={20} />
                </button>
            </div>

            <div className="px-4 pb-4 bg-background z-10 relative">
                <div className="bg-surface p-4 rounded-3xl flex justify-around shadow-lg">
                    <div className="text-center">
                        <div className="text-xs text-gray-400 font-bold uppercase">Distance</div>
                        <div className="text-xl font-black text-white">{stats.distance.toFixed(1)} <span className="text-sm font-medium">km</span></div>
                    </div>
                    <div className="w-px bg-gray-700"></div>
                    <div className="text-center">
                        <div className="text-xs text-gray-400 font-bold uppercase">Elevation</div>
                        <div className="text-xl font-black text-white">{stats.elevation} <span className="text-sm font-medium">m</span></div>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative z-0 pb-20 rounded-t-3xl overflow-hidden border-t border-gray-800">
                {loading && (
                    <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center backdrop-blur-sm">
                        <div className="bg-surface px-6 py-3 rounded-2xl font-bold animate-pulse">Calculating Route...</div>
                    </div>
                )}
                
                <MapContainer center={[0,0]} zoom={2} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    <ClickHandler onMapClick={handleMapClick} />
                    
                    {waypoints.map((pos, idx) => (
                        <Marker key={idx} position={pos} icon={waypointIcon} />
                    ))}
                    
                    <Polyline positions={snappedPath} color="#a8c7fa" weight={5} opacity={0.8} />
                </MapContainer>

                <button 
                    onClick={undoLast}
                    disabled={waypoints.length === 0}
                    className="absolute bottom-28 right-4 z-10 p-4 bg-surface text-white rounded-full shadow-lg border border-gray-700 disabled:opacity-50 active:scale-95"
                >
                    <Undo2 size={24} />
                </button>
                
                <div className="absolute top-4 left-0 right-0 text-center z-10 pointer-events-none">
                    <span className="bg-black/60 text-white text-xs px-4 py-2 rounded-full backdrop-blur-md">
                        Tap map to add waypoints
                    </span>
                </div>
            </div>
        </div>
    );
}
