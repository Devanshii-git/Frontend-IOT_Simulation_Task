import type { Alert, AlertRule, TelemetryPoint, ActivityItem } from '@/types'
import { API_BASE_URL, USE_MOCK_API } from '@/config/api'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Local Mock Data Storage for Mock Mode
const mockAlertsStore: Alert[] = [
  {
    id: 'alert-1',
    deviceId: 'device-temp-01',
    deviceName: 'Office Thermostat',
    severity: 'warning',
    condition: 'gt',
    value: '29.4°C',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    acknowledged: false,
  },
  {
    id: 'alert-2',
    deviceId: 'device-cam-02',
    deviceName: 'Front Door Camera',
    severity: 'critical',
    condition: 'lt',
    value: '4 fps',
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    acknowledged: false,
  }
]

let mockRulesStore: AlertRule[] = [
  {
    id: 'rule-1',
    deviceId: 'device-temp-01',
    deviceName: 'Office Thermostat',
    metric: 'temperature',
    condition: 'gt',
    threshold: 28,
    notifyVia: ['email', 'push'],
    enabled: true,
  },
  {
    id: 'rule-2',
    deviceId: 'device-cam-02',
    deviceName: 'Front Door Camera',
    metric: 'fps',
    condition: 'lt',
    threshold: 10,
    notifyVia: ['email', 'sms', 'push'],
    enabled: true,
  }
]

const mockActivitiesStore: ActivityItem[] = [
  {
    id: 'act-1',
    message: 'Device Office Thermostat reported high temperature: 29.4°C',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    type: 'warning',
  },
  {
    id: 'act-2',
    message: 'Front Door Camera connection degraded (FPS dropped to 4)',
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    type: 'error',
  },
  {
    id: 'act-3',
    message: 'New device CEO Boardroom Mic successfully registered',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    type: 'success',
  }
]

// Auth API
export async function loginApi(email: string, password: string) {
  if (USE_MOCK_API) {
    await delay(300)
    return {
      token: 'mock-jwt-token-12345',
      user: {
        id: 'mock-admin-id',
        name: 'Mock Admin User',
        email: email || 'demo@iotlab.dev',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop'
      }
    }
  }

  const params = new URLSearchParams()
  params.append('username', email)
  params.append('password', password)

  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || 'Invalid email or password')
  }

  const data = await res.json() // { access_token, token_type }
  
  // Fetch user info from /auth/me using the token
  const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${data.access_token}`,
    },
  })
  
  if (!meRes.ok) {
    throw new Error('Failed to retrieve user profile details')
  }

  const user = await meRes.json()
  return { token: data.access_token, user }
}

export async function registerApi(name: string, email: string, password: string) {
  if (USE_MOCK_API) {
    await delay(300)
    return { success: true }
  }

  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password, role: 'Admin' }),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || 'Registration failed')
  }

  return { success: true }
}

export async function resendOtpApi(email: string) {
  if (USE_MOCK_API) {
    await delay(200)
    return { success: true }
  }

  const res = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || 'Failed to resend OTP')
  }

  return { success: true }
}

export async function verifyOtpApi(email: string, otp_code: string, name?: string, password?: string) {
  if (USE_MOCK_API) {
    await delay(300)
    return {
      token: 'mock-jwt-token-12345',
      user: {
        id: 'mock-admin-id',
        name: name || 'Mock Admin User',
        email: email || 'demo@iotlab.dev',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop'
      }
    }
  }

  const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, otp_code, name, password }),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || 'Invalid verification code')
  }

  const data = await res.json()
  
  // If verify-otp returns an access_token, fetch user info and auto-login
  if (data.access_token) {
    const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${data.access_token}`,
      },
    })
    
    if (meRes.ok) {
      const user = await meRes.json()
      return { token: data.access_token, user }
    }
  }

  return { success: true }
}

export async function googleAuthApi(name: string, email: string, token: string) {
  if (USE_MOCK_API) {
    await delay(300)
    return {
      token: 'mock-jwt-token-12345',
      user: {
        id: 'mock-admin-id',
        name: name || 'Mock Google User',
        email: email || 'google@example.com',
      }
    }
  }

  const res = await fetch(`${API_BASE_URL}/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      provider: 'google',
      email,
      name,
      token,
    }),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || 'Google auth failed')
  }

  const data = await res.json()

  const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${data.access_token}`,
    },
  })

  if (!meRes.ok) {
    throw new Error('Failed to retrieve user profile details')
  }

  const user = await meRes.json()
  return { token: data.access_token, user }
}

