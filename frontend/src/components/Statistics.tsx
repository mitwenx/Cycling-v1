import { useEffect, useState } from 'react';
import { ArrowLeft, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStatistics } from '../api';

export default function Statistics() {
    const nav = useNavigate();
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        getStatistics().then(setStats).catch(console.error);
    }, []);

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    if (!stats) return <div className="p-8 text-center text-gray-400">Loading...</div>;

    return (
        <div className="flex flex-col bg-[#111318] text-[#e2e2e6] min-h-screen pb-24">
            <header className="px-4 py-4 flex items-center gap-4 border-b border-[#222]">
                <button onClick={() => nav(-1)} className="p-2"><ArrowLeft /></button>
                <h1 className="text-xl font-medium">Statistics</h1>
            </header>

            <main className="p-4">
                <h3 className="text-sm text-[#aaa] font-bold mb-3 mt-2 tracking-wide uppercase px-1">All Time</h3>
                <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                        <div className="flex-1 bg-[#1E2128] rounded-2xl p-4 flex flex-col items-center">
                            <span className="text-[11px] text-[#c4c6cf] uppercase tracking-wider font-bold">Distance</span>
                            <div className="mt-1"><span className="text-2xl font-bold">{stats.all_time.dist.toFixed(0)}</span> <span className="text-sm text-[#c4c6cf]">km</span></div>
                        </div>
                        <div className="flex-1 bg-[#1E2128] rounded-2xl p-4 flex flex-col items-center">
                            <span className="text-[11px] text-[#c4c6cf] uppercase tracking-wider font-bold">Hours</span>
                            <div className="mt-1"><span className="text-2xl font-bold">{formatDuration(stats.all_time.time)}</span></div>
                        </div>
                    </div>
                    <div className="bg-[#1E2128] rounded-2xl p-4 flex flex-col items-center">
                        <span className="text-[11px] text-[#c4c6cf] uppercase tracking-wider font-bold">Elevation Gain</span>
                        <div className="mt-1"><span className="text-2xl font-bold">{Math.round(stats.all_time.elev).toLocaleString()}</span> <span className="text-sm text-[#c4c6cf]">m</span></div>
                    </div>
                </div>

                <h3 className="text-sm text-[#aaa] font-bold mb-3 mt-8 tracking-wide uppercase px-1">Best Efforts</h3>
                <div className="flex flex-col gap-2">
                    {stats.records.length === 0 ? (
                        <div className="p-4 text-[#666] text-center bg-[#1E2128] rounded-2xl">No records yet.</div>
                    ) : (
                        stats.records.map((rec: any) => {
                            const s = Math.floor(rec.result_value % 60);
                            const m = Math.floor((rec.result_value / 60) % 60);
                            const h = Math.floor(rec.result_value / 3600);
                            let timeStr = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
                            if(h > 0) timeStr = `${h}:${timeStr}`;

                            return (
                                <div key={rec.id} className="bg-[#1E2128] p-4 rounded-2xl flex justify-between items-center">
                                    <div>
                                        <div className="font-semibold flex items-center gap-2">
                                            <Trophy size={16} className="text-[#FFD700]" />
                                            {rec.effort_type.replace('_',' ').replace('fastest ','').toUpperCase()}
                                        </div>
                                        <div className="text-xs text-[#c4c6cf] mt-1">{new Date(rec.date_achieved).toLocaleDateString()}</div>
                                    </div>
                                    <div className="text-lg font-bold">{timeStr}</div>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>
        </div>
    );
}
