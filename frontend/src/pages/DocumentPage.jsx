import React, { useState, useEffect, useRef } from 'react';
import { Menu, Plus, ChevronRight, Clock, X, Trash2, Edit3, Eye, MoreVertical, Database, Loader2, FileText, AlertTriangle, Upload, Download } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import HeaderProfile from '../components/HeaderProfile';
import { getDocuments, uploadDocument, updateDocumentStatus, deleteDocument, seedDocuments } from '../services/api';

const DocumentPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    subject: '',
    originatorName: '',
  });
  const [pdfFile, setPdfFile] = useState(null);
  const fileInputRef = useRef(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDocuments();
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
      await seedDocuments();
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
      fd.append('subject', formData.subject);
      fd.append('originatorName', formData.originatorName);
      if (pdfFile) {
        fd.append('pdf', pdfFile);
      }
      await uploadDocument(fd);
      setShowCreateModal(false);
      setFormData({ documentNo: '', type: 'RFA', subject: '', originatorName: '' });
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
            <h2 className="text-lg lg:text-xl font-bold text-gray-800 break-words leading-tight">โครงการก่อสร้างอาคารสำนักงานอัจฉริยะ (SMART OFFICE TOWER)</h2>
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
                <Plus size={18} /> + ยื่นคำขอใหม่
              </button>
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
                  {documents.map((doc) => (
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
                          {doc.type}
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
            </div>
          )}

          {/* Bottom spacer */}
          <div className="p-4 bg-white rounded-b-2xl"></div>
        </div>
      </main>

      {/* ===== CREATE DOCUMENT MODAL ===== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
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
                  placeholder="เช่น RFA-2024-002"
                  value={formData.documentNo}
                  onChange={(e) => setFormData({ ...formData, documentNo: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">ประเภทเอกสาร</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="RFA">RFA - Request for Approval</option>
                  <option value="RFI">RFI - Request for Information</option>
                  <option value="VO">VO - Variation Order</option>
                  <option value="VR">VR - Verification Report</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">หัวข้อ / รายละเอียด</label>
                <input
                  type="text"
                  required
                  placeholder="ระบุหัวข้อเอกสาร"
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
                  placeholder="ชื่อผู้ยื่น"
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
                  }`}>{selectedDoc.type}</span>
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
                    href={`http://localhost:3000/${selectedDoc.pdfUrl}`}
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