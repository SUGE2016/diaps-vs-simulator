/**
 * API服务层 - 与后端API通信
 */
import axios from 'axios';

// 创建axios实例
const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// ============= 产线API =============
export const productionLineAPI = {
  list: () => apiClient.get('/production-lines'),
  get: (id) => apiClient.get(`/production-lines/${id}`),
  create: (data) => apiClient.post('/production-lines', data),
  update: (id, data) => apiClient.put(`/production-lines/${id}`, data),
  delete: (id) => apiClient.delete(`/production-lines/${id}`),
};

// ============= 工作站API =============
export const workstationAPI = {
  list: (lineId = null) => 
    apiClient.get('/workstations', { params: { production_line_id: lineId } }),
  get: (id) => apiClient.get(`/workstations/${id}`),
  create: (data) => apiClient.post('/workstations', data),
  update: (id, data) => apiClient.put(`/workstations/${id}`, data),
  delete: (id) => apiClient.delete(`/workstations/${id}`),
};

// ============= 缓冲区API =============
export const bufferAPI = {
  list: (lineId = null) => 
    apiClient.get('/buffers', { params: { production_line_id: lineId } }),
  get: (id) => apiClient.get(`/buffers/${id}`),
  create: (data) => apiClient.post('/buffers', data),
  update: (id, data) => apiClient.put(`/buffers/${id}`, data),
  delete: (id) => apiClient.delete(`/buffers/${id}`),
};

// ============= 运输路径API =============
export const transportPathAPI = {
  list: (lineId = null) => 
    apiClient.get('/transport-paths', { params: { production_line_id: lineId } }),
  get: (id) => apiClient.get(`/transport-paths/${id}`),
  create: (data) => apiClient.post('/transport-paths', data),
  update: (id, data) => apiClient.put(`/transport-paths/${id}`, data),
  delete: (id) => apiClient.delete(`/transport-paths/${id}`),
};

// ============= 流转路径API =============
export const routineAPI = {
  list: (lineId = null) => 
    apiClient.get('/routines', { params: { production_line_id: lineId } }),
  get: (id) => apiClient.get(`/routines/${id}`),
  create: (data) => apiClient.post('/routines', data),
  update: (id, data) => apiClient.put(`/routines/${id}`, data),
  delete: (id) => apiClient.delete(`/routines/${id}`),
};

// ============= 配置管理API =============
export const configAPI = {
  validate: (data) => apiClient.post('/config/validate', data),
  validateFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/config/validate-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  importFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/config/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  importJSON: (data) => apiClient.post('/config/import-json', data),
  export: (lineId, format = 'json') => 
    apiClient.get(`/config/export/${lineId}`, { 
      params: { format },
      responseType: 'blob'
    }),
  validateLine: (lineId) => apiClient.get(`/config/validate-production-line/${lineId}`),
};

export default apiClient;

