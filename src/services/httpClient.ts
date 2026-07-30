import axios from 'axios'
import { API_BASE_URL } from '@/config/api'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

httpClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const showError = useToastStore.getState().showError

    if (error.response) {
      const status = error.response.status
      const detail = error.response.data?.detail || error.response.data?.message

      if (status === 401) {
        useAuthStore.getState().logout()
        showError('Session expired. Please sign in again.')
      } else if (status === 500) {
        showError('Server Error: An internal server error occurred.')
      } else if (detail) {
        showError(String(detail))
      }
    } else {
      // Log network-level connection/timeout issues to console instead of showing intrusive toasts
      console.warn('Network connection issue:', error.message)
    }
    return Promise.reject(error)
  }
)

