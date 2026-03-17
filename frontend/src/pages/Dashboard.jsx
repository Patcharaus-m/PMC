import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Users, FileText, CheckCircle, Clock, Menu, TrendingDown } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import KpiCard from '../components/KpiCard';
import DocStatusRow from '../components/DocStatusItem';
import HeaderProfile from '../components/HeaderProfile';
import ProjectSelector from '../components/ProjectSelector';
import GanttChart from '../components/GanttChart';
import { getDashboardSummary } from '../services/api';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    return localStorage.getItem('selectedProjectId') || null;
  });
  const [selectedProjectName, setSelectedProjectName] = useState(() => {
    return localStorage.getItem('selectedProjectName') || '';
  });

  const ROLE_LABELS = {
    Admin: 'ADMIN',
    PM: 'PROJECT MANAGER',
    SiteEngineer: 'SITE ENGINEER',
    Inspector: 'INSPECTOR',
    DocumentController: 'DOCUMENT CONTROLLER',
  };
  let currentUser = null;
  try {
    const raw = localStorage.getItem('user');
    if (raw) currentUser = JSON.parse(raw);
  } catch { /* ignore */ }
  const userRoleLabel = ROLE_LABELS[currentUser?.role] || currentUser?.role || 'GUEST';

  const fetchSummary = useCallback(async (projectId) => {
    setLoading(true);
    try {
      const result = await getDashboardSummary(projectId);
      if (result.status === 1) {
        setSummary(result.payload);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary(selectedProjectId);
  }, [selectedProjectId, fetchSummary]);

  const handleProjectChange = (projectId, projectName) => {
    setSelectedProjectId(projectId);
    setSelectedProjectName(projectName);
    localStorage.setItem('selectedProjectId', projectId);
    localStorage.setItem('selectedProjectName', projectName);
  };

  const actualProgress = summary?.progress?.actualProgress ?? 0;
  const plannedProgress = summary?.progress?.plannedProgress ?? 0;
  const difference = summary?.progress?.difference ?? 0;
  const workforceCount = summary?.workforceCount ?? 0;
  const pendingDocuments = summary?.pendingDocuments ?? 0;
  const safetyScore = summary?.safetyScore ?? 100;
  const incidentCount = summary?.incidentCount ?? 0;
  const lastUpdateTime = summary?.lastUpdateTime;
  const documentBreakdown = summary?.documentBreakdown ?? {};
  const projectPlans = summary?.plans ?? [];

  const formatLastUpdate = () => {
    if (!lastUpdateTime) return '—';
    const d = new Date(lastUpdateTime);
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  const isDelayed = actualProgress < plannedProgress;

  return (
    <div className="min-h-screen bg-[#f4f7f9] font-sans flex w-full overflow-x-hidden">
      
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white h-16 px-4 flex items-center justify-between z-20 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-md font-bold text-white text-sm">P</div>
          <h1 className="font-bold text-gray-800 text-sm">PMC SYSTEM</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-gray-50 rounded-lg text-gray-600">
          <Menu size={20} />
        </button>
      </div>

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 w-full min-w-0">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 lg:mb-8 bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100 w-full">
          <div className="w-full space-y-3">
            <ProjectSelector
              selectedProjectId={selectedProjectId}
              onProjectChange={handleProjectChange}
            />
            <h2 className="text-lg lg:text-xl font-bold text-gray-800 break-words leading-tight">
              {selectedProjectName || 'กรุณาเลือกโปรเจกต์'}
            </h2>
            <div className="flex items-center text-xs text-emerald-500 font-semibold">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span> PROJECT LIVE TRACKER
            </div>
          </div>
          <div className="flex items-center gap-4 lg:gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 shrink-0">
            <div className="flex items-center gap-2 hidden sm:flex">
               <span className="text-[10px] text-gray-400 font-bold uppercase">เปลี่ยนมุมมองสิทธิ์ผู้ใช้</span>
               <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">{userRoleLabel}</span>
            </div>
            <HeaderProfile />
          </div>
        </header>

        {/* --- KPI CARDS GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-6 w-full">
          <KpiCard 
            title="ความคืบหน้าจริง" 
            value={loading ? '—' : `${actualProgress}%`} 
            subtext={loading ? 'Loading...' : `แผนงาน: ${plannedProgress}%`} 
            icon={<Activity size={20}/>} 
            iconBg="bg-blue-500" 
            borderColor="#3b82f6"
          />
          <KpiCard 
            title="กำลังคนหน้างาน" 
            value={loading ? '—' : String(workforceCount)} 
            subtext={`อัปเดตล่าสุด ${formatLastUpdate()} น.`}
            icon={<Users size={20}/>} 
            iconBg="bg-orange-500" 
            borderColor="#f97316"
          />
          <KpiCard 
            title="เอกสารรออนุมัติ" 
            value={loading ? '—' : String(pendingDocuments)} 
            subtext="RFA/RFI รวม" 
            icon={<FileText size={20}/>} 
            iconBg="bg-amber-500" 
            borderColor="#eab308"
          />
          <KpiCard 
            title="ความปลอดภัย" 
            value={loading ? '—' : `${safetyScore}%`} 
            subtext={`${incidentCount} อุบัติเหตุในเดือนนี้`} 
            icon={<CheckCircle size={20}/>} 
            iconBg="bg-emerald-500" 
            borderColor="#22c55e"
          />
        </div>

        {/* --- CHARTS & STATUS SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 pb-10 w-full">
          
          <div className="bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-gray-100 w-full min-w-0">
            <h3 className="font-bold text-base lg:text-lg text-gray-800 flex items-center gap-2 mb-6">
              <TrendingDown size={20} className="text-blue-600"/>
              เปรียบเทียบแผนงาน (Planned vs Actual)
            </h3>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-600">แผนงานสะสม</span>
                  <span className="text-sm font-bold text-gray-800">{plannedProgress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div className="bg-gray-300 h-4 rounded-full transition-all duration-700" style={{width: `${Math.min(plannedProgress, 100)}%`}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-600">ผลงานจริง</span>
                  <span className="text-sm font-bold text-gray-800">{actualProgress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div className="bg-blue-600 h-4 rounded-full transition-all duration-700" style={{width: `${Math.min(actualProgress, 100)}%`}}></div>
                </div>
              </div>
            </div>
            {isDelayed && (
              <p className="mt-5 text-xs text-red-500 font-semibold">
                * ล่าช้ากว่าแผนงาน {Math.abs(difference)}% เนื่องจากสภาพอากาศ
              </p>
            )}
          </div>

          <div className="bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-gray-100 w-full min-w-0">
            <h3 className="font-bold text-base lg:text-lg text-gray-800 flex items-center gap-2 mb-4">
              <FileText size={20} className="text-indigo-600"/>
              สถานะเอกสารสำคัญ
            </h3>
            {loading ? (
              <p className="text-sm text-gray-400">Loading document data...</p>
            ) : (
              <div>
                {Object.entries(documentBreakdown).map(([type, data]) => (
                  <DocStatusRow key={type} type={type} total={data.total} pending={data.pending} approved={data.approved} />
                ))}
              </div>
            )}
          </div>

        </div>

        {/* --- GANTT CHART SECTION --- */}
        <div className="w-full pb-10">
          <GanttChart plans={projectPlans} />
        </div>

      </main>
    </div>
  );
};

export default Dashboard;