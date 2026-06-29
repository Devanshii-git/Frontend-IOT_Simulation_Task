import type { Alert, AlertRule, User, TelemetryPoint, ActivityItem } from '@/types'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

const MOCK_USER: User = {
  id: 'user-01',
  name: 'Alex Rivera',
  email: 'alex@iotlab.dev',
}

const registeredEmails = new Set(['alex@iotlab.dev', 'demo@iotlab.dev'])
const otpCodes = new Map<string, string>()

// Auth API
export async function loginApi(email: string, password: string) {
  await delay(800)
  if (!email || !password) throw new Error('Email and password are required')
  if (password.length < 6) throw new Error('Invalid credentials')
  if (!registeredEmails.has(email) && email !== 'demo@iotlab.dev') {
    throw new Error('No account found with this email')
  }
  return { token: `mock-jwt-${Date.now()}`, user: { ...MOCK_USER, email } }
}

export async function registerApi(_name: string, email: string, _password: string) {
  await delay(1000)
  if (registeredEmails.has(email)) throw new Error('Email already registered')
  registeredEmails.add(email)
  otpCodes.set(email, '123456')
  return { success: true }
}

export async function verifyOtpApi(email: string, code: string) {
  await delay(600)
  const expected = otpCodes.get(email) ?? '123456'
  if (code !== expected) throw new Error('Invalid verification code')
  return { token: `mock-jwt-${Date.now()}`, user: { ...MOCK_USER, email, name: email.split('@')[0] } }
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

export async function updateAlertRuleApi(_id: string, _payload: Partial<AlertRule>): Promise<AlertRule> {
  await delay(300)
  throw new Error(`Rule not found: ${_id}`)
}

export async function deleteAlertRuleApi(id: string) {
  await delay(300)
  rules = rules.filter((r) => r.id !== id)
  return { success: true }
}

export async function getActivitiesApi(): Promise<ActivityItem[]> {
  await delay(200)
  return []
}

export async function getHistoricalTelemetryApi(
  _deviceId: string,
  _start: string,
  _end: string,
): Promise<TelemetryPoint[]> {
  await delay(500)
  return []
}
