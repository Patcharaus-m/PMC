import axios from 'axios';

// Axios instance — uses VITE_BACKEND_URL for local dev, falls back to Render production
const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL || 'https://pmc-alwb.onrender.com'}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============ Auth ============

export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (name, email, password, confirmPassword, role) => {
  const response = await api.post('/auth/register', {
    name,
    email,
    password,
    confirmPassword,
    role,
  });
  return response.data;
};

// ============ Dashboard ============

export const getDashboardSummary = async (projectId) => {
  const params = projectId ? { projectId } : {};
  const response = await api.get('/dashboard/summary', { params });
  return response.data;
};

// ============ Projects ============

export const getProjects = async () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const params = user._id ? { userId: user._id } : {};
  const response = await api.get('/projects', { params });
  return response.data;
};

export const createNewProject = async (data) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const response = await api.post('/projects', { ...data, userId: user._id });
  return response.data;
};

export const updateProject = async (id, data) => {
  const response = await api.put(`/projects/${id}`, data);
  return response.data;
};

export const deleteProject = async (id) => {
  const response = await api.delete(`/projects/${id}`);
  return response.data;
};

// ============ Documents ============

export const getDocuments = async (projectId) => {
  const params = projectId ? { projectId } : {};
  const response = await api.get('/documents', { params });
  return response.data;
};

export const getDocumentById = async (id) => {
  const response = await api.get(`/documents/${id}`);
  return response.data;
};

export const uploadDocument = async (formData) => {
  const response = await api.post('/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const createDocument = async (data) => {
  const response = await api.post('/documents', data);
  return response.data;
};

export const updateDocumentStatus = async (id, status) => {
  const response = await api.put(`/documents/${id}/status`, { status });
  return response.data;
};

export const deleteDocument = async (id) => {
  const response = await api.delete(`/documents/${id}`);
  return response.data;
};

export const seedDocuments = async (projectId) => {
  const response = await api.post('/documents/seed', { projectId: projectId || undefined });
  return response.data;
};

// ============ Inspections ============

export const getInspections = async (zone, projectId) => {
  const params = {};
  if (zone && zone !== 'ทุกโซน') params.zone = zone;
  if (projectId) params.projectId = projectId;
  const response = await api.get('/inspections', { params });
  return response.data;
};

export const getInspectionSummary = async (projectId) => {
  const params = projectId ? { projectId } : {};
  const response = await api.get('/inspections/summary', { params });
  return response.data;
};

export const seedInspections = async (projectId) => {
  const response = await api.post('/inspections/seed', { projectId: projectId || undefined });
  return response.data;
};

export const createInspection = async (data) => {
  const response = await api.post('/inspections', data);
  return response.data;
};

export const updateInspection = async (id, data) => {
  const response = await api.put(`/inspections/${id}`, data);
  return response.data;
};

export const deleteInspection = async (id) => {
  const response = await api.delete(`/inspections/${id}`);
  return response.data;
};

// ============ Plan Status ============

export const updatePlanStatus = async (projectId, planId, status, actualProgress) => {
  const response = await api.put(`/projects/${projectId}/plans/${planId}/status`, {
    status,
    actualProgress,
  });
  return response.data;
};

export default api;
