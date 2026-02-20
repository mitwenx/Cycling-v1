import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Activity, Zap, Mountain } from 'lucide-react';
import { getHistory } from '../api';

export default function History() {
    const [rides, setRides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const nav = useNavigate();

    useEffect(() => {
        getHistory()
            .then(setRides)
            .finally(() => setLoading(false));
    }, []);

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-400 font-medium animate-pulse">Loading History...</div>;
    }

    return (
        <div className="p-4 flex flex-col gap-4">
            <h1 className="text-3xl font-black tracking-tight mb-2 pt-4 pl-2 flex items-center gap-3">
                <Calendar className="text-primary" /> History
            </h1>

            {rides.length === 0 ? (
                <div className="text-center text-gray-500 mt-10 bg-surface-container p-8 rounded-3xl">
                    No rides recorded yet. Time to get on the bike!
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {rides.map((ride, index) => (
                        <motion.div
                            key={ride.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => nav(`/ride/${ride.id}`)}
                            className="bg-surface p-4 rounded-3xl shadow-lg border border-gray-800/50 cursor-pointer active:scale-95 transition-transform"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="text-sm text-gray-400 font-medium mb-1">
                                        {new Date(ride.start_time).toLocaleDateString(undefined, {
                                            weekday: 'short', month: 'short', day: 'numeric'
                                        })}
                                    </div>
                                    <div className="text-2xl font-black text-gray-100">
                                        {ride.total_distance_km.toFixed(1)} <span className="text-base font-medium text-gray-500">km</span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-gray-400">
                                    <ChevronRight size={20} />
                                </div>
                            </div>

                            <div className="flex gap-4 text-sm font-medium text-gray-300">
                                <span className="flex items-center gap-1 bg-surface-container px-2 py-1 rounded-lg">
                                    <Activity size={14} className="text-primary" /> {formatDuration(ride.moving_time_seconds)}
                                </span>
                                <span className="flex items-center gap-1 bg-surface-container px-2 py-1 rounded-lg">
                                    <Zap size={14} className="text-yellow-400" /> {ride.avg_power_watts}W
                                </span>
                                <span className="flex items-center gap-1 bg-surface-container px-2 py-1 rounded-lg">
                                    <Mountain size={14} className="text-blue-400" /> {Math.round(ride.elevation_gain)}m
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
