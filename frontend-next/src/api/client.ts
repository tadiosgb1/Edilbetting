import axios from 'axios'

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'
export const api = axios.create({ baseURL, timeout: 15000 })
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
export default api