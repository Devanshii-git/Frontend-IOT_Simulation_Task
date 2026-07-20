export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')}/api/v1`
  : 'http://localhost:8000/api/v1'

export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL
  ? `${import.meta.env.VITE_WS_BASE_URL.replace(/\/+$/, '')}/api/v1`
  : API_BASE_URL.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')

export const DEVICE_SIMULATOR_BASE_URL = API_BASE_URL
export const TELEMETRY_BASE_URL = import.meta.env.VITE_TELEMETRY_BASE_URL
  ? `${import.meta.env.VITE_TELEMETRY_BASE_URL.replace(/\/+$/, '')}/api/v1`
  : API_BASE_URL

export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'

