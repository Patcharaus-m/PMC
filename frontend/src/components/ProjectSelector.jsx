import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, X, FolderOpen, Building2 } from 'lucide-react';
import { getProjects, createNewProject } from '../services/api';

const ProjectSelector = ({ selectedProjectId, onProjectChange }) => {
  const [projects, setProjects] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ projectName: '', startDate: '', endDate: '' });
  const [creating, setCreating] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await getProjects();
      if (res.status === 1) {
        setProjects(res.payload);
      }
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  };

  const selectedProject = projects.find((p) => p._id === selectedProjectId);

  const handleSelect = (project) => {
    onProjectChange(project._id, project.projectName);
    setIsDropdownOpen(false);
  };

  const handleCreate = async () => {
    if (!newProject.projectName.trim()) return;
    setCreating(true);
    try {
      const res = await createNewProject({
        projectName: newProject.projectName,
        startDate: newProject.startDate || undefined,
        endDate: newProject.endDate || undefined,
      });
      if (res.status === 1) {
        await fetchProjects();
        onProjectChange(res.payload._id, res.payload.projectName);
        setIsModalOpen(false);
        setNewProject({ projectName: '', startDate: '', endDate: '' });
      }
    } catch (err) {
      console.error('Failed to create project', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      {/* Project Selector Button */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          id="project-selector-btn"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-xl px-4 py-2.5 transition-all duration-200 cursor-pointer group"
        >
          <Building2 size={18} className="text-blue-600" />
          <span className="text-sm font-semibold text-gray-700 max-w-[220px] truncate">
            {selectedProject ? selectedProject.projectName : 'เลือกโปรเจกต์'}
          </span>
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">โปรเจกต์ทั้งหมด</p>
            </div>

            {/* Project List */}
            <div className="max-h-60 overflow-y-auto">
              {projects.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <FolderOpen size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">ยังไม่มีโปรเจกต์</p>
                </div>
              ) : (
                projects.map((project) => (
                  <button
                    key={project._id}
                    type="button"
                    onClick={() => handleSelect(project)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors duration-150 cursor-pointer border-none outline-none ${
                      project._id === selectedProjectId
                        ? 'bg-blue-50 border-l-4 border-l-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                    style={project._id === selectedProjectId ? { borderLeft: '4px solid #2563eb' } : {}}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        project._id === selectedProjectId
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {project.projectName?.charAt(0)?.toUpperCase() || 'P'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${
                        project._id === selectedProjectId ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        {project.projectName}
                      </p>
                    </div>
                    {project._id === selectedProjectId && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full shrink-0"></div>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Create Button */}
            <div className="border-t border-gray-100 p-2">
              <button
                type="button"
                id="create-project-btn"
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors duration-150 cursor-pointer border-none outline-none"
              >
                <Plus size={18} />
                <span className="text-sm font-semibold">สร้างโปรเจกต์ใหม่</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-2">
                <Building2 size={20} className="text-blue-600" />
                <h3 className="text-lg font-bold text-gray-800">สร้างโปรเจกต์ใหม่</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/60 transition-colors cursor-pointer border-none outline-none text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  ชื่อโปรเจกต์ <span className="text-red-500">*</span>
                </label>
                <input
                  id="project-name-input"
                  type="text"
                  value={newProject.projectName}
                  onChange={(e) => setNewProject({ ...newProject, projectName: e.target.value })}
                  placeholder="เช่น อาคารสำนักงาน ABC"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">วันเริ่มต้น</label>
                  <input
                    id="project-start-date"
                    type="date"
                    value={newProject.startDate}
                    onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">วันสิ้นสุด</label>
                  <input
                    id="project-end-date"
                    type="date"
                    value={newProject.endDate}
                    onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer border-none outline-none"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                id="submit-create-project"
                onClick={handleCreate}
                disabled={creating || !newProject.projectName.trim()}
                className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none outline-none"
              >
                {creating ? 'กำลังสร้าง...' : 'สร้างโปรเจกต์'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectSelector;
