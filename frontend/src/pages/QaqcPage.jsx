import React, { useState, useEffect, useCallback } from 'react';
import { User, Clock, Menu, HardHat, Camera, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import InspectionItem from '../components/InspectionItem';
import HeaderProfile from '../components/HeaderProfile';
import { getInspections, getInspectionSummary, seedInspections } from '../services/api';

const ZONES = ['All Zones', 'Zone A', 'Zone B', 'Zone C'];

const QaqcPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inspectionData, setInspectionData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedZone, setSelectedZone] = useState('All Zones');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);

  // Fetch inspections from API
  const fetchInspections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [inspRes, summaryRes] = await Promise.all([
        getInspections(selectedZone),
        getInspectionSummary(),
      ]);

      if (inspRes.status === 1) {
        setInspectionData(inspRes.payload);
      }
      if (summaryRes.status === 1) {
        setSummary(summaryRes.payload);
      }
      setLastSync(new Date());
    } catch (err) {
      console.error('Error fetching inspections:', err);
      // If no data exists yet, try to seed
      if (err.response && err.response.status === 500) {
        setError('ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่');
      } else {
        setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedZone]);

  // Auto-seed and fetch on first load
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        // Try fetching first
        const inspRes = await getInspections('All Zones');
        if (inspRes.status === 1 && inspRes.payload.length === 0) {
          // No data, seed it
          await seedInspections();
        }
      } catch {
        // Server might be down
        try {
          await seedInspections();
        } catch {
          // ignore seed errors
        }
      }
      await fetchInspections();
    };
    initData();
  }, []);

  // Re-fetch when zone changes (but not on initial mount)
  useEffect(() => {
    fetchInspections();
  }, [selectedZone, fetchInspections]);

  // Format date for display
  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  };

  // Format last sync time
  const formatSyncTime = () => {
    if (!lastSync) return '—';
    const pad = (n) => String(n).padStart(2, '0');
    return `${lastSync.getFullYear()}-${pad(lastSync.getMonth() + 1)}-${pad(lastSync.getDate())}  ${pad(lastSync.getHours())}:${pad(lastSync.getMinutes())}`;
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] font-sans flex w-full overflow-x-hidden">
      
      {/* --- MOBILE TOP BAR --- */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white h-16 px-4 flex items-center justify-between z-20 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-md font-bold text-white text-sm">P</div>
          <h1 className="font-bold text-gray-800 text-sm">PMC SYSTEM</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-gray-50 rounded-lg text-gray-600">
          <Menu size={20} />
        </button>
      </div>

      {/* ส่ง props activeMenu เป็น 'qaqc' */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} activeMenu="qaqc" />

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 w-full min-w-0">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 lg:mb-8 bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100 w-full">
          <div className="w-full">
            <h2 className="text-lg lg:text-xl font-bold text-gray-800 break-words leading-tight">โครงการก่อสร้างอาคารสำนักงานอัจฉริยะ (SMART OFFICE TOWER)</h2>
            <div className="flex items-center text-xs text-emerald-500 mt-2 font-semibold">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span> PROJECT LIVE TRACKER
            </div>
          </div>
          <div className="flex items-center gap-4 lg:gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 shrink-0">
            <div className="flex items-center gap-2 hidden sm:flex">
               <span className="text-[10px] text-gray-400 font-bold uppercase">Role</span>
               <select className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border-none outline-none">
                 <option>PROJECT MANAGER</option>
               </select>
            </div>
            <HeaderProfile />
          </div>
        </header>

        {/* --- TITLE & SYNC TIME --- */}
        <div className="flex justify-between items-end gap-4 mb-6">
          <div className="min-w-0">
            <p className="text-blue-600 text-[10px] lg:text-xs font-bold tracking-widest uppercase mb-1 flex items-center gap-2">
               <span className="w-4 h-[2px] bg-blue-600 shrink-0"></span> <span className="truncate">Project Intelligence</span>
            </p>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black italic uppercase text-gray-900 tracking-tight truncate">Field Verification</h1>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Data Sync</span>
            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs lg:text-sm font-bold text-gray-700 bg-white px-2 py-1.5 lg:px-3 lg:py-2 rounded-xl shadow-sm border border-gray-100">
              <Clock size={14} className="text-gray-400"/>
              <span>{formatSyncTime()}</span>
              <button onClick={fetchInspections} className="ml-1 text-blue-500 hover:text-blue-700 transition-colors" title="Refresh">
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        {/* --- MAIN GRID LAYOUT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-10">
          
          {/* Left Side: Inspection List (8 Columns) */}
          <div className="lg:col-span-8 bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100 w-full min-w-0">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg lg:text-xl text-gray-800">Site Inspection & QA/QC</h3>
              
              {/* Zone Filter Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowZoneDropdown(!showZoneDropdown)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                >
                  Filter: {selectedZone}
                </button>
                {showZoneDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-10 min-w-[140px] overflow-hidden">
                    {ZONES.map((zone) => (
                      <button
                        key={zone}
                        onClick={() => {
                          setSelectedZone(zone);
                          setShowZoneDropdown(false);
                        }}
                        className={`block w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                          selectedZone === zone ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'
                        }`}
                      >
                        {zone}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* List Container */}
            <div className="flex flex-col gap-3">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <Loader2 size={28} className="animate-spin mr-3" />
                  <span className="text-sm font-medium">กำลังโหลดข้อมูล...</span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <AlertCircle size={32} className="text-red-400 mb-3" />
                  <span className="text-sm font-medium text-red-500 mb-3">{error}</span>
                  <button 
                    onClick={fetchInspections}
                    className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ลองใหม่อีกครั้ง
                  </button>
                </div>
              ) : inspectionData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <span className="text-sm font-medium mb-3">ไม่พบรายการตรวจสอบ</span>
                </div>
              ) : (
                inspectionData.map((item) => (
                  <InspectionItem 
                    key={item._id || item.id}
                    title={item.title}
                    zone={item.zone}
                    assignee={item.assignee}
                    date={formatDate(item.date)}
                    status={item.status}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right Side: Action Panels (4 Columns) */}
          <div className="lg:col-span-4 flex flex-col gap-6 w-full min-w-0">
            
            {/* Inspector Mobile App Banner */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden group">
              {/* Background Decoration */}
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <HardHat size={20} className="text-white" />
                </div>
                <h3 className="font-black italic text-lg tracking-wider">INSPECTOR MOBILE APP</h3>
              </div>
              
              <p className="text-xs text-blue-100 mb-6 leading-relaxed relative z-10">
                บันทึกผลการตรวจสอบหน้างานแบบ Real-time พร้อมฟังก์ชันอัปโหลดรูปภาพและตำแหน่ง GPS อัตโนมัติ
              </p>
              
              <button className="w-full bg-white text-blue-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors shadow-sm relative z-10">
                <Camera size={18} /> START NEW INSPECTION
              </button>
            </div>

            {/* Punch List Control Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold tracking-wider text-gray-800 uppercase">Punch List Control</h3>
                <AlertCircle size={16} className="text-red-500" />
              </div>
              
              <div className="flex items-end gap-2 mb-6">
                <span className="text-5xl font-black text-red-500 leading-none">
                  {summary ? String(summary.waitingForFix).padStart(2, '0') : '—'}
                </span>
                <span className="text-xs font-bold text-gray-400 italic uppercase pb-1">Items waiting for fix</span>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-2 uppercase">
                  <span>Resolution Rate</span>
                  <span className="text-blue-600">{summary ? `${summary.resolutionRate}%` : '—'}</span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: summary ? `${summary.resolutionRate}%` : '0%' }}
                  ></div>
                </div>
              </div>

              {/* Mini stats */}
              {summary && (
                <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-gray-50">
                  <div className="text-center">
                    <div className="text-lg font-black text-emerald-500">{summary.completed}</div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-yellow-500">{summary.pending}</div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-orange-500">{summary.inProgress}</div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-red-500">{summary.rejected}</div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase">Rejected</div>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </main>

      {/* Click outside to close zone dropdown */}
      {showZoneDropdown && (
        <div className="fixed inset-0 z-0" onClick={() => setShowZoneDropdown(false)}></div>
      )}
    </div>
  );
};

export default QaqcPage;