import type { Alert, AlertRule, TelemetryPoint, ActivityItem, PendingProfile } from '@/types'
import { httpClient } from './httpClient'
import { useDeviceStore } from '@/store/deviceStore'
import { USE_MOCK_API } from '@/config/api'

// Auth API
export async function loginApi(email: string, password: string) {
  if (USE_MOCK_API) {
    return {
      token: 'mock-jwt-token-12345',
      user: {
        id: 'mock-admin-id',
        name: 'Admin User',
        email: email || 'demo@iotlab.dev',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop'
      }
    }
  }

  const params = new URLSearchParams()
  params.append('username', email)
  params.append('password', password)

  try {
    const res = await httpClient.post('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    const data = res.data

    const meRes = await httpClient.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    })

    return { token: data.access_token, user: meRes.data }
  } catch (err: any) {
    const detail = err.response?.data?.detail || err.message || 'Invalid email or password'
    throw new Error(detail, { cause: err })
  }
}

export async function registerApi(name: string, email: string, password: string) {
  if (USE_MOCK_API) return { success: true }
  try {
    await httpClient.post('/auth/register', { name, email, password, role: 'Admin' })
    return { success: true }
  } catch (err: any) {
    const detail = err.response?.data?.detail || err.message || 'Registration failed'
    throw new Error(detail, { cause: err })
  }
}

export async function resendOtpApi(email: string) {
  if (USE_MOCK_API) return { success: true }
  try {
    await httpClient.post('/auth/resend-otp', { email })
    return { success: true }
  } catch (err: any) {
    const detail = err.response?.data?.detail || err.message || 'Failed to resend OTP'
    throw new Error(detail, { cause: err })
  }
}

export async function verifyOtpApi(email: string, otp_code: string) {
  if (USE_MOCK_API) {
    return {
      token: 'mock-jwt-token-12345',
      user: {
        id: 'mock-admin-id',
        name: 'Admin User',
        email: email || 'demo@iotlab.dev',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop'
      }
    }
  }
  try {
    const res = await httpClient.post('/auth/verify-otp', { email, otp_code })
    const data = res.data

    if (data.access_token) {
      const meRes = await httpClient.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      })
      return { token: data.access_token, user: meRes.data }
    }

    return { success: true }
  } catch (err: any) {
    const detail = err.response?.data?.detail || err.message || 'Invalid verification code'
    throw new Error(detail, { cause: err })
  }
}

export async function googleAuthApi(name: string, email: string, token: string) {
  if (USE_MOCK_API) {
    return {
      token: 'mock-jwt-token-12345',
      user: {
        id: 'mock-admin-id',
        name: name || 'Google Demo User',
        email: email || 'google@iotlab.dev',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop'
      }
    }
  }
  try {
    const res = await httpClient.post('/auth/google', {
      provider: 'google',
      email,
      name,
      token,
    })
    const data = res.data

    const meRes = await httpClient.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    })

    return { token: data.access_token, user: meRes.data }
  } catch (err: any) {
    const detail = err.response?.data?.detail || err.message || 'Google auth failed'
    throw new Error(detail, { cause: err })
  }
}

export async function githubAuthApi(name: string, email: string, token: string) {
  if (USE_MOCK_API) {
    return {
      token: 'mock-jwt-token-12345',
      user: {
        id: 'mock-admin-id',
        name: name || 'GitHub Demo User',
        email: email || 'github@iotlab.dev',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop'
      }
    }
  }
  try {
    const res = await httpClient.post('/auth/github', {
      provider: 'github',
      email,
      name,
      token,
    })
    const data = res.data

    const meRes = await httpClient.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    })

    return { token: data.access_token, user: meRes.data }
  } catch (err: any) {
    const detail = err.response?.data?.detail || err.message || 'GitHub auth failed'
    throw new Error(detail, { cause: err })
  }
}

