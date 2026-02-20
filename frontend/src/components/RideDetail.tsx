import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getRide } from '../api';
import { ArrowLeft, Zap, Mountain, Flame, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RideDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const = useState<any>(null);

    useEffect(() => {
        getRide(Number(id)).then(setData);
    },);

    if (!data) return <div className="p-8 text-center text-gray-400">Loading...</div>;

    const { ride, path, points, achievements } = data;
    const elevData = points.map((p: any, i: number) => ({ index: i, elev: p.altitude, speed: p.speed_ms * 3.6 }));

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 flex flex-col gap-6">
            <div className="flex items-center gap-4 pt-4">
                <button onClick={() => nav(-1)} className="p-2 bg-surface rounded-full"><ArrowLeft /></button>
                <h1 className="text-xl font-bold">{new Date(ride.start_time).toLocaleDateString()}</h1>
            </div>

            {/* Map */}
            <div className="h-64 rounded-3xl overflow-hidden shadow-lg border border-gray-800">
                <MapContainer bounds={path} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    <Polyline positions={path} color="#a8c7fa" weight={4} />
                </MapContainer>
            </div>

            {/* Core Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface p-4 rounded-2xl flex flex-col gap-1">
                    <span className="text-gray-400 text-xs font-bold uppercase">Distance</span>
                    <span className="text-2xl font-black">{ride.total_distance_km.toFixed(1)} <span className="text-sm font-medium text-gray-500">km</span></span>
                </div>
                <div className="bg-surface p-4 rounded-2xl flex flex-col gap-1">
                    <span className="text-gray-400 text-xs font-bold uppercase">Avg Speed</span>
                    <span className="text-2xl font-black">{ride.avg_speed_kph.toFixed(1)} <span className="text-sm font-medium text-gray-500">km/h</span></span>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
                <div className="bg-surface-container flex flex-col items-center p-3 rounded-2xl"><Mountain size={18} className="text-blue-400 mb-1"/> <span className="font-bold">{Math.round(ride.elevation_gain)}m</span></div>
                <div className="bg-surface-container flex flex-col items-center p-3 rounded-2xl"><Zap size={18} className="text-yellow-400 mb-1"/> <span className="font-bold">{ride.avg_power_watts}W</span></div>
                <div className="bg-surface-container flex flex-col items-center p-3 rounded-2xl"><Flame size={18} className="text-orange-400 mb-1"/> <span className="font-bold">{ride.calories}</span></div>
                <div className="bg-surface-container flex flex-col items-center p-3 rounded-2xl"><Clock size={18} className="text-gray-400 mb-1"/> <span className="font-bold text-sm">{Math.round(ride.moving_time_seconds / 60)}m</span></div>
            </div>

            {/* Elevation Chart */}
            <div className="bg-surface p-4 rounded-3xl">
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Elevation Profile</h3>
                <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={elevData}>
                            <defs>
                                <linearGradient id="colorElev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a8c7fa" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#a8c7fa" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="index" hide />
                            <Tooltip contentStyle={{ backgroundColor: '#1E2128', border: 'none', borderRadius: '8px' }} labelStyle={{display: 'none'}} />
                            <Area type="monotone" dataKey="elev" stroke="#a8c7fa" fillOpacity={1} fill="url(#colorElev)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            {/* Achievements */}
            {achievements.length > 0 && (
                <div className="bg-surface p-4 rounded-3xl mb-8">
                    <h3 className="text-sm font-bold text-yellow-500 uppercase mb-3">Best Efforts</h3>
                    {achievements.map((a: any) => (
                        <div key={a.id} className="flex justify-between border-b border-gray-800 py-2 last:border-0">
                            <span className="capitalize">{a.effort_type.replace('_', ' ')}</span>
                            <span className="font-bold">{Math.floor(a.result_value / 60)}m {Math.floor(a.result_value % 60)}s</span>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
                          }
