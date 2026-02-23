
import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Play, Pause, Square, Navigation, Crosshair } from 'lucide-react';
import { startRide, pauseRide, resumeRide, stopRide } from '../api';

const customIcon = L.divIcon({
    html: `<div class="w-5 h-5 bg-[#4285F4] border-[3px] border-white rounded-full shadow-md animate-pulse"></div>`,
    className: ''
});

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
    const [stats, setStats] = useState({ lat: 0, lon: 0, speed_kph: 0, power: 0, dist_km: 0, time: 0, avg_speed_kph: 0, bearing: 0, status: 'Init', recording: false, paused: false });
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
        <div className="relative h-screen flex flex-col bg-[#111318] text-[#e2e2e6] overflow-hidden">
            <header className="flex justify-between items-center px-6 py-4 border-b border-[#222] bg-[#111318] z-50">
                <span className="text-xl font-medium">miii</span>
                <div className="flex items-center gap-2 px-3 py-1 bg-[#2A2D35] rounded-full text-[10px] uppercase font-medium tracking-wide">
                    <div className={`w-1.5 h-1.5 rounded-full ${stats.recording && !stats.paused ? 'bg-green-500 shadow-[0_0_5px_#4caf50]' : stats.paused ? 'bg-yellow-400' : 'bg-gray-500'}`}></div>
                    <span className={stats.recording && !stats.paused ? 'text-[#a5f5a8]' : stats.paused ? 'text-[#ffe082]' : ''}>{stats.status}</span>
                </div>
            </header>

            <main className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto pb-24">
                <div className="relative h-[40vh] min-h-[300px] rounded-3xl overflow-hidden border border-[#333] z-10 flex-shrink-0">
                    <MapContainer center={stats.lat !== 0 ? [stats.lat, stats.lon] : [0,0]} zoom={15} zoomControl={false} style={{ height: '100%', width: '100%', background: '#eee' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                        <Polyline positions={path} color="#a8c7fa" weight={5} />
                        {stats.lat !== 0 && <Marker position={[stats.lat, stats.lon]} icon={customIcon} />}
                        <MapUpdater center={[stats.lat, stats.lon]} bearing={stats.bearing} compassMode={compassMode} />
                    </MapContainer>

                    <button onClick={() => setCompassMode(!compassMode)} className={`absolute top-4 right-4 z-[900] w-10 h-10 flex items-center justify-center rounded-full shadow-lg border border-[#444] transition-colors ${compassMode ? 'bg-[#222] text-[#a8c7fa] border-[#a8c7fa]' : 'bg-[#1e2128]/95 text-white'}`}>
                        <Navigation size={18} className={`transition-transform duration-300 ${compassMode ? '' : 'rotate-45'}`} />
                    </button>
                    <button className="absolute top-16 right-4 z-[900] w-10 h-10 flex items-center justify-center rounded-full shadow-lg border border-[#444] bg-[#1e2128]/95 text-white">
                        <Crosshair size={18} />
                    </button>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="bg-[#2A2D35] rounded-2xl p-5 flex flex-col items-center justify-center shadow-md">
                        <span className="text-[11px] text-[#c4c6cf] uppercase tracking-wider font-bold">Speed</span>
                        <div className="mt-1"><span className="text-[42px] font-black text-[#a8c7fa] leading-none">{stats.speed_kph.toFixed(1)}</span> <span className="text-sm text-[#c4c6cf]">km/h</span></div>
                    </div>
                    
                    <div className="flex gap-3">
                        <div className="flex-1 bg-[#1E2128] rounded-2xl p-4 flex flex-col items-center justify-center shadow-md">
                            <span className="text-[11px] text-[#c4c6cf] uppercase tracking-wider font-bold">Power</span>
                            <div className="mt-1"><span className="text-2xl font-bold">{stats.power}</span> <span className="text-sm text-[#c4c6cf]">W</span></div>
                        </div>
                        <div className="flex-1 bg-[#1E2128] rounded-2xl p-4 flex flex-col items-center justify-center shadow-md">
                            <span className="text-[11px] text-[#c4c6cf] uppercase tracking-wider font-bold">Time</span>
                            <div className="mt-1"><span className="text-2xl font-bold">{formatTime(stats.time)}</span></div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-1 bg-[#1E2128] rounded-2xl p-4 flex flex-col items-center justify-center shadow-md">
                            <span className="text-[11px] text-[#c4c6cf] uppercase tracking-wider font-bold">Distance</span>
                            <div className="mt-1"><span className="text-2xl font-bold">{stats.dist_km.toFixed(2)}</span> <span className="text-sm text-[#c4c6cf]">km</span></div>
                        </div>
                        <div className="flex-1 bg-[#1E2128] rounded-2xl p-4 flex flex-col items-center justify-center shadow-md">
                            <span className="text-[11px] text-[#c4c6cf] uppercase tracking-wider font-bold">Avg Speed</span>
                            <div className="mt-1"><span className="text-2xl font-bold">{stats.avg_speed_kph.toFixed(1)}</span> <span className="text-sm text-[#c4c6cf]">km/h</span></div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-2">
                    {!stats.recording ? (
                        <button onClick={startRide} className="flex-1 h-[56px] bg-[#a8c7fa] text-[#003062] rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg">
                            <Play fill="currentColor" size={20} /> START
                        </button>
                    ) : (
                        <>
                            {stats.paused ? (
                                <button onClick={resumeRide} className="flex-1 h-[56px] bg-[#a8c7fa] text-[#003062] rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg">
                                    <Play fill="currentColor" size={20} /> RESUME
                                </button>
                            ) : (
                                <button onClick={pauseRide} className="flex-1 h-[56px] bg-[#cce8e9] text-[#051f23] rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg">
                                    <Pause fill="currentColor" size={20} /> PAUSE
                                </button>
                            )}
                            <button onClick={() => { stopRide(); setPath([]); }} className="flex-1 h-[56px] bg-[#93000a] text-[#ffb4ab] rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg">
                                <Square fill="currentColor" size={20} /> STOP
                            </button>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
