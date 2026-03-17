import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import DocumentPage from './pages/DocumentPage'
import QaqcPage from './pages/QaqcPage'
import CctvPage from './pages/CctvPage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import SystemConfigPage from './pages/SystemConfigPage'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/document" element={<DocumentPage />} />
        <Route path="/qaqc" element={<QaqcPage />} />
        <Route path="/cctv" element={<CctvPage />} />
        <Route path="/config" element={<SystemConfigPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
