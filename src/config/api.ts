export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api/v1`
  : 'http://localhost:8000/api/v1'

export const DEVICE_SIMULATOR_BASE_URL = API_BASE_URL
export const TELEMETRY_BASE_URL = import.meta.env.VITE_TELEMETRY_BASE_URL
  ? `${import.meta.env.VITE_TELEMETRY_BASE_URL}/api/v1`
  : 'http://localhost:8001/api/v1'
