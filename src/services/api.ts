import type { Device, Alert, AlertRule, User, TelemetryPoint, ActivityItem } from '@/types'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

const MOCK_USER: User = {
  id: 'user-01',
  name: 'Alex Rivera',
  email: 'alex@iotlab.dev',
}

let devices: Device[] = [
  { id: 'dev-01', name: 'Warehouse Temp', type: 'temperature', status: 'online', location: 'Zone A', ipAddress: '192.168.1.50', protocol: 'MQTT', isToggledOn: true, signalStrength: 92, lastPing: new Date().toISOString() },
  { id: 'dev-02', name: 'Office Humidity', type: 'humidity', status: 'online', location: 'Zone B', ipAddress: '192.168.1.51', protocol: 'HTTP', isToggledOn: true, signalStrength: 78, lastPing: new Date().toISOString() },
  { id: 'dev-03', name: 'Lobby Motion', type: 'motion', status: 'warning', location: 'Zone A', ipAddress: '192.168.1.52', protocol: 'WebSocket', isToggledOn: true, signalStrength: 45, lastPing: new Date(Date.now() - 120000).toISOString() },
  { id: 'dev-04', name: 'Server Room Plug', type: 'smart-plug', status: 'online', location: 'Zone C', ipAddress: '192.168.1.53', protocol: 'MQTT', isToggledOn: false, signalStrength: 88, lastPing: new Date().toISOString() },
  { id: 'dev-05', name: 'Parking CCTV', type: 'cctv', status: 'online', location: 'Outdoor', ipAddress: '192.168.1.54', protocol: 'HTTP', isToggledOn: true, signalStrength: 65, lastPing: new Date().toISOString() },
  { id: 'dev-06', name: 'Custom Sensor', type: 'custom', status: 'offline', location: 'Zone D', ipAddress: '192.168.1.55', protocol: 'MQTT', isToggledOn: false, signalStrength: 0, lastPing: new Date(Date.now() - 3600000).toISOString() },
  { id: 'dev-07', name: 'Cold Storage Temp', type: 'temperature', status: 'online', location: 'Zone C', ipAddress: '192.168.1.56', protocol: 'MQTT', isToggledOn: true, signalStrength: 95, lastPing: new Date().toISOString() },
  { id: 'dev-08', name: 'Greenhouse Humidity', type: 'humidity', status: 'online', location: 'Outdoor', ipAddress: '192.168.1.57', protocol: 'WebSocket', isToggledOn: true, signalStrength: 72, lastPing: new Date().toISOString() },
]

let alerts: Alert[] = [
  { id: 'alt-101', deviceId: 'dev-03', deviceName: 'Lobby Motion', severity: 'warning', condition: 'Signal < 50%', value: '45%', timestamp: new Date(Date.now() - 300000).toISOString(), acknowledged: false },
  { id: 'alt-102', deviceId: 'dev-06', deviceName: 'Custom Sensor', severity: 'critical', condition: 'Device offline > 30min', value: 'Offline', timestamp: new Date(Date.now() - 1800000).toISOString(), acknowledged: false },
  { id: 'alt-103', deviceId: 'dev-01', deviceName: 'Warehouse Temp', severity: 'info', condition: 'Scheduled maintenance', value: 'N/A', timestamp: new Date(Date.now() - 600000).toISOString(), acknowledged: false },
]

let rules: AlertRule[] = [
  { id: 'rule-01', deviceId: 'dev-01', deviceName: 'Warehouse Temp', metric: 'temperature', condition: 'gt', threshold: 80, notifyVia: ['email', 'push'], enabled: true },
  { id: 'rule-02', deviceId: 'dev-02', deviceName: 'Office Humidity', metric: 'humidity', condition: 'gt', threshold: 90, notifyVia: ['sms'], enabled: true },
  { id: 'rule-03', deviceId: 'dev-07', deviceName: 'Cold Storage Temp', metric: 'temperature', condition: 'lt', threshold: 2, notifyVia: ['email'], enabled: false },
]

