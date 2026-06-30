import type { Alert, AlertRule, TelemetryPoint, ActivityItem } from '@/types'
import { TELEMETRY_BASE_URL } from '@/config/api'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Auth API
export async function loginApi(email: string, password: string) {
  const params = new URLSearchParams()
  params.append('username', email)
  params.append('password', password)

  const res = await fetch(`${TELEMETRY_BASE_URL}/auth/login`, {
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
  
  // Now fetch user info from /auth/me using the token
  const meRes = await fetch(`${TELEMETRY_BASE_URL}/auth/me`, {
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
  // Handled temporarily in state; verified in verifyOtpApi
  void name
  void email
  void password
  await delay(500)
  return { success: true }
}

export async function verifyOtpApi(email: string, code: string, name?: string, password?: string) {
  await delay(600)
  if (code !== '123456') {
    throw new Error('Invalid verification code. Hint: use 123456')
  }

  // Create the user on the backend
  const res = await fetch(`${TELEMETRY_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: name || email.split('@')[0],
      email: email,
      password: password || 'dummy-password-otp',
      role: 'User',
    }),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || 'Registration failed')
  }

  const data = await res.json() // { access_token, token_type }

  // Now fetch user info from /auth/me
  const meRes = await fetch(`${TELEMETRY_BASE_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${data.access_token}`,
    },
  })
  
  if (!meRes.ok) {
    throw new Error('Failed to retrieve user profile details after registration')
  }

  const user = await meRes.json()
  return { token: data.access_token, user }
}

export async function googleAuthApi(name: string, email: string, token: string) {
  const res = await fetch(`${TELEMETRY_BASE_URL}/auth/google`, {
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

  const meRes = await fetch(`${TELEMETRY_BASE_URL}/auth/me`, {
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
  const res = await fetch(`${TELEMETRY_BASE_URL}/auth/github`, {
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

  const meRes = await fetch(`${TELEMETRY_BASE_URL}/auth/me`, {
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
  await delay(300)
  return []
}

export async function acknowledgeAlertApi(id: string): Promise<Alert> {
  await delay(200)
  throw new Error(`Alert not found: ${id}`)
}

export async function getAlertRulesApi(): Promise<AlertRule[]> {
  await delay(300)
  return []
}

export async function createAlertRuleApi(rule: Omit<AlertRule, 'id'>): Promise<AlertRule> {
  await delay(400)
  return { ...rule, id: `rule-${Date.now()}` }
}

export async function updateAlertRuleApi(id: string, payload: Partial<AlertRule>): Promise<AlertRule> {
  void id
  void payload
  await delay(300)
  throw new Error(`Rule not found: ${id}`)
}

export async function deleteAlertRuleApi(id: string) {
  void id
  await delay(300)
  return { success: true }
}

export async function getActivitiesApi(): Promise<ActivityItem[]> {
  await delay(200)
  return []
}

export async function getHistoricalTelemetryApi(
  deviceId: string,
  start: string,
  end: string,
): Promise<TelemetryPoint[]> {
  void deviceId
  void start
  void end
  await delay(500)
  return []
}
