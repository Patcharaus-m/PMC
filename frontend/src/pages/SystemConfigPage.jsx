import React, { useState, useEffect } from 'react';
import { Settings, Menu, Plus, Pencil, Trash2, X, Loader2, Calendar, Users, FolderOpen, ListChecks, ChevronDown, ChevronUp, Database } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import HeaderProfile from '../components/HeaderProfile';
import { getProjects, createNewProject, updateProject, deleteProject } from '../services/api';

const SystemConfigPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Project Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form, setForm] = useState({ projectName: '', startDate: '', endDate: '', workforceCount: 0 });
  const [submitting, setSubmitting] = useState(false);

  const PREDEFINED_COLORS = [
    { value: '#93c5fd', label: 'ฟ้า' },
    { value: '#2563eb', label: 'น้ำเงิน' },
    { value: '#ef4444', label: 'แดง' },
    { value: '#f97316', label: 'ส้ม' },
    { value: '#eab308', label: 'เหลือง' },
    { value: '#22c55e', label: 'เขียว' },
  ];

  // Plans state (inline per project)
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [planForm, setPlanForm] = useState({ order: '', planName: '', startDate: '', endDate: '', note: '', color: PREDEFINED_COLORS[1].value });
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [savingPlan, setSavingPlan] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await getProjects();
      if (res.status === 1) setProjects(res.payload);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  // ===== Project CRUD =====
  const handleOpenCreate = () => {
    setEditingProject(null);
    setForm({ projectName: '', startDate: '', endDate: '', workforceCount: 0 });
    setShowModal(true);
  };

  const handleOpenEdit = (project) => {
    setEditingProject(project);
    setForm({
      projectName: project.projectName || '',
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      endDate: project.endDate ? project.endDate.split('T')[0] : '',
      workforceCount: project.workforceCount ?? 0,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.projectName.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        projectName: form.projectName.trim(),
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        workforceCount: Number(form.workforceCount) || 0,
      };
      if (editingProject) {
        await updateProject(editingProject._id, payload);
        const selectedId = localStorage.getItem('selectedProjectId');
        if (selectedId === editingProject._id) {
          localStorage.setItem('selectedProjectName', payload.projectName);
        }
      } else {
        await createNewProject(payload);
      }
      setShowModal(false);
      await fetchProjects();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await deleteProject(id);
      const selectedId = localStorage.getItem('selectedProjectId');
      if (selectedId === id) {
        localStorage.removeItem('selectedProjectId');
        localStorage.removeItem('selectedProjectName');
      }
      setDeleteId(null);
      if (expandedProjectId === id) setExpandedProjectId(null);
      await fetchProjects();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleSeedData = async () => {
    if (!window.confirm("คุณต้องการสร้างโปรเจกต์และแผนงานตัวอย่างตามรูปภาพใช่หรือไม่?")) return;
    setLoading(true);
    try {
      const projRes = await createNewProject({
        projectName: "แผนงานการซ่อมแซมหลังคา อาคาร IMPACT Arena ซึ่งมีความเสียหายจากเหตุพายุพัดเข้าพื้นที่ วันที่ 3 ตุลาคม 2568 (2/2)",
        startDate: "2026-03-23",
        endDate: "2026-07-08",
        workforceCount: 45,
      });

      if (projRes.status === 1) {
        const projectId = projRes.payload._id;
        const samplePlans = [
          { order: "C", planName: "การดำเนินงานส่วนซ่อมแซม", startDate: "2026-03-23", endDate: "2026-05-11", note: "", color: "#93c5fd" }, // light blue
          { order: "C.1", planName: "งานรื้อถอนโครงสร้างนั่งร้านหลังคา", startDate: "2026-03-24", endDate: "2026-05-02", note: "มีการนำ Mobile Crane เข้ามาใช้ในพื้นที่", color: "#2563eb" }, // dark blue
          { order: "C.2", planName: "การเตรียมแผ่นหลังคาระบบกันซึม", startDate: "2026-03-23", endDate: "2026-03-25", note: "", color: "#2563eb" },
          { order: "C.3", planName: "งานติดตั้งแผ่นชุดใหม่ และงานรอยต่อต่างๆ", startDate: "2026-05-03", endDate: "2026-05-11", note: "เริ่ม 3 พ.ค.", color: "#2563eb" },
          { order: "D", planName: "การซ่อมแซมหลังคา ส่วนบริเวณ RollDown", startDate: "2026-05-18", endDate: "2026-07-03", note: "", color: "#93c5fd" },
          { order: "D.1", planName: "งานรื้อถอนโครงสร้างนั่งร้านหลังคา", startDate: "2026-05-18", endDate: "2026-05-28", note: "มีการนำ Mobile Crane เข้ามาใช้", color: "#2563eb" },
          { order: "D.2", planName: "งานติดตั้งโครงสร้างชุดใหม่", startDate: "2026-06-01", endDate: "2026-06-19", note: "", color: "#2563eb" },
          { order: "D.3", planName: "การรื้อถอนหลังคาและจัดเก็บ", startDate: "2026-06-23", endDate: "2026-06-25", note: "", color: "#2563eb" },
          { order: "D.4", planName: "งานติดตั้งแผ่นชุดใหม่ และงานรอยต่อต่างๆ", startDate: "2026-06-26", endDate: "2026-07-03", note: "มีการจัดการแสดงในพื้นที่", color: "#2563eb" },
          { order: "", planName: "การเก็บรายละเอียดงาน", startDate: "2026-07-01", endDate: "2026-07-08", note: "", color: "#2563eb" },
          { order: "", planName: "การตรวจรับรองคุณภาพและเอกสาร", startDate: "2026-07-01", endDate: "2026-07-03", note: "", color: "#2563eb" },
          { order: "", planName: "การตรวจสอบ Defect และส่งมอบงาน", startDate: "2026-07-06", endDate: "2026-07-08", note: "", color: "#2563eb" },
        ];
        
        await updateProject(projectId, { plans: samplePlans });
      }
      
      await fetchProjects();
    } catch (err) {
      console.error('Seed error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ===== Plans CRUD (managed via project update) =====
  const toggleExpand = (projectId) => {
    if (expandedProjectId === projectId) {
      setExpandedProjectId(null);
    } else {
      setExpandedProjectId(projectId);
      resetPlanForm();
    }
  };

  const resetPlanForm = () => {
    setPlanForm({ order: '', planName: '', startDate: '', endDate: '', note: '', color: PREDEFINED_COLORS[1].value });
    setEditingPlanId(null);
  };

  const handleEditPlan = (plan) => {
    setEditingPlanId(plan._id);
    setPlanForm({
      order: plan.order || '',
      planName: plan.planName || '',
      startDate: plan.startDate ? plan.startDate.split('T')[0] : '',
      endDate: plan.endDate ? plan.endDate.split('T')[0] : '',
      note: plan.note || '',
      color: plan.color || PREDEFINED_COLORS[1].value,
    });
  };

  const handleSavePlan = async (project) => {
    if (!planForm.planName.trim() || !planForm.startDate || !planForm.endDate) return;
    setSavingPlan(true);
    try {
      let updatedPlans = [...(project.plans || [])];
      const newPlan = {
        order: planForm.order?.trim() || undefined,
        planName: planForm.planName.trim(),
        startDate: planForm.startDate,
        endDate: planForm.endDate,
        note: planForm.note?.trim() || undefined,
        color: planForm.color || PREDEFINED_COLORS[1].value,
      };

      if (editingPlanId) {
        // Update existing plan
        updatedPlans = updatedPlans.map(p =>
          p._id === editingPlanId ? { ...p, ...newPlan } : p
        );
      } else {
        // Add new plan
        updatedPlans.push(newPlan);
      }

      await updateProject(project._id, { plans: updatedPlans });
      resetPlanForm();
      await fetchProjects();
    } catch (err) {
      console.error('Save plan error:', err);
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeletePlan = async (project, planId) => {
    setSavingPlan(true);
    try {
      const updatedPlans = (project.plans || []).filter(p => p._id !== planId);
      await updateProject(project._id, { plans: updatedPlans });
      if (editingPlanId === planId) resetPlanForm();
      await fetchProjects();
    } catch (err) {
      console.error('Delete plan error:', err);
    } finally {
      setSavingPlan(false);
    }
  };

  // ===== Helpers =====
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return dateStr; }
  };

  const calcDuration = (start, end) => {
    if (!start || !end) return '—';
    const s = new Date(start);
    const e = new Date(end);
    const days = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
    if (days <= 0) return '—';
    const months = Math.round(days / 30);
    return months >= 1 ? `${months} เดือน (${days} วัน)` : `${days} วัน`;
  };

  const calcMonths = (start, end) => {
    if (!start || !end) return '—';
    const days = Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24));
    const months = (days / 30).toFixed(1);
    return `${months} เดือน`;
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] font-sans flex w-full overflow-x-hidden">
      
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white h-16 px-4 flex items-center justify-between z-20 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-md font-bold text-white text-sm">P</div>
          <h1 className="font-bold text-gray-800 text-sm">PMC SYSTEM</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-gray-50 rounded-lg text-gray-600">
          <Menu size={20} />
        </button>
      </div>

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} activeMenu="config" />

      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 w-full min-w-0">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 lg:mb-8 bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100 w-full">
          <div className="w-full">
            <div className="flex items-center gap-2 mb-2">
              <Settings size={24} className="text-blue-600" />
              <h2 className="text-lg lg:text-xl font-bold text-gray-800">ตั้งค่าระบบ</h2>
            </div>
            <p className="text-sm text-gray-500">จัดการโปรเจกต์ทั้งหมดในระบบ — เพิ่ม แก้ไข หรือลบโปรเจกต์ พร้อมกำหนดแผนงาน</p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <HeaderProfile />
          </div>
        </header>

        {/* Project Management Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full overflow-hidden">
          
          {/* Title bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FolderOpen size={20} className="text-indigo-600" />
              <h3 className="font-bold text-lg text-gray-800">รายการโปรเจกต์</h3>
              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{projects.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSeedData}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer border-none shadow-sm"
              >
                <Database size={16} /> เพิ่มข้อมูลตัวอย่าง
              </button>
              <button
                onClick={handleOpenCreate}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer border-none outline-none shadow-sm"
              >
                <Plus size={16} /> เพิ่มโปรเจกต์
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-400">
                <Loader2 size={28} className="animate-spin mr-3" />
                <span className="text-sm font-medium">กำลังโหลดข้อมูล...</span>
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <FolderOpen size={48} className="mb-3 text-gray-300" />
                <span className="text-sm font-medium mb-3">ยังไม่มีโปรเจกต์</span>
                <button onClick={handleOpenCreate} className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 cursor-pointer border-none outline-none">
                  <Plus size={14} /> สร้างโปรเจกต์แรก
                </button>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider w-8"></th>
                    <th className="px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">ชื่อโปรเจกต์</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">วันเริ่มต้น</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">วันสิ้นสุด</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">ระยะเวลา</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">กำลังคน</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">แผนงาน</th>
                    <th className="px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {projects.map((p) => (
                    <React.Fragment key={p._id}>
                      <tr className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-4 py-4">
                          <button onClick={() => toggleExpand(p._id)} className="p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer border-none outline-none text-gray-400 hover:text-gray-600">
                            {expandedProjectId === p._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-semibold text-sm text-gray-800 group-hover:text-blue-600 transition-colors">{p.projectName}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-600 flex items-center gap-1"><Calendar size={13} className="text-gray-400" /> {formatDate(p.startDate)}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-600 flex items-center gap-1"><Calendar size={13} className="text-gray-400" /> {formatDate(p.endDate)}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-medium text-gray-700">{calcDuration(p.startDate, p.endDate)}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1 text-sm font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">
                            <Users size={13} /> {p.workforceCount ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                            <ListChecks size={13} /> {(p.plans || []).length} แผน
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleOpenEdit(p)} className="p-2 rounded-lg hover:bg-blue-100 text-blue-500 hover:text-blue-700 transition-colors cursor-pointer border-none outline-none" title="แก้ไขโปรเจกต์">
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => setDeleteId(p._id)} className="p-2 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors cursor-pointer border-none outline-none" title="ลบ">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* ===== EXPANDED PLANS SECTION ===== */}
                      {expandedProjectId === p._id && (
                        <tr>
                          <td colSpan={8} className="px-0 py-0">
                            <div className="bg-gradient-to-b from-blue-50/50 to-indigo-50/30 border-t border-blue-100 px-6 py-5">
                              <div className="flex items-center gap-2 mb-4">
                                <ListChecks size={18} className="text-indigo-600" />
                                <h4 className="font-bold text-sm text-gray-800">แผนงานของ {p.projectName}</h4>
                              </div>

                              {/* Existing Plans */}
                              {(p.plans || []).length > 0 && (
                                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
                                  <table className="w-full text-left">
                                    <thead>
                                      <tr className="bg-gray-50/80">
                                        <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">ลำดับ</th>
                                        <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">ชื่อแผนงาน</th>
                                        <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">สี</th>
                                        <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">วันเริ่มต้น</th>
                                        <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">วันสิ้นสุด</th>
                                        <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">ระยะเวลา</th>
                                        <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">หมายเหตุ</th>
                                        <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">สถานะ</th>
                                        <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase text-center">จัดการ</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                      {p.plans.map((plan, idx) => (
                                        <tr key={plan._id} className="hover:bg-blue-50/20 transition-colors">
                                          <td className="px-4 py-3 text-xs font-bold text-gray-400">{plan.order || (idx + 1)}</td>
                                          <td className="px-4 py-3 text-sm font-medium text-gray-800">{plan.planName}</td>
                                          <td className="px-4 py-3"><div className="w-5 h-5 rounded hover:scale-110 transition-transform" style={{ backgroundColor: plan.color || PREDEFINED_COLORS[1].value }} title={plan.color || PREDEFINED_COLORS[1].value}></div></td>
                                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(plan.startDate)}</td>
                                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(plan.endDate)}</td>
                                          <td className="px-4 py-3 text-sm text-gray-600">{calcMonths(plan.startDate, plan.endDate)}</td>
                                          <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-[120px]" title={plan.note || ''}>{plan.note || '—'}</td>
                                          <td className="px-4 py-3">
                                            {(() => {
                                              const statusMap = {
                                                not_started: { label: 'ยังไม่เริ่ม', bg: 'bg-gray-100 text-gray-500' },
                                                in_progress: { label: 'ดำเนินการ', bg: 'bg-blue-50 text-blue-600' },
                                                completed: { label: 'สำเร็จ', bg: 'bg-emerald-50 text-emerald-600' },
                                                delayed: { label: 'ล่าช้า', bg: 'bg-red-50 text-red-600' },
                                              };
                                              const s = statusMap[plan.status] || statusMap.not_started;
                                              return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${s.bg}`}>{s.label}</span>;
                                            })()}
                                          </td>
                                          <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                              <button onClick={() => handleEditPlan(plan)} className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-500 hover:text-blue-700 transition-colors cursor-pointer border-none outline-none" title="แก้ไข">
                                                <Pencil size={14} />
                                              </button>
                                              <button onClick={() => handleDeletePlan(p, plan._id)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors cursor-pointer border-none outline-none" title="ลบ">
                                                <Trash2 size={14} />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {/* Add/Edit Plan Form */}
                              <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <h5 className="text-xs font-bold text-gray-500 uppercase mb-3">{editingPlanId ? '✏️ แก้ไขแผนงาน' : '➕ เพิ่มแผนงาน'}</h5>
                                <div className="flex flex-col sm:flex-row gap-3 items-end flex-wrap">
                                  <div className="w-full sm:w-auto shrink-0">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">สีแผนงาน</label>
                                    <div className="flex gap-1.5 h-[38px] items-center">
                                      {PREDEFINED_COLORS.map(c => (
                                        <button
                                          key={c.value}
                                          onClick={() => setPlanForm({ ...planForm, color: c.value })}
                                          className={`w-7 h-7 rounded-md cursor-pointer border-2 transition-all block ${planForm.color === c.value ? 'border-gray-800 scale-110 shadow-sm' : 'border-transparent hover:scale-110'}`}
                                          style={{ backgroundColor: c.value }}
                                          title={c.label}
                                          type="button"
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-[200px]">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">ชื่อแผนงาน *</label>
                                    <input
                                      type="text"
                                      placeholder="เช่น งานเสาเข็ม, งานโครงสร้าง"
                                      value={planForm.planName}
                                      onChange={(e) => setPlanForm({ ...planForm, planName: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                  </div>
                                  <div className="w-full sm:w-[140px] shrink-0">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">วันเริ่มต้น *</label>
                                    <input
                                      type="date"
                                      value={planForm.startDate}
                                      onChange={(e) => setPlanForm({ ...planForm, startDate: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                  </div>
                                  <div className="w-full sm:w-[140px] shrink-0">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">วันสิ้นสุด *</label>
                                    <input
                                      type="date"
                                      value={planForm.endDate}
                                      onChange={(e) => setPlanForm({ ...planForm, endDate: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-[200px]">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">รายละเอียดหมายเหตุ (ถ้ามี)</label>
                                    <input
                                      type="text"
                                      placeholder="เช่น มีการนำ Mobile Crane เข้ามาใช้..."
                                      value={planForm.note}
                                      onChange={(e) => setPlanForm({ ...planForm, note: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleSavePlan(p)}
                                      disabled={savingPlan || !planForm.planName.trim() || !planForm.startDate || !planForm.endDate}
                                      className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer border-none outline-none whitespace-nowrap"
                                    >
                                      {savingPlan ? '...' : editingPlanId ? 'อัปเดต' : 'เพิ่ม'}
                                    </button>
                                    {editingPlanId && (
                                      <button
                                        onClick={resetPlanForm}
                                        className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer border-none outline-none"
                                      >
                                        ยกเลิก
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* ===== CREATE / EDIT PROJECT MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto my-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-2">
                <Settings size={20} className="text-blue-600" />
                <h3 className="text-lg font-bold text-gray-800">{editingProject ? 'แก้ไขโปรเจกต์' : 'สร้างโปรเจกต์ใหม่'}</h3>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/60 transition-colors cursor-pointer border-none outline-none text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">ชื่อโปรเจกต์ *</label>
                <input type="text" placeholder="เช่น อาคาร A - โครงการ NKC" value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">วันเริ่มต้น</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">วันสิ้นสุด</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">กำลังคน (คน)</label>
                <input type="number" min="0" value={form.workforceCount} onChange={(e) => setForm({ ...form, workforceCount: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer border-none outline-none">ยกเลิก</button>
              <button type="button" onClick={handleSave} disabled={submitting || !form.projectName.trim()} className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer border-none outline-none">
                {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRM MODAL ===== */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50">
              <div className="flex items-center gap-2">
                <Trash2 size={20} className="text-red-500" />
                <h3 className="text-lg font-bold text-gray-800">ยืนยันการลบ</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600">คุณต้องการลบโปรเจกต์นี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <button type="button" onClick={() => setDeleteId(null)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer border-none outline-none">ยกเลิก</button>
              <button type="button" onClick={() => handleDelete(deleteId)} disabled={deleting} className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer border-none outline-none">
                {deleting ? 'กำลังลบ...' : 'ลบโปรเจกต์'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemConfigPage;