export async function githubAuthApi(name: string, email: string, token: string) {
  if (USE_MOCK_API) {
    await delay(300)
    return {
      token: 'mock-jwt-token-12345',
      user: {
        id: 'mock-admin-id',
        name: name || 'Mock GitHub User',
        email: email || 'github@example.com',
      }
    }
  }

  const res = await fetch(`${API_BASE_URL}/auth/github`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      provider: 'github',
      email,
      name,
      token,
    }),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || 'GitHub auth failed')
  }

  const data = await res.json()

  const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${data.access_token}`,
    },
  })

  if (!meRes.ok) {
    throw new Error('Failed to retrieve user profile details')
  }

  const user = await meRes.json()
  return { token: data.access_token, user }
}

// Alerts API
export async function getAlertsApi(): Promise<Alert[]> {
  if (USE_MOCK_API) {
    await delay(200)
    return [...mockAlertsStore]
  }

  await delay(300)
  return []
}

export async function acknowledgeAlertApi(id: string): Promise<Alert> {
  if (USE_MOCK_API) {
    await delay(100)
    const alert = mockAlertsStore.find((a) => a.id === id)
    if (!alert) throw new Error(`Alert not found: ${id}`)
    alert.acknowledged = true
    return alert
  }

  await delay(200)
  throw new Error(`Alert not found: ${id}`)
}

export async function getAlertRulesApi(): Promise<AlertRule[]> {
  if (USE_MOCK_API) {
    await delay(200)
    return [...mockRulesStore]
  }

  await delay(300)
  return []
}

export async function createAlertRuleApi(rule: Omit<AlertRule, 'id'>): Promise<AlertRule> {
  if (USE_MOCK_API) {
    await delay(200)
    const newRule: AlertRule = { ...rule, id: `rule-${Date.now()}` }
    mockRulesStore.push(newRule)
    return newRule
  }

  await delay(400)
  return { ...rule, id: `rule-${Date.now()}` }
}

export async function updateAlertRuleApi(id: string, payload: Partial<AlertRule>): Promise<AlertRule> {
  if (USE_MOCK_API) {
    await delay(200)
    const ruleIndex = mockRulesStore.findIndex((r) => r.id === id)
    if (ruleIndex === -1) throw new Error(`Rule not found: ${id}`)
    mockRulesStore[ruleIndex] = { ...mockRulesStore[ruleIndex], ...payload }
    return mockRulesStore[ruleIndex]
  }

  void id
  void payload
  await delay(300)
  throw new Error(`Rule not found: ${id}`)
}

export async function deleteAlertRuleApi(id: string) {
  if (USE_MOCK_API) {
    await delay(200)
    mockRulesStore = mockRulesStore.filter((r) => r.id !== id)
    return { success: true }
  }

  void id
  await delay(300)
  return { success: true }
}

export async function getActivitiesApi(): Promise<ActivityItem[]> {
  if (USE_MOCK_API) {
    await delay(200)
    return [...mockActivitiesStore]
  }

  await delay(200)
  return []
}

export async function getHistoricalTelemetryApi(
  deviceId: string,
  start: string,
  end: string,
): Promise<TelemetryPoint[]> {
  if (USE_MOCK_API) {
    await delay(300)
    const points: TelemetryPoint[] = []
    const baseTime = Date.now()
    for (let i = 20; i >= 0; i--) {
      const timestamp = new Date(baseTime - i * 60000).toISOString()
      let value: number
      if (deviceId.includes('temp') || deviceId.includes('sensor')) {
        value = 20 + Math.sin(i / 3) * 4 + Math.random() * 2
      } else if (deviceId.includes('cam')) {
        value = 24 + Math.random() * 6
      } else if (deviceId.includes('mic')) {
        value = 40 + Math.random() * 20
      } else if (deviceId.includes('spk')) {
        value = 10 + Math.random() * 5
      } else {
        value = Math.random() * 100
      }
      points.push({ timestamp, value })
    }
    return points
  }

  void deviceId
  void start
  void end
  await delay(500)
  return []
}
