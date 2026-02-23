import { useState, useEffect } from 'react';
import { Upload, Download, Map as MapIcon, BarChart2, ChevronRight, Settings as Icon, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { uploadGPX, getRoutes, deleteRoute } from '../api';

export default function Settings() {
    const nav = useNavigate();
    const [uploading, setUploading] = useState(false);
    const [routes, setRoutes] = useState<any[]>([]);

    useEffect(() => {
        loadRoutes();
    }, []);

    const loadRoutes = () => {
        getRoutes().then(setRoutes).catch(console.error);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setUploading(true);
        try {
            await uploadGPX(e.target.files[0]);
            alert("GPX imported successfully!");
        } catch (err) {
            alert("Failed to import GPX.");
        }
        setUploading(false);
    };

    const handleDeleteRoute = async (id: number) => {
        if (confirm("Delete this route?")) {
            await deleteRoute(id);
            loadRoutes();
        }
    };

    return (
        <div className="flex flex-col bg-[#111318] text-[#e2e2e6] min-h-screen pb-24">
            <header className="px-6 py-4 border-b border-[#222]">
                <span className="text-xl font-medium">Settings</span>
            </header>

            <main className="p-4 flex flex-col gap-3">
                <div 
                    onClick={() => nav('/statistics')}
                    className="bg-[#1E2128] p-4 rounded-2xl flex items-center gap-4 cursor-pointer active:bg-[#2A2D35]"
                >
                    <BarChart2 className="text-[#c4c6cf]" />
                    <div className="flex-1">
                        <div className="text-base font-medium">Statistics</div>
                        <div className="text-xs text-[#888]">All-time totals and records</div>
                    </div>
                    <ChevronRight className="text-[#666]" />
                </div>

                <div 
                    onClick={() => nav('/planner')}
                    className="bg-[#1E2128] p-4 rounded-2xl flex items-center gap-4 cursor-pointer active:bg-[#2A2D35]"
                >
                    <MapIcon className="text-[#c4c6cf]" />
                    <div className="flex-1">
                        <div className="text-base font-medium">Route Planner</div>
                        <div className="text-xs text-[#888]">Create routes with elevation</div>
                    </div>
                    <ChevronRight className="text-[#666]" />
                </div>

                <div 
                    onClick={() => nav('/export')}
                    className="bg-[#1E2128] p-4 rounded-2xl flex items-center gap-4 cursor-pointer active:bg-[#2A2D35]"
                >
                    <Download className="text-[#c4c6cf]" />
                    <div className="flex-1">
                        <div className="text-base font-medium">Export for AI</div>
                        <div className="text-xs text-[#888]">Generate .txt for training plans</div>
                    </div>
                    <ChevronRight className="text-[#666]" />
                </div>

                <label className="bg-[#1E2128] p-4 rounded-2xl flex items-center gap-4 cursor-pointer active:bg-[#2A2D35] mt-2">
                    <Upload className="text-[#c4c6cf]" />
                    <div className="flex-1">
                        <div className="text-base font-medium">{uploading ? "Importing..." : "Import GPX Route"}</div>
                        <div className="text-xs text-[#888]">Add past rides to your history</div>
                    </div>
                    <input type="file" accept=".gpx" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>

                <h3 className="mt-6 text-xs text-[#888] font-bold tracking-widest uppercase px-2 mb-1">Saved Routes</h3>
                
                {routes.length === 0 ? (
                    <div className="p-4 text-[#888] text-center bg-[#1E2128] rounded-2xl">No saved routes</div>
                ) : (
                    routes.map(r => (
                        <div key={r.id} className="bg-[#1E2128] p-4 rounded-2xl mb-2 flex justify-between items-center">
                            <div>
                                <div className="font-semibold text-base">{r.name}</div>
                                <div className="text-xs text-[#c4c6cf] mt-1">{r.distance.toFixed(1)} km • {Math.round(r.elevation)}m elev</div>
                            </div>
                            <button onClick={() => handleDeleteRoute(r.id)} className="text-[#ffb4ab] p-2 bg-[#93000a] rounded-full">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}
