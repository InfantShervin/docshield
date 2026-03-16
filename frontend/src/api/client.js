import axios from 'axios'
import { useAuthStore } from '../utils/store'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '' })

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
}
export const analyzeAPI = {
  upload: (formData, onProgress) =>
    api.post('/api/analyze/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total)),
      timeout: 300000,
    }),
}
export const chatAPI = {
  send: (scan_id, message, history) => api.post('/api/chat/', { scan_id, message, history }),
  getHistory: (scan_id) => api.get(`/api/chat/${scan_id}/history`),
}
export const historyAPI = {
  list: () => api.get('/api/history/'),
  stats: () => api.get('/api/history/stats'),
  get: (id) => api.get(`/api/history/${id}`),
  star: (id) => api.patch(`/api/history/${id}/star`),
  delete: (id) => api.delete(`/api/history/${id}`),
}