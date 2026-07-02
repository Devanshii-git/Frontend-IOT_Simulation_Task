import type { Alert, AlertRule, TelemetryPoint, ActivityItem } from '@/types'
import { API_BASE_URL } from '@/config/api'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Auth API
export async function loginApi(email: string, password: string) {
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
