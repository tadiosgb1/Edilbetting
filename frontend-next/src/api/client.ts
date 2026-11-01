import axios from 'axios'

const baseURL = import.meta.env.VITE_APP_BASE_URL_LOCAL || 'http://localhost:3000'
export const api = axios.create({ baseURL, timeout: 15000 })
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
export default api