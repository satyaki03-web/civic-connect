import React, { useMemo, useState } from 'react';
import { useReports } from '../context/ReportContext';
import { Report, Status } from '../types';
import { MapPin, AlertTriangle, TrendingUp, CheckCircle, Clock, ChevronDown, X, BarChart2, Calendar, Activity, LogOut } from 'lucide-react';
import { BarChart, Bar, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatDistanceToNow, format } from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'motion/react';

const createIcon = (status: Status) => {
  const color = status === 'Resolved' ? '#2E7D32' : status === 'In Progress' ? '#FFC107' : '#D32F2F'; // Trust Green, Alert Amber, Error Red
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4);"></div>`,
    className: 'custom-leaflet-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
};

export default function AdminDashboard({ onLogout }: { onLogout?: () => void }) {
  const { reports, updateReportStatus } = useReports();
  const [activeModal, setActiveModal] = useState<'active' | 'highPriority' | 'resolved' | null>(null);

  const stats = useMemo(() => {
    const resolved = reports.filter(r => r.status === 'Resolved').length;
    const active = reports.filter(r => r.status !== 'Resolved').length;
    const highPriority = reports.filter(r => r.priority === 'High' && r.status !== 'Resolved').length;
    
    const categories: Record<string, number> = {};
    reports.forEach(r => {
      categories[r.category] = (categories[r.category] || 0) + 1;
    });
    
    const chartData = Object.entries(categories).map(([name, count]) => ({ name, count }));
    
    return { resolved, active, highPriority, chartData };
  }, [reports]);

  const columns: { title: string; status: Status; color: string }[] = [
    { title: 'New Reports', status: 'Reported', color: 'bg-[#D32F2F]' },
    { title: 'In Progress', status: 'In Progress', color: 'bg-[#FFC107]' },
    { title: 'Resolved', status: 'Resolved', color: 'bg-[#2E7D32]' },
  ];

  const handleStatusChange = (reportId: string, newStatus: Status) => {
    updateReportStatus(reportId, newStatus);
  };

  // Helper for generating realistic mock progress data
  const getMockProgress = (report: Report) => {
    if (report.status === 'Resolved') return { percent: 100, label: 'Completed', eta: '0h' };
    if (report.status === 'In Progress') return { percent: Math.floor(Math.random() * 40) + 30, label: 'Work Underway', eta: report.priority === 'High' ? '4h 30m' : '1d 12h' };
    return { percent: 10, label: 'Pending Assessment', eta: report.priority === 'High' ? '12h 0m' : '3d 0h' };
  };

  const renderModalContent = () => {
    let filteredReports = [];
    let title = '';
    
    if (activeModal === 'active') {
      filteredReports = reports.filter(r => r.status !== 'Resolved');
      title = 'Active Issues Tracking';
    } else if (activeModal === 'highPriority') {
      filteredReports = reports.filter(r => r.priority === 'High' && r.status !== 'Resolved');
      title = 'High Priority Triage';
    } else if (activeModal === 'resolved') {
      filteredReports = reports.filter(r => r.status === 'Resolved');
      title = 'Resolved Issues Log (Last 30 Days)';
    }

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 bg-white w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 font-medium mt-1">Detailed operational progress and estimated completion times.</p>
          </div>
          <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
          <div className="space-y-4">
            {filteredReports.map(report => {
              const progress = getMockProgress(report);
              return (
                <div key={report.id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 hover:shadow-md transition-shadow">
                  <div className="w-full md:w-32 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    <img src={report.imageUrl} alt={report.category} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{report.category}</h3>
                        <p className="text-sm text-gray-500 line-clamp-1">{report.description}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${report.priority === 'High' ? 'text-red-700 bg-red-50' : 'text-gray-700 bg-gray-100'}`}>
                        {report.priority}
                      </span>
                    </div>
                    
                    {/* Progress tracking section */}
                    <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-blue-500" />
                          {progress.label}
                        </span>
                        <span className="text-xs font-bold text-gray-900">{progress.percent}% Done</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3 overflow-hidden">
                        <div className={`h-2 rounded-full ${report.status === 'Resolved' ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${progress.percent}%` }}></div>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> EST. Time Left: <strong className="text-gray-900">{progress.eta}</strong></span>
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Logged: {format(new Date(report.timestamp), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredReports.length === 0 && (
              <div className="text-center py-12 text-gray-500 font-medium">No reports match this criteria.</div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen font-inter">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-[#2E7D32] p-2.5 rounded-xl shadow-sm">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">Civic Connect</h1>
            <p className="text-sm text-gray-500 font-medium">Municipal Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="px-3 py-1.5 bg-green-50 border border-green-100 rounded-lg text-sm font-semibold text-green-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            System Live
          </div>
          <div className="flex items-center gap-3 border-l border-gray-200 pl-5">
            <div className="w-10 h-10 rounded-full border-2 border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden">
              <img src="https://ui-avatars.com/api/?name=Admin&background=2E7D32&color=fff" alt="Admin" className="w-full h-full object-cover" />
            </div>
            <button onClick={onLogout} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Sign Out">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto w-full space-y-6 flex-1">
        {/* Analytics Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <button onClick={() => setActiveModal('active')} className="text-left w-full transition-transform hover:-translate-y-1">
            <StatCard title="Active Issues" value={stats.active} icon={<AlertTriangle />} trend="Click to view progress & ETA" color="text-[#FFC107]" bg="bg-amber-50" />
          </button>
          <button onClick={() => setActiveModal('highPriority')} className="text-left w-full transition-transform hover:-translate-y-1">
            <StatCard title="High Priority" value={stats.highPriority} icon={<TrendingUp />} trend="Needs immediate triage" color="text-[#D32F2F]" bg="bg-red-50" />
          </button>
          <button onClick={() => setActiveModal('resolved')} className="text-left w-full transition-transform hover:-translate-y-1">
            <StatCard title="Resolved (30d)" value={stats.resolved} icon={<CheckCircle />} trend="Avg res time: 24h" color="text-[#2E7D32]" bg="bg-green-50" />
          </button>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 col-span-1 md:col-span-1">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Issues by Category</h3>
            <div className="h-20 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData}>
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Pothole' ? '#FFC107' : '#2E7D32'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Modal Overlay */}
        <AnimatePresence>
          {activeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setActiveModal(null)}
              />
              {renderModalContent()}
            </div>
          )}
        </AnimatePresence>

        {/* Main Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Interactive Map */}
          <div className="col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden relative">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between z-10 bg-white">
              <h2 className="font-bold text-gray-900 text-lg">Incident Map</h2>
              <span className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded-md">Live View</span>
            </div>
            <div className="flex-1 relative z-0">
              <MapContainer 
                center={[22.5726, 88.3639]} 
                zoom={13} 
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                zoomControl={true}
              >
                <LayersControl position="topright">
                  <LayersControl.BaseLayer checked name="Street View">
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                  </LayersControl.BaseLayer>
                  <LayersControl.BaseLayer name="Satellite">
                    <TileLayer
                      attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                  </LayersControl.BaseLayer>
                </LayersControl>
                
                {reports.map((report) => (
                  <Marker 
                    key={report.id} 
                    position={[report.location.lat, report.location.lng]}
                    icon={createIcon(report.status)}
                  >
                    <Popup className="rounded-xl overflow-hidden font-inter border-0 shadow-xl p-0 m-0">
                      <div className="p-3 w-48">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${report.priority === 'High' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                            {report.priority}
                          </span>
                          <span className="text-[10px] font-bold text-gray-500 uppercase">{report.status}</span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm mb-1">{report.category}</h3>
                        <p className="text-xs text-gray-600 line-clamp-3 m-0 leading-relaxed">{report.description}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Incident Triage Panel (Kanban) */}
          <div className="col-span-1 lg:col-span-2 flex gap-5 overflow-x-auto pb-2">
            {columns.map(column => (
              <div key={column.status} className="flex-1 min-w-[280px] bg-gray-100/50 rounded-2xl border border-gray-200 flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${column.color} shadow-sm`}></span>
                    <h3 className="font-bold text-gray-900">{column.title}</h3>
                  </div>
                  <span className="text-xs font-bold bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-lg shadow-sm">
                    {reports.filter(r => r.status === column.status).length}
                  </span>
                </div>
                
                <div className="flex-1 p-3 overflow-y-auto space-y-3">
                  {reports.filter(r => r.status === column.status).map(report => (
                    <div key={report.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all cursor-default">
                      <div className="flex items-start justify-between mb-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${report.priority === 'High' ? 'text-red-700 bg-red-50' : 'text-gray-700 bg-gray-100'}`}>
                          {report.priority}
                        </span>
                        <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(report.timestamp))}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 mb-1.5">{report.category}</h4>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{report.description}</p>
                      
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {report.location.address.split(',')[0]}
                        </span>
                        
                        <div className="relative group">
                          <button className="text-[11px] font-bold px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-md flex items-center gap-1 transition-colors">
                            Move <ChevronDown className="w-3 h-3" />
                          </button>
                          <div className="absolute right-0 bottom-full mb-1 w-36 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden hidden group-hover:block z-20">
                            {['Reported', 'In Progress', 'Resolved'].map(s => (
                              s !== report.status && (
                                <button 
                                  key={s}
                                  onClick={() => handleStatusChange(report.id, s as Status)}
                                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                >
                                  Move to {s}
                                </button>
                              )
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, trend, color, bg }: { title: string, value: number, icon: React.ReactNode, trend: string, color: string, bg: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex items-start justify-between">
      <div>
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">{title}</h3>
        <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
        <p className="text-xs text-gray-500 mt-2 font-medium">{trend}</p>
      </div>
      <div className={`p-3 rounded-xl ${bg} ${color}`}>
        {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
      </div>
    </div>
  );
}
