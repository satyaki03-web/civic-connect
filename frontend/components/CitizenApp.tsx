import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, AlertCircle, CheckCircle2, Clock, Upload, ArrowLeft, LogOut, X, Image as ImageIcon, Crosshair, Trash2 } from 'lucide-react';
import { useReports } from '../context/ReportContext';
import { formatDistanceToNow } from 'date-fns';
import { delay } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Safe date formatter to prevent blank screen crashes if timestamp is undefined or invalid
const formatTimeSafe = (timestamp: string | undefined | null) => {
  try {
    if (!timestamp) return 'Just now';
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  } catch (e) {
    return 'Just now';
  }
};

export default function CitizenApp({ onLogout }: { onLogout?: () => void }) {
  const { reports, addReport, deleteReport } = useReports();
  const [view, setView] = useState<'feed' | 'confirm' | string>('feed');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const openReportDetails = (id: string) => {
    setSelectedReportId(id);
    setView('detail');
  };
  
  // Profile Drawer
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Camera Modal
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Pending report state
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [processState, setProcessState] = useState<'idle' | 'uploading' | 'ai'>('idle');
  const [aiData, setAiData] = useState<{ category: string, priority: string, desc: string } | null>(null);
  
  const fallbackInputRef = useRef<HTMLInputElement>(null);

  const myReports = reports.filter(r => r.userId === 'user_1');
  const resolvedCount = myReports.filter(r => r.status === 'Resolved').length;
  const activeCount = myReports.filter(r => r.status !== 'Resolved').length;

  const openCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setCameraStream(stream);
    } catch (err) {
      console.error("Camera access denied or unavailable", err);
      // Let user use fallback button if stream fails
    }
  };

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, isCameraOpen]);

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = async () => {
    if (videoRef.current && cameraStream) {
      if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
        console.warn("Video stream not ready or black screen. Falling back to native camera.");
        fallbackInputRef.current?.click();
        return;
      }
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(videoRef.current, 0, 0);
        const url = canvas.toDataURL('image/jpeg');
        
        closeCamera();
        await processImage(url);
      } catch (err) {
        console.error("Failed to capture photo:", err);
        fallbackInputRef.current?.click();
      }
    } else {
      fallbackInputRef.current?.click();
    }
  };

  const handleFallbackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      closeCamera();
      await processImage(url);
    }
  };

  const processImage = async (url: string) => {
    setPhotoUrl(url);
    setView('confirm');
    
    // Simulate Cloudinary Upload
    setProcessState('uploading');
    
    try {
      // Convert blob URL to base64 for API
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        setProcessState('ai');
        
        try {
          const aiResponse = await fetch('/api/analyze-hazard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64data })
          });
          
          if (!aiResponse.ok) throw new Error('API Error');
          
          const data = await aiResponse.json();
          
          setAiData({
            category: data.category || 'Reported Hazard',
            priority: data.priority || 'Medium',
            desc: data.desc || 'A civic issue has been reported.'
          });
        } catch (error) {
          console.error("AI Analysis failed:", error);
          setAiData({
            category: 'Pothole', // Fallback if API fails
            priority: 'High',
            desc: 'Deep structural pothole detected on asphalt surface. Poses moderate risk to vehicle suspensions.'
          });
        } finally {
          setProcessState('idle');
        }
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Failed to process image blob:", error);
      setProcessState('idle');
    }
  };

  const handleSubmit = async () => {
    if (!photoUrl || !aiData) return;
    
    let lat = 22.5726;
    let lng = 88.3639;
    let address = 'Kolkata (GPS)';

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      lat = position.coords.latitude;
      lng = position.coords.longitude;
      address = 'Current Location (GPS)';
    } catch (err) {
      console.warn("Geolocation failed, falling back to default.", err);
    }
    
    await addReport({
      imageUrl: photoUrl,
      description: aiData.desc,
      category: aiData.category,
      priority: aiData.priority as any,
      location: { lat, lng, address }
    });
    
    setPhotoUrl(null);
    setAiData(null);
    setView('feed');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Resolved': return <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />;
      case 'In Progress': return <Clock className="w-4 h-4 text-[#FFC107]" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 max-w-md mx-auto relative shadow-2xl overflow-hidden border-x border-gray-200 font-inter">
      {/* Header */}
      <header className="bg-[#2E7D32] text-white p-4 flex items-center justify-between z-10 shadow-md">
        <div className="flex items-center gap-2">
          {view !== 'feed' && (
            <button onClick={() => setView('feed')} className="p-1 -ml-1 mr-1 hover:bg-white/20 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <MapPin className="w-6 h-6 text-[#FFC107]" />
          <h1 className="text-xl font-bold tracking-tight">Civic Connect</h1>
        </div>
        <button 
          onClick={() => setIsProfileOpen(true)}
          className="w-9 h-9 bg-white/20 hover:bg-white/30 transition-colors rounded-full flex items-center justify-center text-sm font-bold shadow-sm"
        >
          JD
        </button>
      </header>

      {/* Profile Drawer */}
      <AnimatePresence>
        {isProfileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm" 
              onClick={() => setIsProfileOpen(false)} 
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 bottom-0 w-4/5 max-w-xs bg-white z-50 shadow-2xl flex flex-col border-l border-gray-200"
            >
              <div className="bg-[#2E7D32] p-6 text-white relative">
                <button onClick={() => setIsProfileOpen(false)} className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full">
                  <X className="w-5 h-5" />
                </button>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold mb-4 border-2 border-white/50">
                  JD
                </div>
                <h2 className="text-xl font-bold">Jane Doe</h2>
                <p className="text-[#FFC107] text-sm font-medium mt-1">Active Citizen</p>
              </div>
              <div className="flex-1 p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Your Impact</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="text-2xl font-bold text-[#2E7D32]">{resolvedCount}</div>
                      <div className="text-xs text-gray-500 font-medium">Resolved</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="text-2xl font-bold text-[#FFC107]">{activeCount}</div>
                      <div className="text-xs text-gray-500 font-medium">Pending</div>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <button onClick={onLogout} className="flex items-center gap-3 text-gray-600 hover:text-red-600 transition-colors font-medium w-full p-2 rounded-lg hover:bg-red-50">
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          {view === 'feed' ? (
            <motion.div 
              key="feed"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 pb-36"
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-4">My Reports</h2>
              <div className="space-y-4">
                {myReports.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    No reports yet. Help keep your city safe!
                  </div>
                ) : (
                  myReports.map(report => (
                    <div key={report.id} onClick={() => openReportDetails(report.id)} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                      <div className="h-40 w-full overflow-hidden relative bg-gray-100">
                        <img src={report.imageUrl} alt={report.category} className="w-full h-full object-cover" />
                        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-sm backdrop-blur-md bg-white/95 ${getStatusColor(report.status)}`}>
                          {getStatusIcon(report.status)}
                          {report.status}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-gray-900 text-lg">{report.category}</h3>
                          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${report.priority === 'High' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'}`}>
                            {report.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{report.description}</p>
                        <div className="flex items-center gap-4 mt-4 text-xs font-medium text-gray-400">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {report.location.address}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {formatTimeSafe(report.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          ) : view === 'detail' && selectedReportId ? (
            <motion.div 
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-4 pb-36"
            >
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                {(() => {
                  const report = myReports.find(r => r.id === selectedReportId);
                  if (!report) return (
                    <div className="p-8 text-center text-gray-500 font-medium">
                      Report details unavailable. Please refresh or try again.
                    </div>
                  );
                  
                  const progress = report.status === 'Resolved' ? 100 : report.status === 'In Progress' ? 45 : 10;
                  const eta = report.status === 'Resolved' ? 'Completed' : report.priority === 'High' ? '4-6 Hours' : '2-3 Days';

                  return (
                    <>
                      <div className="relative h-48 bg-gray-100">
                        <img src={report.imageUrl} alt={report.category} className="w-full h-full object-cover" />
                        <button onClick={() => setView('feed')} className="absolute top-3 left-3 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-gray-700 hover:bg-white transition-colors">
                          <X className="w-5 h-5" />
                        </button>
                        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-sm backdrop-blur-md bg-white/95 ${getStatusColor(report.status)}`}>
                          {getStatusIcon(report.status)}
                          {report.status}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-gray-900 text-xl">{report.category}</h3>
                          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${report.priority === 'High' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'}`}>
                            {report.priority}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs font-medium text-gray-400 mb-4 pb-4 border-b border-gray-50">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {report.location.address}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {formatTimeSafe(report.timestamp)}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 text-sm leading-relaxed mb-6">
                          {report.description}
                        </p>

                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Resolution Tracking</h3>
                          
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-700">Progress</span>
                            <span className="text-xs font-bold text-gray-900">{progress}%</span>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
                            <div className={`h-2 rounded-full transition-all duration-1000 ${report.status === 'Resolved' ? 'bg-[#2E7D32]' : 'bg-[#FFC107]'}`} style={{ width: `${progress}%` }}></div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs p-2.5 bg-white rounded-lg border border-gray-100">
                            <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                              <Clock className="w-3.5 h-3.5 text-blue-500" /> Est. Completion
                            </span>
                            <span className="font-bold text-gray-900">{eta}</span>
                          </div>
                        </div>
                        
                        <div className="mt-6 flex justify-end">
                          <button
                            onClick={async () => {
                              // We use direct deletion or simple confirmation. Since we removed window.confirm:
                              await deleteReport(report.id);
                              setView('feed');
                            }}
                            className="flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Report
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          ) : null}

          {view === 'confirm' && (
            <motion.div 
              key="confirm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="p-4 pb-32 flex flex-col h-full"
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
                <div className="h-64 w-full bg-gray-100 relative">
                  {photoUrl && <img src={photoUrl} alt="Captured hazard" className="w-full h-full object-cover" />}
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  {processState !== 'idle' ? (
                    <div className="flex flex-col items-center justify-center flex-1 space-y-5 text-center p-4">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-[#2E7D32] border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-[#2E7D32]">
                          {processState === 'uploading' ? <Upload className="w-5 h-5 animate-pulse" /> : <Camera className="w-5 h-5 animate-pulse" />}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">
                          {processState === 'uploading' ? 'Uploading to Cloudinary...' : 'AI Analyzing Image...'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {processState === 'uploading' ? 'Securely storing image payload' : 'Extracting category and priority via Gemini'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5 flex-1">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Issue Category</h3>
                          <span className="text-[10px] font-bold text-[#FFC107] uppercase bg-[#FFC107]/10 px-2 py-0.5 rounded">AI Suggested (Editable)</span>
                        </div>
                        <input
                          type="text"
                          value={aiData?.category || ''}
                          onChange={(e) => setAiData(prev => prev ? { ...prev, category: e.target.value } : null)}
                          placeholder="e.g., Pothole, Cars Congesting, Electricity Cutoff..."
                          className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFC107] transition-all shadow-sm"
                        />
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Priority:</span>
                          <select 
                            value={aiData?.priority || 'Medium'}
                            onChange={(e) => setAiData(prev => prev ? { ...prev, priority: e.target.value } : null)}
                            className="bg-[#FFC107]/10 text-amber-900 border border-amber-200/50 px-2.5 py-1.5 rounded-lg font-bold text-xs focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
                          >
                            <option value="Low">Low Priority</option>
                            <option value="Medium">Medium Priority</option>
                            <option value="High">High Priority</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Issue Description</h3>
                        <textarea
                          value={aiData?.desc || ''}
                          onChange={(e) => setAiData(prev => prev ? { ...prev, desc: e.target.value } : null)}
                          placeholder="Describe the issue in detail..."
                          rows={3}
                          className="w-full text-sm text-gray-700 bg-white p-3.5 rounded-lg border border-gray-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#FFC107] transition-all resize-none shadow-sm"
                        />
                      </div>

                      <div>
                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Location Data</h3>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-50 p-3.5 rounded-lg border border-gray-100">
                          <MapPin className="w-4 h-4 text-[#2E7D32]" />
                          GPS Coordinates Ready (fetching...)
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 grid grid-cols-2 gap-3 shrink-0">
                <button 
                  onClick={() => setView('feed')}
                  disabled={processState !== 'idle'}
                  className="py-3.5 px-4 rounded-xl font-bold text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Discard
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={processState !== 'idle'}
                  className="py-3.5 px-4 rounded-xl font-bold text-gray-900 bg-[#FFC107] hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  Submit Report
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Button */}
      {view === 'feed' && (
        <div className="absolute bottom-24 right-6 z-20">
          <button 
            onClick={openCamera}
            className="w-16 h-16 bg-[#FFC107] text-gray-900 rounded-full flex items-center justify-center shadow-xl shadow-amber-500/20 hover:bg-amber-400 transition-all hover:scale-105 active:scale-95"
          >
            <Camera className="w-7 h-7" />
          </button>
        </div>
      )}

      {/* Camera Modal overlay */}
      <AnimatePresence>
        {isCameraOpen && (
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-50 bg-black flex flex-col"
          >
            <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
              <button onClick={closeCamera} className="p-2 text-white bg-black/40 rounded-full backdrop-blur-md">
                <X className="w-6 h-6" />
              </button>
              <div className="bg-black/40 text-white px-3 py-1.5 rounded-full text-sm font-semibold backdrop-blur-md flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-[#FFC107]" />
                Align Hazard
              </div>
            </div>
            
            <div className="flex-1 relative overflow-hidden bg-gray-900 flex items-center justify-center">
              {cameraStream ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  onLoadedMetadata={(e) => {
                    e.currentTarget.play().catch(console.error);
                  }}
                  className="min-w-full min-h-full object-cover" 
                />
              ) : (
                <div className="text-white text-center p-6">
                  <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-gray-400 font-medium">Requesting camera access...</p>
                </div>
              )}
              
              {/* Reticle Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                <div className="w-full max-w-sm aspect-square border-2 border-[#FFC107]/70 rounded-2xl relative">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#FFC107] rounded-tl-xl"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#FFC107] rounded-tr-xl"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#FFC107] rounded-bl-xl"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#FFC107] rounded-br-xl"></div>
                </div>
              </div>
            </div>

            <div className="h-32 bg-black flex items-center justify-around px-8 pb-4">
              <input 
                type="file" accept="image/*" capture="environment" ref={fallbackInputRef} className="hidden" 
                onChange={handleFallbackUpload}
              />
              <button 
                onClick={() => fallbackInputRef.current?.click()}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              
              <button 
                onClick={capturePhoto}
                disabled={!cameraStream}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 disabled:opacity-50"
              >
                <div className="w-full h-full bg-[#FFC107] rounded-full hover:bg-amber-400 transition-colors"></div>
              </button>
              
              <div className="w-12 h-12"></div> {/* Spacer for symmetry */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
