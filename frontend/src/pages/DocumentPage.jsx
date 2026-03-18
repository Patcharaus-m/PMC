import React, { useState, useEffect, useRef } from 'react';
import { Menu, Plus, ChevronRight, Clock, X, Trash2, Edit3, Eye, MoreVertical, Database, Loader2, FileText, AlertTriangle, Upload, Download, Search, ChevronDown } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import HeaderProfile from '../components/HeaderProfile';
import { getDocuments, uploadDocument, updateDocumentStatus, deleteDocument, seedDocuments } from '../services/api';

const DocumentPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterSubType, setFilterSubType] = useState('ALL');
  const [filterDiscipline, setFilterDiscipline] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Read selected project from localStorage
  const rawProjectId = localStorage.getItem('selectedProjectId');
  const selectedProjectId = rawProjectId && rawProjectId !== 'null' ? rawProjectId : null;
  const selectedProjectName = localStorage.getItem('selectedProjectName') || '';

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    documentNo: '',
    type: 'RFA',
    subType: 'General',
    discipline: '',
    subject: '',
    originatorName: '',
  });

  // Discipline options per subType
  const disciplineOptions = {
    Material: ['AC', 'AR', 'EE', 'SN', 'ST'],
    'Shop Drawing': ['AC', 'AR', 'EE', 'FP', 'SN', 'ST'],
  };

  // Helper to format type display
  const formatTypeDisplay = (doc) => {
    if (doc.type !== 'RFA') return doc.type;
    let label = `RFA-${doc.subType || 'General'}`;
    if (doc.discipline) label += ` / ${doc.discipline}`;
    return label;
  };
  const [pdfFile, setPdfFile] = useState(null);
  const fileInputRef = useRef(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDocuments(selectedProjectId);
      setDocuments(res.payload || []);
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลเอกสารได้ กรุณาตรวจสอบการเชื่อมต่อ Backend');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Seed sample data
  const handleSeed = async () => {
    try {
      setFormSubmitting(true);
      await seedDocuments(selectedProjectId);
      await fetchDocuments();
    } catch (err) {
      console.error('Seed error:', err);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Create document
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setFormSubmitting(true);
      const fd = new FormData();
      fd.append('documentNo', formData.documentNo);
      fd.append('type', formData.type);
      if (formData.type === 'RFA') {
        fd.append('subType', formData.subType);
        if (formData.subType === 'Material' || formData.subType === 'Shop Drawing') {
          fd.append('discipline', formData.discipline);
        }
      }
      fd.append('subject', formData.subject);
      fd.append('originatorName', formData.originatorName);
      if (selectedProjectId) {
        fd.append('projectId', selectedProjectId);
      }
      if (pdfFile) {
        fd.append('pdf', pdfFile);
      }
      await uploadDocument(fd);
      setShowCreateModal(false);
      setFormData({ documentNo: '', type: 'RFA', subType: 'General', discipline: '', subject: '', originatorName: '' });
      setPdfFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchDocuments();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการสร้างเอกสาร: ' + (err.response?.data?.error || err.message));
    } finally {
      setFormSubmitting(false);
    }
  };

  // Update status
  const handleStatusUpdate = async (newStatus) => {
    if (!selectedDoc) return;
    try {
      setFormSubmitting(true);
      await updateDocumentStatus(selectedDoc._id, newStatus);
      setShowStatusModal(false);
      setSelectedDoc(null);
      await fetchDocuments();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการอัพเดทสถานะ: ' + (err.response?.data?.error || err.message));
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete document
  const handleDelete = async () => {
    if (!selectedDoc) return;
    try {
      setFormSubmitting(true);
      await deleteDocument(selectedDoc._id);
      setShowDeleteModal(false);
      setSelectedDoc(null);
      await fetchDocuments();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบเอกสาร: ' + (err.response?.data?.error || err.message));
    } finally {
      setFormSubmitting(false);
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Close action menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActionMenuOpen(null);
    if (actionMenuOpen !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [actionMenuOpen]);

  // Derived state: Filtered documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      (doc.documentNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.originatorName || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'ALL' || doc.type === filterType;
    const matchesSubType = filterSubType === 'ALL' || doc.subType === filterSubType;
    const matchesDiscipline = filterDiscipline === 'ALL' || doc.discipline === filterDiscipline;
    const matchesStatus = filterStatus === 'ALL' || (doc.status || 'PENDING').toUpperCase() === filterStatus;

    return matchesSearch && matchesType && matchesSubType && matchesDiscipline && matchesStatus;
  });

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

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} activeMenu="documents" />

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 w-full min-w-0">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 lg:mb-8 bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100 w-full">
          <div className="w-full">
            <h2 className="text-lg lg:text-xl font-bold text-gray-800 break-words leading-tight">{selectedProjectName || 'กรุณาเลือกโปรเจกต์'}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center text-xs text-emerald-500 font-semibold">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span> ACTIVE
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">เปลี่ยนมุมมองสิทธิ์ผู้ใช้</span>
              <select className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border-none outline-none">
                <option>Project Manager</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto justify-end shrink-0">
            <HeaderProfile />
          </div>
        </header>

        {/* --- TITLE & DESCRIPTION --- */}
        <div className="flex justify-between items-end gap-4 mb-6">
          <div className="min-w-0">
            <p className="text-blue-600 text-[10px] lg:text-xs font-bold tracking-widest uppercase mb-1 flex items-center gap-2">
              <span className="w-4 h-[2px] bg-blue-600 shrink-0"></span>
              <span className="truncate">Project Intelligence</span>
            </p>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black italic uppercase text-gray-900 tracking-tight">PROJECT DOCUMENTS</h1>
            <p className="text-xs text-gray-400 mt-1">ระบบบริหารและควบคุมโครงการ (PMC) - อัปเดตข้อมูลแบบเรียลไทม์</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Data Sync</span>
            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs lg:text-sm font-bold text-gray-700 bg-white px-2 py-1.5 lg:px-3 lg:py-2 rounded-xl shadow-sm border border-gray-100">
              <Clock size={14} className="text-gray-400"/>
              <span className="hidden sm:inline">{new Date().toLocaleDateString('th-TH')}</span> {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* --- MAIN WHITE CARD --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full min-w-0 flex flex-col">
          
          {/* Card Header */}
          <div className="p-4 lg:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-50">
            <div>
              <h3 className="text-lg lg:text-xl font-bold text-gray-800">Document Management System (RFA/RFI)</h3>
              <p className="text-xs text-gray-400 mt-1">ระบบติดตามสถานะเอกสารคำขอและการอนุมัติโครงการ</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {documents.length === 0 && !loading && (
                <button
                  onClick={handleSeed}
                  disabled={formSubmitting}
                  className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                >
                  <Database size={18} />
                  {formSubmitting ? 'กำลังโหลด...' : 'Seed Data'}
                </button>
              )}
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors w-full sm:w-auto justify-center"
              >
                <Plus size={18} /> ยื่นคำขอใหม่
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 lg:px-6 lg:py-4 border-b border-gray-50 flex flex-col xl:flex-row gap-3 bg-gray-50/50">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="ค้นหาเลขที่, หัวข้อ, หรือผู้ยื่น..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white hover:border-gray-300 shadow-sm"
                />
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="flex gap-2 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 items-center hide-scrollbar">
              
              {/* Type Filter */}
              <div className="relative min-w-[130px] shrink-0">
                <select 
                  value={filterType} 
                  onChange={(e) => { 
                    setFilterType(e.target.value); 
                    if(e.target.value !== 'RFA' && e.target.value !== 'ALL') {
                      setFilterSubType('ALL'); 
                      setFilterDiscipline('ALL');
                    }
                  }}
                  className="w-full appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
                >
                  <option value="ALL">ทุกประเภท</option>
                  <option value="RFA">RFA</option>
                  <option value="RFI">RFI</option>
                  <option value="VO">VO</option>
                  <option value="VR">VR</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              
              {/* SubType Filter */}
              <div className="relative min-w-[150px] shrink-0">
                <select 
                  value={filterSubType} 
                  onChange={(e) => {
                    setFilterSubType(e.target.value);
                    if(e.target.value === 'General' || e.target.value === 'ALL') {
                      setFilterDiscipline('ALL');
                    }
                  }}
                  disabled={filterType !== 'ALL' && filterType !== 'RFA'}
                  className="w-full appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white hover:bg-gray-50 transition-all cursor-pointer shadow-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-100 disabled:shadow-none"
                >
                  <option value="ALL">ทุกประเภทย่อย</option>
                  <option value="General">General</option>
                  <option value="Material">Material</option>
                  <option value="Shop Drawing">Shop Drawing</option>
                </select>
                <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${filterType !== 'ALL' && filterType !== 'RFA' ? 'text-gray-300' : 'text-gray-400'}`} />
              </div>

              {/* Discipline Filter */}
              <div className="relative min-w-[140px] shrink-0">
                <select 
                  value={filterDiscipline} 
                  onChange={(e) => setFilterDiscipline(e.target.value)}
                  disabled={(filterType !== 'ALL' && filterType !== 'RFA') || (filterSubType !== 'ALL' && filterSubType === 'General')}
                  className="w-full appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white hover:bg-gray-50 transition-all cursor-pointer shadow-sm disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-100 disabled:shadow-none"
                >
                  <option value="ALL">ทุกสาขา</option>
                  <option value="AR">AR (สถาปัตย์)</option>
                  <option value="ST">ST (โครงสร้าง)</option>
                  <option value="EE">EE (ไฟฟ้า)</option>
                  <option value="SN">SN (สุขาภิบาล)</option>
                  <option value="AC">AC (ปรับอากาศ)</option>
                  <option value="ME">ME (เครื่องกล)</option>
                  <option value="FP">FP (ดับเพลิง)</option>
                  <option value="ID">ID (ตกแต่งภายใน)</option>
                </select>
                <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${((filterType !== 'ALL' && filterType !== 'RFA') || (filterSubType !== 'ALL' && filterSubType === 'General')) ? 'text-gray-300' : 'text-gray-400'}`} />
              </div>

              {/* Status Filter */}
              <div className="relative min-w-[130px] shrink-0">
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
                >
                  <option value="ALL">ทุกสถานะ</option>
                  <option value="PENDING">PENDING</option>
                  <option value="REVIEWING">REVIEWING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              
              {/* Clear Filter Button */}
              {(searchQuery || filterType !== 'ALL' || filterSubType !== 'ALL' || filterDiscipline !== 'ALL' || filterStatus !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('ALL');
                    setFilterSubType('ALL');
                    setFilterDiscipline('ALL');
                    setFilterStatus('ALL');
                  }}
                  className="w-10 h-10 shrink-0 flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all border border-transparent hover:border-red-100 shadow-sm hover:shadow bg-white"
                  title="ล้างตัวกรอง"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={32} className="text-blue-600 animate-spin" />
              <p className="text-sm text-gray-400 font-medium">กำลังโหลดข้อมูลเอกสาร...</p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <AlertTriangle size={32} className="text-red-400" />
              <p className="text-sm text-red-500 font-medium text-center px-4">{error}</p>
              <button onClick={fetchDocuments} className="text-sm text-blue-600 hover:text-blue-700 font-bold mt-2">ลองใหม่อีกครั้ง</button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && documents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <FileText size={40} className="text-gray-300" />
              <p className="text-sm text-gray-400 font-medium">ยังไม่มีเอกสารในระบบ</p>
              <p className="text-xs text-gray-300">กดปุ่ม "Seed Data" เพื่อเพิ่มข้อมูลตัวอย่าง หรือ "ยื่นคำขอใหม่" เพื่อสร้างเอกสาร</p>
            </div>
          )}

          {/* Table */}
          {!loading && !error && documents.length > 0 && (
            <div className="overflow-x-auto w-full">
              {filteredDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <p className="text-sm text-gray-500 font-medium">ไม่พบเอกสารที่ตรงกับเงื่อนไขการค้นหา</p>
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setFilterType('ALL');
                      setFilterSubType('ALL');
                      setFilterDiscipline('ALL');
                      setFilterStatus('ALL');
                    }}
                    className="text-xs text-blue-600 hover:underline mt-1 bg-transparent border-none cursor-pointer font-bold"
                  >
                    ล้างตัวกรองทั้งหมด
                  </button>
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-[#f9fafc] text-[10px] uppercase tracking-wider text-gray-400 font-bold border-b border-gray-100">
                      <th className="py-4 px-6 font-bold">เลขที่เอกสาร</th>
                      <th className="py-4 px-6 font-bold">ประเภท</th>
                      <th className="py-4 px-6 font-bold">หัวข้อ</th>
                      <th className="py-4 px-6 font-bold">ผู้ยื่น</th>
                      <th className="py-4 px-6 font-bold">สถานะ</th>
                      <th className="py-4 px-6 font-bold text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {filteredDocuments.map((doc) => (
                      <tr key={doc._id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors group cursor-pointer">
                        <td className="py-4 px-6 font-bold text-blue-600">
                          <button
                            className="hover:underline bg-transparent border-none cursor-pointer text-blue-600 font-bold"
                            onClick={() => { setSelectedDoc(doc); setShowDetailModal(true); }}
                          >
                            {doc.documentNo}
                          </button>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                            doc.type === 'RFA' ? 'bg-blue-50 text-blue-600' :
                            doc.type === 'RFI' ? 'bg-purple-50 text-purple-600' :
                            doc.type === 'VO' ? 'bg-amber-50 text-amber-600' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {formatTypeDisplay(doc)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-700">{doc.subject}</td>
                        <td className="py-4 px-6 text-gray-500 italic text-xs">{doc.originatorName}</td>
                        <td className="py-4 px-6">
                          <StatusBadge status={doc.status?.toUpperCase() || 'PENDING'} />
                        </td>
                        <td className="py-4 px-6 text-right relative">
                          <button
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors inline-flex items-center justify-center bg-transparent border-none cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuOpen(actionMenuOpen === doc._id ? null : doc._id);
                            }}
                          >
                            <MoreVertical size={18} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                          </button>

                          {/* Action Dropdown */}
                          {actionMenuOpen === doc._id && (
                            <div className="absolute right-6 top-12 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-30 w-44 animate-fade-in">
                              <button
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors bg-transparent border-none cursor-pointer"
                                onClick={() => { setSelectedDoc(doc); setShowDetailModal(true); setActionMenuOpen(null); }}
                              >
                                <Eye size={15} className="text-blue-500" /> ดูรายละเอียด
                              </button>
                              <button
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors bg-transparent border-none cursor-pointer"
                                onClick={() => { setSelectedDoc(doc); setShowStatusModal(true); setActionMenuOpen(null); }}
                              >
                                <Edit3 size={15} className="text-emerald-500" /> เปลี่ยนสถานะ
                              </button>
                              <div className="border-t border-gray-100 my-1"></div>
                              <button
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors bg-transparent border-none cursor-pointer"
                                onClick={() => { setSelectedDoc(doc); setShowDeleteModal(true); setActionMenuOpen(null); }}
                              >
                                <Trash2 size={15} /> ลบเอกสาร
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Bottom spacer */}
          <div className="p-4 bg-white rounded-b-2xl"></div>
        </div>
      </main>

      {/* ===== CREATE DOCUMENT MODAL ===== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto my-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">สร้างเอกสารใหม่</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors bg-transparent border-none cursor-pointer">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">เลขที่เอกสาร</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น NKC-STI-NDVO-GL-057-2568"
                  value={formData.documentNo}
                  onChange={(e) => setFormData({ ...formData, documentNo: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">ประเภทเอกสาร</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value, subType: e.target.value === 'RFA' ? 'General' : '', discipline: '' })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="RFA">RFA - Request for Approval</option>
                  <option value="RFI">RFI - Request for Information</option>
                  <option value="VO">VO - Variation Order</option>
                  <option value="VR">VR - Verification Report</option>
                </select>
              </div>
              {/* Sub-Type dropdown (RFA only) */}
              {formData.type === 'RFA' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">ประเภทย่อย RFA</label>
                  <select
                    value={formData.subType}
                    onChange={(e) => {
                      const newSubType = e.target.value;
                      const opts = disciplineOptions[newSubType];
                      setFormData({ ...formData, subType: newSubType, discipline: opts ? opts[0] : '' });
                    }}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                  >
                    <option value="General">General</option>
                    <option value="Material">Material</option>
                    <option value="Shop Drawing">Shop Drawing</option>
                  </select>
                </div>
              )}
              {/* Discipline dropdown (Material / Shop Drawing) */}
              {formData.type === 'RFA' && (formData.subType === 'Material' || formData.subType === 'Shop Drawing') && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">สาขา (Discipline)</label>
                  <select
                    value={formData.discipline}
                    onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                  >
                    {(disciplineOptions[formData.subType] || []).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">หัวข้อ / รายละเอียด</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น งานระบบปรับอากาศชั้น 5 Zone A"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">ผู้ยื่นเอกสาร</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น Site Eng. Somchai"
                  value={formData.originatorName}
                  onChange={(e) => setFormData({ ...formData, originatorName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">แนบไฟล์ PDF</label>
                <div
                  className={`relative w-full border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    pdfFile ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => setPdfFile(e.target.files[0] || null)}
                  />
                  {pdfFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText size={20} className="text-blue-600" />
                      <span className="text-sm font-medium text-blue-600 truncate max-w-[250px]">{pdfFile.name}</span>
                      <button
                        type="button"
                        className="ml-2 p-1 hover:bg-red-100 rounded-full transition-colors bg-transparent border-none cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); setPdfFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      >
                        <X size={14} className="text-red-500" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Upload size={24} className="text-gray-400" />
                      <p className="text-xs text-gray-400">คลิกเพื่อเลือกไฟล์ PDF</p>
                      <p className="text-[10px] text-gray-300">รองรับเฉพาะไฟล์ .pdf</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors bg-white cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 border-none cursor-pointer"
                >
                  {formSubmitting ? 'กำลังบันทึก...' : 'บันทึกเอกสาร'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== DETAIL MODAL ===== */}
      {showDetailModal && selectedDoc && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowDetailModal(false); setSelectedDoc(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">รายละเอียดเอกสาร</h3>
              <button onClick={() => { setShowDetailModal(false); setSelectedDoc(null); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors bg-transparent border-none cursor-pointer">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">เลขที่เอกสาร</p>
                  <p className="text-sm font-bold text-blue-600">{selectedDoc.documentNo}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">ประเภท</p>
                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                    selectedDoc.type === 'RFA' ? 'bg-blue-50 text-blue-600' :
                    selectedDoc.type === 'RFI' ? 'bg-purple-50 text-purple-600' :
                    selectedDoc.type === 'VO' ? 'bg-amber-50 text-amber-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>{formatTypeDisplay(selectedDoc)}</span>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">หัวข้อ</p>
                  <p className="text-sm text-gray-700">{selectedDoc.subject}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">ผู้ยื่น</p>
                  <p className="text-sm text-gray-700">{selectedDoc.originatorName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">สถานะ</p>
                  <StatusBadge status={selectedDoc.status?.toUpperCase() || 'PENDING'} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">วันที่สร้าง</p>
                  <p className="text-sm text-gray-700">{formatDate(selectedDoc.createdAt)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">อัปเดตล่าสุด</p>
                  <p className="text-sm text-gray-700">{formatDate(selectedDoc.updatedAt)}</p>
                </div>
              </div>
              {/* PDF File Section */}
              {selectedDoc.pdfUrl ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <FileText size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">ไฟล์ PDF แนบ</p>
                      <p className="text-[10px] text-gray-400 truncate max-w-[200px]">{selectedDoc.pdfUrl.split('/').pop() || 'document.pdf'}</p>
                    </div>
                  </div>
                  <a
  href={selectedDoc.pdfUrl}
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors no-underline"
>
  <Download size={14} /> เปิดไฟล์
</a>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <FileText size={20} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-400">ไม่มีไฟล์ PDF แนบ</p>
                </div>
              )}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => { setShowDetailModal(false); setShowStatusModal(true); }}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors border-none cursor-pointer flex items-center justify-center gap-2"
                >
                  <Edit3 size={15} /> เปลี่ยนสถานะ
                </button>
                <button
                  onClick={() => { setShowDetailModal(false); setShowDeleteModal(true); }}
                  className="py-2.5 px-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors border-none cursor-pointer flex items-center justify-center gap-2"
                >
                  <Trash2 size={15} /> ลบ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== STATUS UPDATE MODAL ===== */}
      {showStatusModal && selectedDoc && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowStatusModal(false); setSelectedDoc(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">เปลี่ยนสถานะ</h3>
              <button onClick={() => { setShowStatusModal(false); setSelectedDoc(null); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors bg-transparent border-none cursor-pointer">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-xs text-gray-500 mb-1">เอกสาร: <span className="font-bold text-blue-600">{selectedDoc.documentNo}</span></p>
              <p className="text-xs text-gray-400 mb-4">สถานะปัจจุบัน: <StatusBadge status={selectedDoc.status?.toUpperCase() || 'PENDING'} /></p>
              <div className="space-y-2">
                {['Pending', 'Reviewing', 'Approved', 'Rejected'].map((st) => (
                  <button
                    key={st}
                    disabled={formSubmitting || selectedDoc.status === st}
                    onClick={() => handleStatusUpdate(st)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all border cursor-pointer ${
                      selectedDoc.status === st
                        ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                        : st === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                        : st === 'Pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100'
                        : st === 'Reviewing' ? 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
                        : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                    }`}
                  >
                    {st === 'Pending' && '⏳ Pending'}
                    {st === 'Reviewing' && '🔍 Reviewing'}
                    {st === 'Approved' && '✅ Approved'}
                    {st === 'Rejected' && '❌ Rejected'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRM MODAL ===== */}
      {showDeleteModal && selectedDoc && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowDeleteModal(false); setSelectedDoc(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">ยืนยันการลบเอกสาร</h3>
              <p className="text-sm text-gray-500 mb-1">คุณต้องการลบเอกสาร</p>
              <p className="text-sm font-bold text-blue-600 mb-4">{selectedDoc.documentNo} — {selectedDoc.subject}</p>
              <p className="text-xs text-red-400 mb-6">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setSelectedDoc(null); }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors bg-white cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleDelete}
                  disabled={formSubmitting}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50 border-none cursor-pointer"
                >
                  {formSubmitting ? 'กำลังลบ...' : 'ยืนยันลบ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentPage;