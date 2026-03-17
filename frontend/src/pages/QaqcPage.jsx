import React, { useState, useEffect, useCallback } from 'react';
import { User, Clock, Menu, HardHat, Camera, AlertCircle, RefreshCw, Loader2, Plus, X, MapPin, CalendarDays, CheckCircle2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import HeaderProfile from '../components/HeaderProfile';
import StatusBadge from '../components/StatusBadge';
import { getInspections, getInspectionSummary, seedInspections, createInspection, updateInspection } from '../services/api';

const ZONES = ['All Zones', 'Zone A', 'Zone B', 'Zone C'];
const STATUSES = ['PENDING', 'IN PROGRESS', 'COMPLETED', 'REJECTED'];

const QaqcPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inspectionData, setInspectionData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedZone, setSelectedZone] = useState('All Zones');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);

  // Read selected project from localStorage
  const rawProjectId = localStorage.getItem('selectedProjectId');
  const selectedProjectId = rawProjectId && rawProjectId !== 'null' ? rawProjectId : null;
  const selectedProjectName = localStorage.getItem('selectedProjectName') || '';

  // Create Inspection modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', zone: 'Zone A', assignee: '', punchListCount: 0 });
  const [submitting, setSubmitting] = useState(false);

  // Status edit dropdown
  const [editingStatusId, setEditingStatusId] = useState(null);

  // Fetch inspections from API
  const fetchInspections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [inspRes, summaryRes] = await Promise.all([
        getInspections(selectedZone, selectedProjectId),
        getInspectionSummary(selectedProjectId),
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
      if (err.response && err.response.status === 500) {
        setError('ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่');
      } else {
        setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedZone]);

  // Fetch on first load (no auto-seed)
  useEffect(() => {
    fetchInspections();
  }, []);

  useEffect(() => {
    fetchInspections();
  }, [selectedZone, fetchInspections]);

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  };

  const formatSyncTime = () => {
    if (!lastSync) return '—';
    const pad = (n) => String(n).padStart(2, '0');
    return `${lastSync.getFullYear()}-${pad(lastSync.getMonth() + 1)}-${pad(lastSync.getDate())}  ${pad(lastSync.getHours())}:${pad(lastSync.getMinutes())}`;
  };

  // ===== Seed Data Handler =====
  const handleSeed = async () => {
    try {
      setLoading(true);
      await seedInspections(selectedProjectId);
      await fetchInspections();
    } catch (err) {
      console.error('Seed error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ===== Create Inspection Handler =====
  const handleCreateInspection = async () => {
    if (!createForm.title.trim() || !createForm.assignee.trim()) return;
    setSubmitting(true);
    try {
      await createInspection({
        title: createForm.title,
        zone: createForm.zone,
        assignee: createForm.assignee,
        date: new Date().toISOString(),
        status: 'PENDING',
        punchListCount: Number(createForm.punchListCount) || 0,
        projectId: selectedProjectId || undefined,
      });
      setShowCreateModal(false);
      setCreateForm({ title: '', zone: 'Zone A', assignee: '', punchListCount: 0 });
      await fetchInspections();
    } catch (err) {
      console.error('Create inspection error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // ===== Update Status Handler =====
  const handleStatusChange = async (id, newStatus) => {
    setEditingStatusId(null);
    try {
      await updateInspection(id, { status: newStatus });
      // Optimistic update
      setInspectionData((prev) =>
        prev.map((item) => (item._id === id ? { ...item, status: newStatus } : item))
      );
      // Re-fetch summary
      const summaryRes = await getInspectionSummary(selectedProjectId);
      if (summaryRes.status === 1) setSummary(summaryRes.payload);
    } catch (err) {
      console.error('Update status error:', err);
      await fetchInspections();
    }
  };

  // Status color & icon helpers
  const getStatusIcon = (status) => {
    const s = status.toUpperCase();
    if (s === 'COMPLETED') return <CheckCircle2 size={24} />;
    if (s === 'REJECTED') return <AlertCircle size={24} />;
    return <Clock size={24} />;
  };
  const getStatusIconBg = (status) => {
    const s = status.toUpperCase();
    if (s === 'COMPLETED') return 'bg-emerald-50 text-emerald-500';
    if (s === 'REJECTED') return 'bg-red-50 text-red-500';
    if (s === 'IN PROGRESS') return 'bg-orange-50 text-orange-500';
    return 'bg-blue-50 text-blue-500';
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

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} activeMenu="qaqc" />

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 w-full min-w-0">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 lg:mb-8 bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100 w-full">
          <div className="w-full">
            <h2 className="text-lg lg:text-xl font-bold text-gray-800 break-words leading-tight">{selectedProjectName || 'กรุณาเลือกโปรเจกต์'}</h2>
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
              
              <div className="flex items-center gap-2">
                {/* Add Inspection Button */}
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border-none outline-none"
                >
                  <Plus size={14} /> เพิ่มรายการ
                </button>

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
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleSeed}
                      className="bg-gray-500 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-1.5 cursor-pointer border-none outline-none"
                    >
                      Seed Data
                    </button>
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 cursor-pointer border-none outline-none"
                    >
                      <Plus size={14} /> เพิ่มรายการตรวจสอบ
                    </button>
                  </div>
                </div>
              ) : (
                inspectionData.map((item) => (
                  <div 
                    key={item._id || item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-100 rounded-xl hover:shadow-md hover:border-blue-100 transition-all gap-4 group bg-white"
                  >
                    {/* Left: Icon + Info */}
                    <div className="flex items-start sm:items-center gap-4 min-w-0">
                      <div className={`p-3 rounded-full shrink-0 transition-colors ${getStatusIconBg(item.status)}`}>
                        {getStatusIcon(item.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-gray-800 text-sm sm:text-base truncate group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-1.5 text-[10px] sm:text-xs text-gray-400 font-medium">
                          <span className="flex items-center gap-1 shrink-0"><MapPin size={12}/> {item.zone}</span>
                          <span className="flex items-center gap-1 shrink-0"><User size={12}/> {item.assignee}</span>
                          <span className="flex items-center gap-1 shrink-0"><CalendarDays size={12}/> {formatDate(item.date)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Status badge — clickable */}
                    <div className="relative flex sm:justify-end shrink-0 pl-14 sm:pl-0">
                      <button
                        type="button"
                        onClick={() => setEditingStatusId(editingStatusId === item._id ? null : item._id)}
                        className="cursor-pointer border-none outline-none bg-transparent p-0"
                        title="คลิกเพื่อเปลี่ยนสถานะ"
                      >
                        <StatusBadge status={item.status} />
                      </button>

                      {/* Status dropdown */}
                      {editingStatusId === item._id && (
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-20 min-w-[160px] overflow-hidden py-1">
                          <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase border-b border-gray-50">เปลี่ยนสถานะ</div>
                          {STATUSES.map((s) => (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(item._id, s)}
                              className={`block w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer border-none outline-none bg-transparent ${
                                item.status === s ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Side: Action Panels (4 Columns) */}
          <div className="lg:col-span-4 flex flex-col gap-6 w-full min-w-0">
            
            {/* Inspector Mobile App Banner */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden group">
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
              
              <button 
                onClick={() => setShowCreateModal(true)}
                className="w-full bg-white text-blue-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors shadow-sm relative z-10 cursor-pointer border-none outline-none"
              >
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
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: summary ? `${summary.resolutionRate}%` : '0%' }}
                  ></div>
                </div>
              </div>

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

      {/* Click outside to close zone dropdown & status dropdown */}
      {(showZoneDropdown || editingStatusId) && (
        <div className="fixed inset-0 z-0" onClick={() => { setShowZoneDropdown(false); setEditingStatusId(null); }}></div>
      )}

      {/* ===== CREATE INSPECTION MODAL ===== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto my-4" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-2">
                <HardHat size={20} className="text-blue-600" />
                <h3 className="text-lg font-bold text-gray-800">สร้างรายการตรวจสอบใหม่</h3>
              </div>
              <button type="button" onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg hover:bg-white/60 transition-colors cursor-pointer border-none outline-none text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">ชื่อรายการตรวจสอบ *</label>
                <input
                  type="text"
                  placeholder="เช่น งานโครงสร้างชั้น 12 - Concrete Pouring"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">โซน</label>
                <select
                  value={createForm.zone}
                  onChange={(e) => setCreateForm({ ...createForm, zone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="Zone A">Zone A</option>
                  <option value="Zone B">Zone B</option>
                  <option value="Zone C">Zone C</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">ผู้ตรวจสอบ *</label>
                <input
                  type="text"
                  placeholder="เช่น Somchai Y."
                  value={createForm.assignee}
                  onChange={(e) => setCreateForm({ ...createForm, assignee: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">จำนวน Punch List</label>
                <input
                  type="number"
                  min="0"
                  value={createForm.punchListCount}
                  onChange={(e) => setCreateForm({ ...createForm, punchListCount: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer border-none outline-none">ยกเลิก</button>
              <button
                type="button"
                onClick={handleCreateInspection}
                disabled={submitting || !createForm.title.trim() || !createForm.assignee.trim()}
                className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer border-none outline-none"
              >
                {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QaqcPage;