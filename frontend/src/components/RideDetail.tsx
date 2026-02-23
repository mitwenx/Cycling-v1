import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getRide } from '../api';
import { ArrowLeft, Zap, Mountain, Flame, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const customIcon = L.divIcon({
    html: `<div class="w-4 h-4 bg-[#4285F4] border-2 border-white rounded-full shadow-md"></div>`,
    className: ''
});

export default function RideDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        getRide(Number(id)).then(setData);
    }, [id]);

    if (!data) return <div className="p-8 text-center text-[#c4c6cf]">Loading Ride...</div>;

    const { ride, path, points, achievements } = data;
    const elevData = points.map((p: any, i: number) => ({ index: i, elev: p.altitude, speed: p.speed_ms * 3.6 }));

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 flex flex-col gap-5 bg-[#111318] text-[#e2e2e6] min-h-screen pb-24">
            <div className="flex items-center gap-4 pt-2">
                <button onClick={() => nav(-1)} className="p-2 bg-[#1E2128] rounded-full active:bg-[#2A2D35]"><ArrowLeft size={20} /></button>
                <h1 className="text-xl font-bold">{new Date(ride.start_time).toLocaleDateString()}</h1>
            </div>

            <div className="h-64 rounded-3xl overflow-hidden shadow-lg border border-[#333]">
                <MapContainer center={path.length > 0 ? path[0] : [0,0]} zoom={14} zoomControl={false} style={{ height: '100%', width: '100%', background: '#eee' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                    {path.length > 0 && <Polyline positions={path} color="#a8c7fa" weight={5} />}
                    {path.length > 0 && <Marker position={path[path.length - 1]} icon={customIcon} />}
                </MapContainer>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1E2128] p-4 rounded-2xl flex flex-col items-center">
                    <span className="text-[#c4c6cf] text-[11px] font-bold uppercase tracking-wider">Distance</span>
                    <span className="text-2xl font-black text-[#a8c7fa] mt-1">{ride.total_distance_km.toFixed(1)} <span className="text-sm font-medium text-[#c4c6cf]">km</span></span>
                </div>
                <div className="bg-[#1E2128] p-4 rounded-2xl flex flex-col items-center">
                    <span className="text-[#c4c6cf] text-[11px] font-bold uppercase tracking-wider">Avg Speed</span>
                    <span className="text-2xl font-black text-[#a8c7fa] mt-1">{ride.avg_speed_kph.toFixed(1)} <span className="text-sm font-medium text-[#c4c6cf]">km/h</span></span>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
                <div className="bg-[#2A2D35] flex flex-col items-center p-3 rounded-2xl"><Mountain size={18} className="text-[#a8c7fa] mb-1"/> <span className="font-bold text-sm">{Math.round(ride.elevation_gain)}m</span></div>
                <div className="bg-[#2A2D35] flex flex-col items-center p-3 rounded-2xl"><Zap size={18} className="text-[#FFD700] mb-1"/> <span className="font-bold text-sm">{ride.avg_power_watts}W</span></div>
                <div className="bg-[#2A2D35] flex flex-col items-center p-3 rounded-2xl"><Flame size={18} className="text-[#ffb4ab] mb-1"/> <span className="font-bold text-sm">{ride.calories}</span></div>
                <div className="bg-[#2A2D35] flex flex-col items-center p-3 rounded-2xl"><Clock size={18} className="text-[#c4c6cf] mb-1"/> <span className="font-bold text-sm">{Math.round(ride.moving_time_seconds / 60)}m</span></div>
            </div>

            <div className="bg-[#1E2128] p-4 rounded-3xl mt-2">
                <h3 className="text-[11px] font-bold text-[#c4c6cf] uppercase tracking-wider mb-4">Elevation Profile</h3>
                <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={elevData}>
                            <defs>
                                <linearGradient id="colorElev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a8c7fa" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#a8c7fa" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="index" hide />
                            <Tooltip contentStyle={{ backgroundColor: '#2A2D35', border: 'none', borderRadius: '12px', color: '#fff' }} labelStyle={{display: 'none'}} />
                            <Area type="monotone" dataKey="elev" stroke="#a8c7fa" strokeWidth={2} fillOpacity={1} fill="url(#colorElev)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            {achievements.length > 0 && (
                <div className="bg-[#1E2128] p-4 rounded-3xl mb-8 mt-2">
                    <h3 className="text-[11px] font-bold text-[#FFD700] uppercase tracking-wider mb-3">Best Efforts</h3>
                    {achievements.map((a: any) => (
                        <div key={a.id} className="flex justify-between border-b border-[#333] py-3 last:border-0 items-center">
                            <span className="capitalize font-medium text-sm text-[#e2e2e6]">{a.effort_type.replace('_', ' ')}</span>
                            <span className="font-bold bg-[#2A2D35] px-3 py-1 rounded-lg text-[#a8c7fa]">{Math.floor(a.result_value / 60)}m {Math.floor(a.result_value % 60)}s</span>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
