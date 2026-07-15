import type { Alert, AlertRule, TelemetryPoint, ActivityItem, PendingProfile } from '@/types'
import { API_BASE_URL, USE_MOCK_API } from '@/config/api'
import { useDeviceStore } from '@/store/deviceStore'

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

export async function verifyOtpApi(email: string, otp_code: string) {
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

  const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, otp_code }),
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

  try {
    const res = await fetch(`${API_BASE_URL}/alerts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) throw new Error('Failed to fetch alerts')
    const rawAlerts = await res.json()
    
    const devices = useDeviceStore.getState().devices
    const deviceMap = new Map(devices.map(d => [d.id, d.name]))

    return rawAlerts.map((a: any) => {
      const isGt = a.actual_value > a.threshold_value
      const condition = isGt ? 'gt' : 'lt'
      const deviceName = deviceMap.get(a.device_id) ?? 'Unknown Device'
      
      let unit = ''
      const metric = a.metric_name || ''
      if (metric === 'temperature') unit = '°C'
      else if (metric === 'humidity') unit = '%'
      else if (metric === 'fps') unit = ' fps'
      else if (metric === 'battery_level' || metric === 'battery') unit = '%'

      return {
        id: a.id,
        deviceId: a.device_id,
        deviceName,
        severity: (a.severity || 'WARNING').toLowerCase() as 'warning' | 'critical' | 'info',
        condition,
        value: `${a.actual_value.toFixed(1)}${unit}`,
        timestamp: a.created_at || new Date().toISOString(),
        acknowledged: a.is_resolved || false,
      }
    })
  } catch (err) {
    console.error('Error fetching alerts', err)
    return []
  }
}

export async function acknowledgeAlertApi(id: string): Promise<Alert> {
  if (USE_MOCK_API) {
    await delay(100)
    const alert = mockAlertsStore.find((a) => a.id === id)
    if (!alert) throw new Error(`Alert not found: ${id}`)
    alert.acknowledged = true
    return alert
  }

  await delay(100)
  return {
    id,
    deviceId: '',
    deviceName: 'Resolved Alert',
    severity: 'warning',
    condition: 'gt',
    value: '0',
    timestamp: new Date().toISOString(),
    acknowledged: true,
  }
}

export async function getAlertRulesApi(): Promise<AlertRule[]> {
  if (USE_MOCK_API) {
    await delay(200)
    return [...mockRulesStore]
  }

  try {
    const devices = useDeviceStore.getState().devices
    if (devices.length === 0) return []

    const allRules: AlertRule[] = []
    
    await Promise.all(
      devices.map(async (device) => {
        try {
          const res = await fetch(`${API_BASE_URL}/alerts/rules/${device.id}`)
          if (!res.ok) return
          const rawRules = await res.json()
          
          rawRules.forEach((r: any) => {
            const hasMax = r.max_threshold !== null && r.max_threshold !== undefined
            const threshold = hasMax ? r.max_threshold : (r.min_threshold ?? 0)
            const condition = hasMax ? 'gt' : 'lt'

            allRules.push({
              id: r.id,
              deviceId: r.device_id,
              deviceName: device.name,
              metric: r.metric_name,
              condition,
              threshold,
              notifyVia: ['email'],
              enabled: true,
            })
          })
        } catch (e) {
          console.warn(`Failed to fetch rules for device ${device.id}`, e)
        }
      })
    )

    return allRules
  } catch (err) {
    console.error('Error fetching alert rules', err)
    return []
  }
}

export async function createAlertRuleApi(rule: Omit<AlertRule, 'id'>): Promise<AlertRule> {
  if (USE_MOCK_API) {
    await delay(200)
    const newRule: AlertRule = { ...rule, id: `rule-${Date.now()}` }
    mockRulesStore.push(newRule)
    return newRule
  }

  try {
    const payload = {
      device_id: rule.deviceId,
      metric_name: rule.metric,
      max_threshold: rule.condition === 'gt' ? rule.threshold : null,
      min_threshold: rule.condition === 'lt' ? rule.threshold : null,
      severity: 'WARNING',
    }

    const res = await fetch(`${API_BASE_URL}/alerts/rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      throw new Error(`Failed to create alert rule: ${await res.text()}`)
    }

    const raw = await res.json()
    const hasMax = raw.max_threshold !== null && raw.max_threshold !== undefined
    const threshold = hasMax ? raw.max_threshold : (raw.min_threshold ?? 0)
    const condition = hasMax ? 'gt' : 'lt'

    return {
      id: raw.id,
      deviceId: raw.device_id,
      deviceName: rule.deviceName,
      metric: raw.metric_name,
      condition,
      threshold,
      notifyVia: ['email'],
      enabled: true,
    }
  } catch (err) {
    console.error('Error creating alert rule', err)
    const fallbackRule: AlertRule = { ...rule, id: `rule-${Date.now()}` }
    return fallbackRule
  }
}

