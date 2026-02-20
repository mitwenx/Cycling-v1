import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Play, Pause, Square, Navigation } from 'lucide-react';
import { startRide, pauseRide, resumeRide, stopRide } from '../api';

const customIcon = L.divIcon({
    html: `<div class="w-4 h-4 bg-primary border-2 border-white rounded-full shadow-"></div>`,
    className: ''
});

// Map Updater Component
const MapUpdater = ({ center, bearing, compassMode }: any) => {
    const map = useMap();
    useEffect(() => {
        if (center[0] !== 0) {
            map.setView(center, 16, { animate: true });
            if (compassMode && map.getContainer()) {
                map.getContainer().style.transform = `rotate(-${bearing}deg)`;
                map.getContainer().style.transformOrigin = 'center center';
                map.getContainer().style.transition = 'transform 0.3s linear';
            } else {
                map.getContainer().style.transform = 'none';
            }
        }
    }, [center, bearing, compassMode, map]);
    return null;
};

export default function Dashboard() {
    const [stats, setStats] = useState({ lat: 0, lon: 0, speed_kph: 0, power: 0, dist_km: 0, time: 0, bearing: 0, status: 'Init', recording: false, paused: false });
    const [path, setPath] = useState<any[]>([]);
    const [compassMode, setCompassMode] = useState(false);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        const connect = () => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            ws.current = new WebSocket(`${protocol}//${window.location.host}/ws/live`);
            ws.current.onmessage = (e) => {
                const data = JSON.parse(e.data);
                setStats(data);
                if (data.lat && data.lon) setPath(prev => [...prev, [data.lat, data.lon]]);
            };
            ws.current.onclose = () => setTimeout(connect, 2000);
        };
        connect();
        return () => ws.current?.close();
    }, []);

    const formatTime = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="relative h-screen overflow-hidden flex flex-col">
            <div className="flex-1 relative bg-gray-900 rounded-b-3xl overflow-hidden shadow-xl z-0">
                <MapContainer center={[0,0]} zoom={15} zoomControl={false} style={{ height: '100%', width: '100%', position: 'absolute' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    <Polyline positions={path} color="#a8c7fa" weight={5} />
                    {stats.lat !== 0 && <Marker position={[stats.lat, stats.lon]} icon={customIcon} />}
                    <MapUpdater center={[stats.lat, stats.lon]} bearing={stats.bearing} compassMode={compassMode} />
                </MapContainer>

                <button onClick={() => setCompassMode(!compassMode)} className={`absolute top-4 right-4 z-20 p-3 rounded-full shadow-lg ${compassMode ? 'bg-primary text-on-primary' : 'bg-surface text-gray-200'}`}>
                    <Navigation size={20} className={compassMode ? '' : 'rotate-45'} />
                </button>
            </div>

            <div className="absolute bottom-6 left-4 right-4 z-10 flex flex-col gap-4">
                <div className="bg-surface-container/95 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">{stats.status}</span>
                        <span className="text-4xl font-black tracking-tighter text-white">{stats.speed_kph.toFixed(1)} <span className="text-lg text-gray-400 font-medium">km/h</span></span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-400 uppercase font-bold">Power</span>
                            <span className="text-xl font-bold text-primary">{stats.power} W</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-400 uppercase font-bold">Distance</span>
                            <span className="text-xl font-bold">{stats.dist_km.toFixed(2)} km</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-400 uppercase font-bold">Time</span>
                            <span className="text-xl font-bold">{formatTime(stats.time)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    {!stats.recording ? (
                        <button onClick={startRide} className="flex-1 bg-primary text-on-primary py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
                            <Play fill="currentColor" size={20} /> START
                        </button>
                    ) : (
                        <>
                            {stats.paused ? (
                                <button onClick={resumeRide} className="flex-1 bg-primary text-on-primary py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                                    <Play fill="currentColor" size={20} /> RESUME
                                </button>
                            ) : (
                                <button onClick={pauseRide} className="flex-1 bg-secondary text-on-secondary py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                                    <Pause fill="currentColor" size={20} /> PAUSE
                                </button>
                            )}
                            <button onClick={() => { stopRide(); setPath([]); }} className="flex-1 bg-error/20 text-error py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform border border-error/30">
                                <Square fill="currentColor" size={20} /> STOP
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
