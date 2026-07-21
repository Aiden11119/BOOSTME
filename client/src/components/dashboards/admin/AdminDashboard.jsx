import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import UserManagement from './UserManagement';
import AnnouncementManagement from './AnnouncementManagement';
import toast from 'react-hot-toast';

function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState({ users: [], appointments: [] });
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch stats');
      }
    };

    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings');
        if (res.data.maintenance_mode === 'true') {
          setMaintenanceMode(true);
        }
      } catch (err) {
        console.error('Failed to fetch settings');
      }
    };

    fetchStats();
    fetchSettings();
  }, []);

  const toggleMaintenanceMode = async () => {
    const newStatus = !maintenanceMode;
    const confirmMsg = newStatus 
      ? 'Are you sure you want to ENABLE Maintenance Mode? All non-admin users will be blocked from logging in.'
      : 'Are you sure you want to DISABLE Maintenance Mode? Normal users will be able to log in again.';
      
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.put('/admin/settings/maintenance', { maintenance_mode: newStatus });
      setMaintenanceMode(newStatus);
      toast.success(newStatus ? 'Maintenance mode enabled' : 'Maintenance mode disabled');
    } catch (err) {
      toast.error('Failed to update maintenance mode');
    }
  };

  const totalUsers = stats.users.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="flex h-[calc(100vh-72px)] bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-slate-800 text-white flex flex-col h-full overflow-y-auto">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold">Admin Portal</h2>
          <p className="text-slate-400 text-sm mt-1">Welcome, {user?.full_name || 'Admin'}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
          >
            👥 Users Management
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${activeTab === 'announcements' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
          >
            📢 Announcements
          </button>
        </nav>
        
        <div className="p-4 mt-auto border-t border-slate-700">
          <div className="bg-slate-700/50 p-4 rounded-xl">
            <h3 className="text-sm font-semibold text-slate-200 mb-2">System Status</h3>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Maintenance Mode</span>
              <button 
                onClick={toggleMaintenanceMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${maintenanceMode ? 'bg-red-500' : 'bg-slate-500'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {maintenanceMode && <p className="text-[10px] text-red-400 mt-2 leading-tight">Users are blocked from logging in.</p>}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto h-full">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <p className="text-sm font-medium text-gray-500 uppercase">Total Users</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{totalUsers}</p>
          </div>
          
          {stats.users.map(u => (
            <div key={u.role} className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-indigo-500">
              <p className="text-sm font-medium text-gray-500 uppercase">{u.role}s</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{u.count}</p>
            </div>
          ))}
        </div>

        {/* Dynamic Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[500px]">
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'announcements' && <AnnouncementManagement />}
        </div>

      </main>
    </div>
  );
}

export default AdminDashboard;
