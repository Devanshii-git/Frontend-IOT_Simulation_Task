import { create } from 'zustand'
import type { Alert, AlertRule } from '@/types'
import {
  getAlertsApi,
  acknowledgeAlertApi,
  getAlertRulesApi,
  createAlertRuleApi,
  updateAlertRuleApi,
  deleteAlertRuleApi,
} from '@/services/api'

interface AlertState {
  alerts: Alert[]
  rules: AlertRule[]
  loading: boolean
  fetchAlerts: () => Promise<void>
  fetchRules: () => Promise<void>
  acknowledgeAlert: (id: string) => Promise<void>
  addAlert: (alert: Alert) => void
  createRule: (rule: Omit<AlertRule, 'id'>) => Promise<void>
  toggleRule: (id: string, enabled: boolean) => Promise<void>
  deleteRule: (id: string) => Promise<void>
  getUnacknowledgedCount: () => number
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  rules: [],
  loading: false,
  fetchAlerts: async () => {
    set({ loading: true })
    try {
      const alerts = await getAlertsApi()
      set({ alerts })
    } finally {
      set({ loading: false })
    }
  },
  fetchRules: async () => {
    const rules = await getAlertRulesApi()
    set({ rules })
  },
  acknowledgeAlert: async (id) => {
    await acknowledgeAlertApi(id)
    set((s) => ({ alerts: s.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)) }))
  },
  addAlert: (alert) => set((s) => ({ alerts: [alert, ...s.alerts] })),
  createRule: async (rule) => {
    const created = await createAlertRuleApi(rule)
    set((s) => ({ rules: [...s.rules, created] }))
  },
  toggleRule: async (id, enabled) => {
    const updated = await updateAlertRuleApi(id, { enabled })
    set((s) => ({ rules: s.rules.map((r) => (r.id === id ? updated : r)) }))
  },
  deleteRule: async (id) => {
    await deleteAlertRuleApi(id)
    set((s) => ({ rules: s.rules.filter((r) => r.id !== id) }))
  },
  getUnacknowledgedCount: () => get().alerts.filter((a) => !a.acknowledged).length,
}))
