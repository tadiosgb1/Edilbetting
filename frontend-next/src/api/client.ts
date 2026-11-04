import axios from 'axios'

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'

// Set to true to authenticate with a Bearer token from localStorage.
// Set to false to authenticate with cookies/credentials instead.
export const USE_BEARER_TOKEN = true

export const api = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: !USE_BEARER_TOKEN,
})

api.interceptors.request.use((config) => {
  if (USE_BEARER_TOKEN) {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      delete config.headers.Authorization
    }
  } else {
    // Cookie-based authentication: send credentials and do not attach a Bearer token.
    delete config.headers.Authorization
    config.withCredentials = true
  }

  return config
})

export default api
