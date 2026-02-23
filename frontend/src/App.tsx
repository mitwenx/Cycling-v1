
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Compass, History as HistoryIcon, Map as MapIcon, Settings as SettingsIcon } from 'lucide-react';
import Dashboard from './components/Dashboard';
import History from './components/History';
import RideDetail from './components/RideDetail';
import Planner from './components/Planner';
import Settings from './components/Settings';
import Statistics from './components/Statistics';
import Export from './components/Export';

const BottomNav = () => {
  const loc = useLocation();
  const isActive = (path: string) => loc.pathname === path ? "text-[#a8c7fa]" : "text-[#c4c6cf]";

  return (
    <nav className="fixed bottom-0 w-full bg-[#1E2128] border-t border-[#333] h-[80px] flex justify-around items-center z-50 pb-2">
      <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/')} w-16`}>
        <Compass size={24} /> <span className="text-[12px] font-medium">Ride</span>
      </Link>
      <Link to="/history" className={`flex flex-col items-center gap-1 ${isActive('/history')} w-16`}>
        <HistoryIcon size={24} /> <span className="text-[12px] font-medium">History</span>
      </Link>
      <Link to="/settings" className={`flex flex-col items-center gap-1 ${isActive('/settings')} w-16`}>
        <SettingsIcon size={24} /> <span className="text-[12px] font-medium">Settings</span>
      </Link>
    </nav>
  );
}

export default function App() {
  return (
    <div className="bg-[#111318] text-[#e2e2e6] min-h-screen font-sans selection:bg-[#a8c7fa] selection:text-[#003062]">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/ride/:id" element={<RideDetail />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/export" element={<Export />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </div>
  );
}
