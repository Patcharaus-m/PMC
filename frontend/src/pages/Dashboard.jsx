import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Users, FileText, CheckCircle, Clock, Menu, TrendingDown } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import KpiCard from '../components/KpiCard';
import DocStatusRow from '../components/DocStatusItem';
import HeaderProfile from '../components/HeaderProfile';
import ProjectSelector from '../components/ProjectSelector';
import GanttChart from '../components/GanttChart';
import { getDashboardSummary, updatePlanStatus } from '../services/api';

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
    Admin: 'ผู้ดูแลระบบ',
    PM: 'ผู้จัดการโครงการ',
    SiteEngineer: 'วิศวกรสนาม',
    Inspector: 'ผู้ตรวจสอบ',
    DocumentController: 'ผู้ควบคุมเอกสาร',
  };
  let currentUser = null;
  try {
    const raw = localStorage.getItem('user');
    if (raw) currentUser = JSON.parse(raw);
  } catch { /* ignore */ }
  const userRoleLabel = ROLE_LABELS[currentUser?.role] || currentUser?.role || 'ผู้เยี่ยมชม';

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
  const planStatusSummary = summary?.planStatusSummary ?? { total: 0, completed: 0, inProgress: 0, delayed: 0, notStarted: 0 };

  const formatLastUpdate = () => {
    if (!lastUpdateTime) return '—';
    const d = new Date(lastUpdateTime);
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  const isDelayed = actualProgress < plannedProgress;

  const STATUS_OPTIONS = [
    { value: 'not_started', label: 'ยังไม่เริ่ม', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
    { value: 'in_progress', label: 'ดำเนินการ', color: 'bg-blue-50 text-blue-600', dot: 'bg-blue-500' },
    { value: 'completed', label: 'สำเร็จ', color: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
    { value: 'delayed', label: 'ล่าช้า', color: 'bg-red-50 text-red-600', dot: 'bg-red-500' },
  ];

  const getStatusOption = (status) => STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];

  const handlePlanStatusChange = async (planId, newStatus) => {
    if (!selectedProjectId) return;
    try {
      await updatePlanStatus(selectedProjectId, planId, newStatus);
      fetchSummary(selectedProjectId);
    } catch (err) {
      console.error('Failed to update plan status:', err);
    }
  };

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
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span> ติดตามโปรเจกต์แบบเรียลไทม์
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
            subtext={loading ? 'กำลังโหลด...' : `แผนงาน: ${plannedProgress}%`} 
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

        {/* --- PLAN COMPARISON SECTION --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full mb-6">
          <div className="p-5 lg:p-6 border-b border-gray-100">
            <h3 className="font-bold text-base lg:text-lg text-gray-800 flex items-center gap-2">
              <TrendingDown size={20} className="text-blue-600"/>
              เปรียบเทียบแผนงาน (แผน vs จริง)
            </h3>
            <p className="text-xs text-gray-400 mt-1">คำนวณจากแผนงาน Gantt Chart — คลิกสถานะเพื่อปรับแต่ละรายการ</p>
          </div>

          {/* Progress Summary Bars */}
          <div className="px-5 lg:px-6 py-4 border-b border-gray-50 bg-gray-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-600">แผนงานสะสม (ตามเวลา)</span>
                  <span className="text-sm font-bold text-gray-800">{plannedProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3.5 overflow-hidden">
                  <div className="bg-gray-400 h-3.5 rounded-full transition-all duration-700" style={{width: `${Math.min(plannedProgress, 100)}%`}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-600">ผลงานจริง (สถานะรายงาน)</span>
                  <span className={`text-sm font-bold ${isDelayed ? 'text-red-500' : 'text-emerald-600'}`}>{actualProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3.5 overflow-hidden">
                  <div className={`${isDelayed ? 'bg-red-500' : 'bg-blue-600'} h-3.5 rounded-full transition-all duration-700`} style={{width: `${Math.min(actualProgress, 100)}%`}}></div>
                </div>
              </div>
            </div>
            {isDelayed && (
              <p className="mt-3 text-xs text-red-500 font-semibold">
                ⚠️ ล่าช้ากว่าแผนงาน {Math.abs(difference).toFixed(1)}%
              </p>
            )}
            {/* Status summary badges */}
            {planStatusSummary.total > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> สำเร็จ {planStatusSummary.completed}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> ดำเนินการ {planStatusSummary.inProgress}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> ล่าช้า {planStatusSummary.delayed}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> ยังไม่เริ่ม {planStatusSummary.notStarted}
                </span>
              </div>
            )}
          </div>

          {/* Plan Detail — Responsive: Cards on mobile, Table on desktop */}
          {loading ? (
            <div className="p-10 text-center text-sm text-gray-400">กำลังโหลด...</div>
          ) : projectPlans.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">ยังไม่มีแผนงาน — เพิ่มแผนงานในหน้าตั้งค่าระบบ</div>
          ) : (
            <>
              {/* === Mobile Card View (< md) === */}
              <div className="block md:hidden p-4 space-y-3">
                {projectPlans
                  .slice()
                  .sort((a, b) => (a.order || '').localeCompare(b.order || ''))
                  .map((plan, idx) => {
                    const st = getStatusOption(plan.status);
                    const pStart = new Date(plan.startDate);
                    const pEnd = new Date(plan.endDate);
                    const progress = plan.actualProgress ?? 0;
                    return (
                      <div key={plan._id || idx} className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 space-y-3">
                        {/* Plan name + order */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-xs font-bold text-gray-400 shrink-0">{plan.order || (idx + 1)}</span>
                            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: plan.color || '#3b82f6' }}></div>
                            <span className="text-sm font-semibold text-gray-800 truncate">{plan.planName}</span>
                          </div>
                        </div>
                        {/* Date range + Status */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-gray-500 bg-white px-2 py-0.5 rounded-md border border-gray-100">
                            {pStart.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} — {pEnd.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                          </span>
                          <select
                            value={plan.status || 'not_started'}
                            onChange={(e) => handlePlanStatusChange(plan._id, e.target.value)}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border-none outline-none cursor-pointer ${st.color}`}
                          >
                            {STATUS_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        {/* Progress bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                progress >= 100 ? 'bg-emerald-500' : progress > 0 ? 'bg-blue-500' : 'bg-gray-300'
                              }`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                          </div>
                          <span className={`text-xs font-bold w-10 text-right ${
                            progress >= 100 ? 'text-emerald-600' : progress > 0 ? 'text-blue-600' : 'text-gray-400'
                          }`}>{progress}%</span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* === Desktop Table View (>= md) === */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/80">
                      <th className="px-3 lg:px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-12">ลำดับ</th>
                      <th className="px-3 lg:px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">รายละเอียดงาน</th>
                      <th className="px-3 lg:px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-24 lg:w-28">เริ่มต้น</th>
                      <th className="px-3 lg:px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-24 lg:w-28">สิ้นสุด</th>
                      <th className="px-3 lg:px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-28 lg:w-32 text-center">สถานะ</th>
                      <th className="px-3 lg:px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-20 lg:w-24 text-center">% จริง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {projectPlans
                      .slice()
                      .sort((a, b) => (a.order || '').localeCompare(b.order || ''))
                      .map((plan, idx) => {
                        const st = getStatusOption(plan.status);
                        const pStart = new Date(plan.startDate);
                        const pEnd = new Date(plan.endDate);
                        const progress = plan.actualProgress ?? 0;
                        return (
                          <tr key={plan._id || idx} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-3 lg:px-4 py-3 text-xs font-bold text-gray-400">{plan.order || (idx + 1)}</td>
                            <td className="px-3 lg:px-4 py-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: plan.color || '#3b82f6' }}></div>
                                <span className="text-sm font-medium text-gray-800 truncate" title={plan.planName}>{plan.planName}</span>
                              </div>
                            </td>
                            <td className="px-3 lg:px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                              {pStart.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                            </td>
                            <td className="px-3 lg:px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                              {pEnd.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                            </td>
                            <td className="px-3 lg:px-4 py-3 text-center">
                              <select
                                value={plan.status || 'not_started'}
                                onChange={(e) => handlePlanStatusChange(plan._id, e.target.value)}
                                className={`text-[11px] font-bold px-2 py-1.5 rounded-lg border-none outline-none cursor-pointer transition-colors ${st.color}`}
                              >
                                {STATUS_OPTIONS.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 lg:px-4 py-3">
                              <div className="flex items-center gap-2 justify-center">
                                <div className="w-12 lg:w-16 bg-gray-100 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-500 ${
                                      progress >= 100 ? 'bg-emerald-500' : progress > 0 ? 'bg-blue-500' : 'bg-gray-300'
                                    }`}
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                  ></div>
                                </div>
                                <span className={`text-[11px] font-bold w-8 text-right ${
                                  progress >= 100 ? 'text-emerald-600' : progress > 0 ? 'text-blue-600' : 'text-gray-400'
                                }`}>{progress}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* --- DOCUMENT STATUS SECTION --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 pb-10 w-full">
          {loading ? (
            <div className="col-span-full text-center text-sm text-gray-400 py-6">กำลังโหลดข้อมูลเอกสาร...</div>
          ) : (
            Object.entries(documentBreakdown).map(([type, data]) => {
              const configs = {
                RFA: { label: 'Request for Approval', color: '#6366f1', bg: 'bg-indigo-500', lightBg: 'bg-indigo-50', textColor: 'text-indigo-600' },
                RFI: { label: 'Request for Inspection', color: '#f59e0b', bg: 'bg-amber-500', lightBg: 'bg-amber-50', textColor: 'text-amber-600' },
                VO: { label: 'Variation Order', color: '#10b981', bg: 'bg-emerald-500', lightBg: 'bg-emerald-50', textColor: 'text-emerald-600' },
              };
              const cfg = configs[type] || configs.RFA;
              return (
                <div
                  key={type}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 lg:p-6 relative overflow-hidden transition-all hover:shadow-md"
                  style={{ borderTop: `3px solid ${cfg.color}` }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${cfg.bg} rounded-xl flex items-center justify-center shadow-sm`}>
                        <FileText size={18} className="text-white" />
                      </div>
                      <div>
                        <h4 className="font-black text-lg text-gray-800">{type}</h4>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{cfg.label}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-gray-800">{data.total}</span>
                      <p className="text-[10px] text-gray-400 font-semibold">รายการ</p>
                    </div>
                  </div>
                  {/* Status badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg ${cfg.lightBg} ${cfg.textColor}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.bg}`}></span>
                      รอดำเนินการ {data.pending}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      อนุมัติ {data.approved}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`${cfg.bg} h-1.5 rounded-full transition-all duration-700`}
                        style={{ width: data.total > 0 ? `${(data.approved / data.total) * 100}%` : '0%' }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
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