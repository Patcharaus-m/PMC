import React, { useState, useEffect } from 'react';
import { Settings, Menu, Plus, Pencil, Trash2, X, Loader2, Calendar, Users, FolderOpen } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import HeaderProfile from '../components/HeaderProfile';
import { getProjects, createNewProject, updateProject, deleteProject } from '../services/api';

const SystemConfigPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null); // null = create, object = edit
  const [form, setForm] = useState({ projectName: '', startDate: '', endDate: '', workforceCount: 0 });
  const [submitting, setSubmitting] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch all projects
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await getProjects();
      if (res.status === 1) {
        setProjects(res.payload);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Open create modal
  const handleOpenCreate = () => {
    setEditingProject(null);
    setForm({ projectName: '', startDate: '', endDate: '', workforceCount: 0 });
    setShowModal(true);
  };

  // Open edit modal
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

  // Save (create or update)
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
        // Update localStorage if editing the currently selected project
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

  // Delete project
  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await deleteProject(id);
      // Clear localStorage if deleting the currently selected project
      const selectedId = localStorage.getItem('selectedProjectId');
      if (selectedId === id) {
        localStorage.removeItem('selectedProjectId');
        localStorage.removeItem('selectedProjectName');
      }
      setDeleteId(null);
      await fetchProjects();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Calculate duration in days
  const calcDuration = (start, end) => {
    if (!start || !end) return '—';
    const s = new Date(start);
    const e = new Date(end);
    const days = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} วัน` : '—';
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
              <h2 className="text-lg lg:text-xl font-bold text-gray-800">System Configuration</h2>
            </div>
            <p className="text-sm text-gray-500">จัดการโปรเจกต์ทั้งหมดในระบบ — เพิ่ม แก้ไข หรือลบโปรเจกต์</p>
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
            <button
              onClick={handleOpenCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer border-none outline-none shadow-sm"
            >
              <Plus size={16} /> เพิ่มโปรเจกต์
            </button>
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
                <button
                  onClick={handleOpenCreate}
                  className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 cursor-pointer border-none outline-none"
                >
                  <Plus size={14} /> สร้างโปรเจกต์แรก
                </button>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">ชื่อโปรเจกต์</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">วันเริ่มต้น</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">วันสิ้นสุด</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">ระยะเวลา</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">กำลังคน</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {projects.map((p) => (
                    <tr key={p._id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-sm text-gray-800 group-hover:text-blue-600 transition-colors">{p.projectName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 flex items-center gap-1"><Calendar size={13} className="text-gray-400" /> {formatDate(p.startDate)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 flex items-center gap-1"><Calendar size={13} className="text-gray-400" /> {formatDate(p.endDate)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-700">{calcDuration(p.startDate, p.endDate)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">
                          <Users size={13} /> {p.workforceCount ?? 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-2 rounded-lg hover:bg-blue-100 text-blue-500 hover:text-blue-700 transition-colors cursor-pointer border-none outline-none"
                            title="แก้ไข"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteId(p._id)}
                            className="p-2 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors cursor-pointer border-none outline-none"
                            title="ลบ"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* ===== CREATE / EDIT MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto my-4" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-2">
                <Settings size={20} className="text-blue-600" />
                <h3 className="text-lg font-bold text-gray-800">{editingProject ? 'แก้ไขโปรเจกต์' : 'สร้างโปรเจกต์ใหม่'}</h3>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/60 transition-colors cursor-pointer border-none outline-none text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">ชื่อโปรเจกต์ *</label>
                <input
                  type="text"
                  placeholder="เช่น อาคาร A - โครงการ NKC"
                  value={form.projectName}
                  onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">วันเริ่มต้น</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">วันสิ้นสุด</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">กำลังคน (คน)</label>
                <input
                  type="number"
                  min="0"
                  value={form.workforceCount}
                  onChange={(e) => setForm({ ...form, workforceCount: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer border-none outline-none">ยกเลิก</button>
              <button
                type="button"
                onClick={handleSave}
                disabled={submitting || !form.projectName.trim()}
                className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer border-none outline-none"
              >
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
              <button
                type="button"
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer border-none outline-none"
              >
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
