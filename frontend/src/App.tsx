import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Compass, History as HistoryIcon, Map as MapIcon, Settings as SettingsIcon } from 'lucide-react';
import Dashboard from './components/Dashboard';
import History from './components/History';
import RideDetail from './components/RideDetail';
import Planner from './components/Planner';
import Settings from './components/Settings';

const BottomNav = () => {
  const loc = useLocation();
  const isActive = (path: string) => loc.pathname === path ? "text-primary" : "text-gray-400";

  return (
    <nav className="fixed bottom-0 w-full bg-surface border-t border-gray-800 h-20 flex justify-around items-center z-50">
      <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/')}`}>
        <Compass size={24} /> <span className="text-xs font-medium">Ride</span>
      </Link>
      <Link to="/history" className={`flex flex-col items-center gap-1 ${isActive('/history')}`}>
        <HistoryIcon size={24} /> <span className="text-xs font-medium">History</span>
      </Link>
      <Link to="/settings" className={`flex flex-col items-center gap-1 ${isActive('/settings')}`}>
        <SettingsIcon size={24} /> <span className="text-xs font-medium">Settings</span>
      </Link>
    </nav>
  );
}

export default function App() {
  return (
    <div className="bg-background text-gray-100 min-h-screen pb-20 font-sans">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/ride/:id" element={<RideDetail />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </div>
  );
}
