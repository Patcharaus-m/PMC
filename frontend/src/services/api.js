import axios from 'axios';

// Axios instance with base URL pointing to the backend API
const api = axios.create({
  baseURL: 'https://pmc-alwb.onrender.com',
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

export const getDashboardSummary = async () => {
  const response = await api.get('/dashboard/summary');
  return response.data;
};

// ============ Documents ============

export const getDocuments = async () => {
  const response = await api.get('/documents');
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

export const seedDocuments = async () => {
  const response = await api.post('/documents/seed');
  return response.data;
};

// ============ Inspections ============

export const getInspections = async (zone) => {
  const params = zone && zone !== 'All Zones' ? { zone } : {};
  const response = await api.get('/inspections', { params });
  return response.data;
};

export const getInspectionSummary = async () => {
  const response = await api.get('/inspections/summary');
  return response.data;
};

export const seedInspections = async () => {
  const response = await api.post('/inspections/seed');
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

export default api;