export async function updateAlertRuleApi(id: string, payload: Partial<AlertRule>): Promise<AlertRule> {
  if (USE_MOCK_API) {
    await delay(200)
    const ruleIndex = mockRulesStore.findIndex((r) => r.id === id)
    if (ruleIndex === -1) throw new Error(`Rule not found: ${id}`)
    mockRulesStore[ruleIndex] = { ...mockRulesStore[ruleIndex], ...payload }
    return mockRulesStore[ruleIndex]
  }

  await delay(200)
  return {
    id,
    deviceId: '',
    deviceName: 'Updated Rule',
    metric: 'temperature',
    condition: 'gt',
    threshold: 0,
    notifyVia: ['email'],
    enabled: payload.enabled ?? true,
  }
}

export async function deleteAlertRuleApi(id: string) {
  if (USE_MOCK_API) {
    await delay(200)
    mockRulesStore = mockRulesStore.filter((r) => r.id !== id)
    return { success: true }
  }

  await delay(200)
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

// Local Mock Data Storage for Pending Profiles
let mockPendingProfilesStore: PendingProfile[] = [
  {
    id: 'prof-1',
    deviceName: 'AI-Thermostat-X1',
    deviceType: 'temperature_sensor',
    protocol: 'MQTT',
    status: 'pending_review',
    aiConfidence: 0.94,
    generatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    profileData: {
      manufacturer: 'SmartClimate Corp',
      model: 'SC-X1',
      firmwareVersion: 'v1.4.2-patch3',
      metricsThresholds: [
        { metric: 'temperature', min: 15, max: 35, severity: 'critical' },
        { metric: 'humidity', min: 20, max: 80, severity: 'warning' },
        { metric: 'battery_level', min: 15, severity: 'critical' }
      ],
      supportedCommands: ['set_temperature', 'toggle_power', 'reboot']
    }
  },
  {
    id: 'prof-2',
    deviceName: 'AI-Security-Cam-Y',
    deviceType: 'camera',
    protocol: 'HTTP',
    status: 'pending_review',
    aiConfidence: 0.88,
    generatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    profileData: {
      manufacturer: 'SecureEye Systems',
      model: 'SE-Cam-Y2',
      firmwareVersion: 'v2.1.0-beta',
      metricsThresholds: [
        { metric: 'fps', min: 15, max: 60, severity: 'warning' },
        { metric: 'brightness', min: 5, max: 100, severity: 'info' }
      ],
      supportedCommands: ['pan_camera', 'tilt_camera', 'zoom_in', 'zoom_out', 'trigger_night_mode']
    }
  },
  {
    id: 'prof-3',
    deviceName: 'AI-Auditorium-Mic',
    deviceType: 'microphone',
    protocol: 'WebSocket',
    status: 'pending_review',
    aiConfidence: 0.79,
    generatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    profileData: {
      manufacturer: 'AcousticsPro Inc',
      model: 'AP-Mic-3000',
      firmwareVersion: 'v3.0.1',
      metricsThresholds: [
        { metric: 'audio_level', min: 20, max: 95, severity: 'warning' },
        { metric: 'sensitivity', min: 40, max: 100, severity: 'info' }
      ],
      supportedCommands: ['set_gain', 'toggle_mute', 'enable_noise_cancellation']
    }
  }
]

export async function getPendingProfilesApi(): Promise<PendingProfile[]> {
  if (USE_MOCK_API) {
    await delay(300)
    return [...mockPendingProfilesStore]
  }

  const res = await fetch(`${API_BASE_URL}/profiles/pending`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || 'Failed to fetch pending profiles')
  }

  return await res.json()
}

export async function approveProfileApi(id: string, updatedProfileData: any): Promise<{ success: boolean; message: string }> {
  if (USE_MOCK_API) {
    await delay(400)
    // In mock mode, log the approved state and remove from pending queue
    console.log(`Mock approved profile ${id} with data:`, updatedProfileData)
    mockPendingProfilesStore = mockPendingProfilesStore.filter((p) => p.id !== id)
    return { success: true, message: 'Profile approved and added to registry successfully.' }
  }

  const res = await fetch(`${API_BASE_URL}/profiles/${id}/approve`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatedProfileData),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || 'Failed to approve profile')
  }

  return await res.json()
}

export async function rejectProfileApi(id: string): Promise<{ success: boolean; message: string }> {
  if (USE_MOCK_API) {
    await delay(300)
    mockPendingProfilesStore = mockPendingProfilesStore.filter((p) => p.id !== id)
    return { success: true, message: 'Profile draft rejected and discarded.' }
  }

  const res = await fetch(`${API_BASE_URL}/profiles/${id}/reject`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || 'Failed to reject profile')
  }

  return await res.json()
}


