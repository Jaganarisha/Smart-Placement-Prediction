import axios from "axios";

export const API_BASE_URL = "https://smart-placement-prediction.onrender.com";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export const getHealth = () => api.get("/health");
export const getAnalytics = () => api.get("/analytics");
export const getModelPerformance = () => api.get("/model-performance");
export const trainModel = () => api.post("/train-model");

export const predictPlacement = (payload) => api.post("/predict", payload);

export const listStudents = (params = {}) => api.get("/students", { params });
export const getStudent = (id) => api.get(`/students/${id}`);
export const createStudent = (payload) => api.post("/students", payload);
export const updateStudent = (id, payload) => api.put(`/students/${id}`, payload);
export const deleteStudent = (id) => api.delete(`/students/${id}`);

export default api;