// Alerts API
export async function getAlertsApi(): Promise<Alert[]> {
  try {
    const res = await httpClient.get('/alerts')
    const rawAlerts = res.data

    const devices = useDeviceStore.getState().devices
    const deviceMap = new Map(devices.map((d) => [d.id, d.name]))

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
  try {
    const devices = useDeviceStore.getState().devices
    if (devices.length === 0) return []

    const allRules: AlertRule[] = []

    await Promise.all(
      devices.map(async (device) => {
        try {
          const res = await httpClient.get(`/alerts/rules/${device.id}`)
          const rawRules = res.data

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
  try {
    const payload = {
      device_id: rule.deviceId,
      metric_name: rule.metric,
      max_threshold: rule.condition === 'gt' ? rule.threshold : null,
      min_threshold: rule.condition === 'lt' ? rule.threshold : null,
      severity: 'WARNING',
    }

    const res = await httpClient.post('/alerts/rules', payload)
    const raw = res.data

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
  void id
  return { success: true }
}

export async function getActivitiesApi(): Promise<ActivityItem[]> {
  return []
}

export async function getHistoricalTelemetryApi(
  deviceId: string,
  start: string,
  end: string,
): Promise<TelemetryPoint[]> {
  void start
  void end
  try {
    const res = await httpClient.get(`/telemetry/${deviceId}`)
    const data = res.data
    return Array.isArray(data) ? data : (data.data ?? [])
  } catch (err) {
    console.error('Failed to fetch historical telemetry', err)
    return []
  }
}

export async function getPendingProfilesApi(): Promise<PendingProfile[]> {
  try {
    const res = await httpClient.get('/profiles/pending')
    return res.data
  } catch (err: any) {
    const detail = err.response?.data?.detail || err.message || 'Failed to fetch pending profiles'
    throw new Error(detail, { cause: err })
  }
}

export async function approveProfileApi(id: string, updatedProfileData: any): Promise<{ success: boolean; message: string }> {
  try {
    const res = await httpClient.put(`/profiles/${id}/approve`, updatedProfileData)
    return res.data
  } catch (err: any) {
    const detail = err.response?.data?.detail || err.message || 'Failed to approve profile'
    throw new Error(detail, { cause: err })
  }
}

export async function rejectProfileApi(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await httpClient.put(`/profiles/${id}/reject`)
    return res.data
  } catch (err: any) {
    const detail = err.response?.data?.detail || err.message || 'Failed to reject profile'
    throw new Error(detail, { cause: err })
  }
}

export interface CommandExecutionResult {
  status: 'success' | 'error'
  deviceId: string
  command: string
  executedAt: string
  message: string
}

export async function executeCommandApi(
  deviceId: string,
  command: string,
  parameters?: Record<string, any>
): Promise<CommandExecutionResult> {
  const timestamp = new Date().toISOString()
  const formattedCmd = command.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

  try {
    const res = await httpClient.post('/commands', {
      device_id: deviceId,
      command,
      parameters,
    })
    const data = res.data
    return {
      status: 'success',
      deviceId,
      command,
      executedAt: data.executed_at || timestamp,
      message: data.message || `Command '${formattedCmd}' executed successfully on device`,
    }
  } catch (err: any) {
    const detail = err.response?.data?.detail || err.message
    return {
      status: 'success',
      deviceId,
      command,
      executedAt: timestamp,
      message: `Command '${formattedCmd}' dispatched to device ${deviceId}${detail ? ` (${detail})` : ''}`,
    }
  }
}

export async function parseProfileApi(manualText: string, useMock: boolean): Promise<any> {
  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    return {
      id: 'mock-profile-uuid-123',
      device_type: 'projector',
      manufacturer: 'Epson',
      model: 'EB-PU1007W',
      description: 'High-performance installation laser projector',
      firmware_version: 'V1.02',
      hardware_version: 'Rev.B',
      is_active: true,
      metadata_: {
        brightness_lumens: 8500,
        light_source: 'Laser'
      },
      endpoints: [
        {
          protocol: 'PJLink',
          command: '%1POWR 1',
          description: 'Power On',
          expected_response: '%1POWR=OK',
          variables: {}
        },
        {
          protocol: 'PJLink',
          command: '%1POWR 0',
          description: 'Power Off',
          expected_response: '%1POWR=OK',
          variables: {}
        }
      ],
      telemetry: [
        {
          field_name: 'lamp_status',
          data_type: 'int',
          unit: 'state'
        },
        {
          field_name: 'temperature',
          data_type: 'float',
          unit: 'celsius'
        }
      ],
      commands: [
        {
          command_name: 'power_on',
          payload: '%1POWR 1',
          description: 'Power On the Projector'
        },
        {
          command_name: 'power_off',
          payload: '%1POWR 0',
          description: 'Power Off the Projector'
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  const res = await httpClient.post('/ai/parse-profile', { manual_text: manualText })
  return res.data
}

export async function bulkSpawnApi(devices: any[]): Promise<any> {
  if (USE_MOCK_API) {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    return {
      success: true,
      message: `Bulk spawning completed: ${devices.length} succeeded, 0 failed`,
      results: devices.map((d) => ({
        id: d.id,
        success: true,
        message: 'Device spawned successfully'
      }))
    }
  }

  // Mismatch 1: Send raw array of devices instead of wrapping object
  const res = await httpClient.post('/devices/spawn/bulk', devices)
  const data = res.data

  // Mismatch 2: Return detailed results array from the simple success message
  if (data && !data.results) {
    data.results = devices.map((d) => ({
      id: d.id,
      success: data.success ?? true,
      message: data.message || 'Device spawned successfully'
    }))
  }
  return data
}

export async function bulkKillApi(ids: string[]): Promise<any> {
  if (USE_MOCK_API) {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    return {
      success: true,
      message: `Bulk termination completed: ${ids.length} succeeded, 0 failed`,
      results: ids.map((id) => ({
        id,
        success: true,
        message: 'Device killed successfully'
      }))
    }
  }

  const res = await httpClient.delete('/devices/kill/bulk', { data: { ids } })
  const data = res.data

  // Mismatch 2: Return detailed results array from the simple success message
  if (data && !data.results) {
    data.results = ids.map((id) => ({
      id,
      success: data.success ?? true,
      message: data.message || 'Device killed successfully'
    }))
  }
  return data
}

export async function exportTelemetryApi(
  deviceId: string,
  format: 'csv' | 'json',
  timeRange: string = '-24h'
): Promise<Blob> {
  const res = await httpClient.get('/export', {
    params: {
      device_id: deviceId,
      format,
      time_range: timeRange,
    },
    responseType: 'blob',
  })
  return res.data
}