let activities: ActivityItem[] = [
  { id: 'act-01', message: 'Warehouse Temp reported 24.5°C', timestamp: new Date(Date.now() - 300000).toISOString(), type: 'info' },
  { id: 'act-02', message: 'Lobby Motion signal degraded to 45%', timestamp: new Date(Date.now() - 600000).toISOString(), type: 'warning' },
  { id: 'act-03', message: 'Custom Sensor went offline', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'error' },
  { id: 'act-04', message: 'Server Room Plug toggled OFF', timestamp: new Date(Date.now() - 900000).toISOString(), type: 'info' },
  { id: 'act-05', message: 'New device "Greenhouse Humidity" added', timestamp: new Date(Date.now() - 7200000).toISOString(), type: 'success' },
]

const registeredEmails = new Set(['alex@iotlab.dev', 'demo@iotlab.dev'])
const otpCodes = new Map<string, string>()

export const mockDb = {
  getDevices: () => devices,
  setDevices: (d: Device[]) => { devices = d },
  getAlerts: () => alerts,
  setAlerts: (a: Alert[]) => { alerts = a },
  getRules: () => rules,
  setRules: (r: AlertRule[]) => { rules = r },
  getActivities: () => activities,
  addActivity: (a: ActivityItem) => { activities = [a, ...activities].slice(0, 50) },
  getRegisteredEmails: () => registeredEmails,
  getOtpCodes: () => otpCodes,
}

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

// Device API
export async function getDevicesApi(): Promise<Device[]> {
  await delay(400)
  return [...devices]
}

export async function createDeviceApi(payload: Omit<Device, 'id' | 'status' | 'isToggledOn' | 'signalStrength' | 'lastPing'>): Promise<Device> {
  await delay(500)
  const device: Device = {
    ...payload,
    id: `dev-${Date.now()}`,
    status: 'online',
    isToggledOn: true,
    signalStrength: 75 + Math.floor(Math.random() * 20),
    lastPing: new Date().toISOString(),
  }
  devices = [...devices, device]
  activities = [{ id: `act-${Date.now()}`, message: `New device "${device.name}" added`, timestamp: new Date().toISOString(), type: 'success' }, ...activities]
  return device
}

export async function updateDeviceApi(id: string, payload: Partial<Device>): Promise<Device> {
  await delay(300)
  const idx = devices.findIndex((d) => d.id === id)
  if (idx === -1) throw new Error('Device not found')
  devices[idx] = { ...devices[idx], ...payload, lastPing: new Date().toISOString() }
  return devices[idx]
}

export async function deleteDeviceApi(id: string) {
  await delay(300)
  devices = devices.filter((d) => d.id !== id)
  return { success: true }
}

// Telemetry API
export async function getHistoricalTelemetryApi(_deviceId: string, start: string, end: string): Promise<TelemetryPoint[]> {
  await delay(500)
  const startTime = new Date(start).getTime()
  const endTime = new Date(end).getTime()
  const points: TelemetryPoint[] = []
  const step = 60000
  for (let t = startTime; t <= endTime; t += step) {
    points.push({
      timestamp: new Date(t).toISOString(),
      value: 20 + Math.sin(t / 100000) * 10 + Math.random() * 3,
    })
  }
  return points
}

// Alerts API
export async function getAlertsApi(): Promise<Alert[]> {
  await delay(300)
  return [...alerts]
}

export async function acknowledgeAlertApi(id: string): Promise<Alert> {
  await delay(200)
  const idx = alerts.findIndex((a) => a.id === id)
  if (idx === -1) throw new Error('Alert not found')
  alerts[idx] = { ...alerts[idx], acknowledged: true }
  return alerts[idx]
}

export async function getAlertRulesApi(): Promise<AlertRule[]> {
  await delay(300)
  return [...rules]
}

export async function createAlertRuleApi(rule: Omit<AlertRule, 'id'>): Promise<AlertRule> {
  await delay(400)
  const newRule: AlertRule = { ...rule, id: `rule-${Date.now()}` }
  rules = [...rules, newRule]
  return newRule
}

export async function updateAlertRuleApi(id: string, payload: Partial<AlertRule>): Promise<AlertRule> {
  await delay(300)
  const idx = rules.findIndex((r) => r.id === id)
  if (idx === -1) throw new Error('Rule not found')
  rules[idx] = { ...rules[idx], ...payload }
  return rules[idx]
}

export async function deleteAlertRuleApi(id: string) {
  await delay(300)
  rules = rules.filter((r) => r.id !== id)
  return { success: true }
}

export async function getActivitiesApi(): Promise<ActivityItem[]> {
  await delay(200)
  return [...activities]
}
