import { useEffect, useState } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getHistory, exportText } from '../api';

export default function Export() {
    const nav = useNavigate();
    const [rides, setRides] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        getHistory().then(data => {
            setRides(data);
            setSelectedIds(new Set(data.map((r: any) => r.id)));
        }).catch(console.error);
    }, []);

    const toggleSelection = (id: number) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleDownload = async () => {
        if (selectedIds.size === 0) return;
        try {
            const blob = await exportText(Array.from(selectedIds));
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `training_data_${new Date().toISOString().slice(0,10)}.txt`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (e) {
            alert("Export failed");
        }
    };

    return (
        <div className="flex flex-col bg-[#111318] text-[#e2e2e6] min-h-screen pb-[120px]">
            <header className="px-4 py-4 flex items-center gap-4 border-b border-[#222] bg-[#111318] sticky top-0 z-10">
                <button onClick={() => nav(-1)} className="p-2"><ArrowLeft /></button>
                <div className="flex-1">
                    <h1 className="text-xl font-medium">Export Data</h1>
                    <div className="text-xs text-[#888]">Generate training plans for AI</div>
                </div>
            </header>

            <main className="p-4 flex-1">
                <div className="flex justify-between items-center px-2 mb-3 text-xs font-bold text-[#a8c7fa] uppercase tracking-wide">
                    <span>Recent Rides</span>
                    <span>{rides.length} found</span>
                </div>
                
                <div className="flex flex-col gap-2">
                    {rides.length === 0 ? (
                        <div className="p-8 text-center text-[#666]">No rides found.</div>
                    ) : (
                        rides.map(ride => {
                            const isSelected = selectedIds.has(ride.id);
                            return (
                                <div 
                                    key={ride.id} 
                                    onClick={() => toggleSelection(ride.id)}
                                    className={`p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-colors ${isSelected ? 'bg-[#2A2D35]' : 'bg-[#1E2128]'}`}
                                >
                                    <div className={`w-6 h-6 rounded flex items-center justify-center border-2 ${isSelected ? 'bg-[#a8c7fa] border-[#a8c7fa]' : 'border-[#c4c6cf]'}`}>
                                        {isSelected && <span className="text-[#003062] font-bold text-sm">✓</span>}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-[16px]">{new Date(ride.start_time).toLocaleDateString(undefined, {weekday: 'short', month:'short', day:'numeric'})}</div>
                                        <div className="text-[13px] text-[#c4c6cf] mt-1">{ride.total_distance_km.toFixed(1)} km • {Math.round(ride.elevation_gain)}m elev</div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>

            <div className="fixed bottom-[80px] left-0 right-0 bg-[#2A2D35] p-4 rounded-t-3xl flex justify-between items-center shadow-[0_-4px_10px_rgba(0,0,0,0.4)] z-20">
                <div className="text-sm font-medium text-[#e2e2e6] ml-2">{selectedIds.size} rides selected</div>
                <button 
                    onClick={handleDownload} 
                    disabled={selectedIds.size === 0}
                    className="bg-[#a8c7fa] text-[#003062] h-12 px-5 rounded-2xl font-bold flex items-center gap-2 disabled:opacity-50 active:scale-95"
                >
                    <Download size={18} /> Download
                </button>
            </div>
        </div>
    );
}
