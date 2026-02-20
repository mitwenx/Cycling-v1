import { useState } from 'react';
import { Upload, FileDown, Settings as Icon } from 'lucide-react';
import { uploadGPX } from '../api';

export default function Settings() {
    const = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setUploading(true);
        try {
            await uploadGPX(e.target.files);
            alert("GPX imported successfully!");
        } catch (err) {
            alert("Failed to import GPX.");
        }
        setUploading(false);
    };

    return (
        <div className="p-6 flex flex-col gap-6">
            <h1 className="text-3xl font-black tracking-tight mb-4 flex items-center gap-3"><Icon/> Settings</h1>
            
            <div className="bg-surface rounded-3xl p-6">
                <h3 className="text-lg font-bold mb-4">Data Management</h3>
                
                <label className="flex items-center gap-4 bg-surface-container p-4 rounded-2xl cursor-pointer active:bg-gray-700 transition-colors mb-4">
                    <div className="p-3 bg-primary/20 text-primary rounded-xl"><Upload size={24}/></div>
                    <div className="flex-1">
                        <div className="font-bold">Import GPX Route</div>
                        <div className="text-xs text-gray-400">Add past rides to your history</div>
                    </div>
                    <input type="file" accept=".gpx" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>

                <button className="w-full flex items-center gap-4 bg-surface-container p-4 rounded-2xl active:bg-gray-700 transition-colors">
                    <div className="p-3 bg-secondary/20 text-secondary rounded-xl"><FileDown size={24}/></div>
                    <div className="flex-1 text-left">
                        <div className="font-bold">Export AI Training Data</div>
                        <div className="text-xs text-gray-400">Generate a text summary of your progress</div>
                    </div>
                </button>
            </div>
        </div>
    );
}
