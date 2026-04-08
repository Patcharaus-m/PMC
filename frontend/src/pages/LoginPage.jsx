import React, { useState } from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';
import myLogo from '../assets/LogoBack.png';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginUser(email, password);
      if (result.status === 1) {
        // Save user data to localStorage for later use
        localStorage.setItem('user', JSON.stringify(result.payload));
        navigate('/dashboard');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      const message = err.response?.data?.error || 'Unable to connect to server';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f4f7f9] font-sans">
      
      {/* --- ฝั่งซ้าย: Branding (ซ่อนในมือถือ) --- */}
      <div className="hidden lg:flex w-1/2 bg-[#0a0f1c] text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Abstract Background Decoration */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute top-40 -right-20 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>

        {/* Logo Section */}
        <div className="relative z-10 w-fit">
          <div className="bg-white p-4 flex justify-center items-center rounded-2xl shadow-md">
            <img 
              src={myLogo} 
              alt="PMC System Logo" 
              className="h-14 w-auto object-contain" 
            />
          </div>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl font-black mb-6 leading-tight">
            ยินดีต้อนรับกลับ
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            เข้าสู่ระบบเพื่อดำเนินการจัดการโครงการ ก่อสร้างอาคารสำนักงานอัจฉริยะ (SMART OFFICE TOWER) ของคุณต่อ
          </p>
        </div>

        {/* Footer Text */}
        <div className="relative z-10 text-xs text-gray-500 font-bold uppercase tracking-wider">
          © 2024 PMC Project Control Ecosystem
        </div>
      </div>

      {/* --- ฝั่งขวา: Login Form --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10">
          
          {/* Mobile Logo */}
          <div className="flex lg:hidden justify-center mb-8 w-full border-b pb-6 border-gray-100">
            <img 
              src={myLogo} 
              alt="PMC System Logo" 
              className="h-12 w-auto object-contain" 
            />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900 mb-2">เข้าสู่ระบบ</h2>
            <p className="text-sm text-gray-500">กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบ</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {/* อีเมล */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">อีเมล</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 text-gray-400" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all" 
                  placeholder="name@company.com" 
                  required 
                />
              </div>
            </div>

            {/* รหัสผ่าน */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">รหัสผ่าน</label>
                <a href="#" className="text-[10px] font-bold text-blue-600 hover:underline">ลืมรหัสผ่าน?</a>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 text-gray-400" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all" 
                  placeholder="••••••••" 
                  required 
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="remember" 
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs font-medium text-gray-600 cursor-pointer">
                จดจำฉัน 30 วัน
              </label>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-8 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 group"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>

          </form>

          {/* ลิงก์ไปหน้า Register */}
          <p className="mt-8 text-center text-xs text-gray-500 font-medium">
            ยังไม่มีบัญชี?{' '}
            <Link to="/register" className="text-blue-600 font-bold hover:underline">
              สมัครสมาชิกที่นี่
            </Link>
          </p>
          
        </div>
      </div>
    </div>
  );
};

export default LoginPage;