import React, { useState } from 'react';
import { User, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const ROLE_LABELS = {
  Admin: 'ผู้ดูแลระบบ',
  PM: 'ผู้จัดการโครงการ',
  SiteEngineer: 'วิศวกรสนาม',
  Inspector: 'ผู้ตรวจสอบ',
  DocumentController: 'ผู้ควบคุมเอกสาร',
};

const HeaderProfile = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Read logged-in user from localStorage
  let user = null;
  try {
    const raw = localStorage.getItem('user');
    if (raw) user = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse user from localStorage', e);
  }

  const userName = user?.name || 'ผู้เยี่ยมชม';
  const userRole = ROLE_LABELS[user?.role] || user?.role || 'UNKNOWN';

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('selectedProjectId');
    localStorage.removeItem('selectedProjectName');
    setIsOpen(false);
    navigate('/');
  };

  return (
    <div className="relative">
      
      <button 
        type="button"
        className="flex items-center gap-3 sm:border-l sm:pl-6 cursor-pointer group bg-transparent border-none outline-none focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{userName}</p>
          <p className="text-[10px] text-gray-500 uppercase">{userRole}</p>
        </div>
        <div className="bg-gray-100 p-2 rounded-full text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
          <User size={20}/>
        </div>
      </button>

      {/* เมนู Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>

          <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
              <p className="text-sm font-bold text-gray-800">{userName}</p>
              <p className="text-[10px] text-gray-500 uppercase">{userRole}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 text-sm font-bold transition-colors w-full text-left"
            >
              <LogOut size={18} />
              ออกจากระบบ
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default HeaderProfile;