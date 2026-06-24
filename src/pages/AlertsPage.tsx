import { useEffect, useState, useMemo } from 'react'
import { Plus, Settings2, ShieldAlert, CheckCircle, BarChart3 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/ui/StatusPill'
import { Switch } from '@/components/ui/Switch'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useAlertStore } from '@/store/alertStore'
import { useDeviceStore } from '@/store/deviceStore'
import { formatRelativeTime } from '@/utils/format'
import type { AlertSeverity, AlertCondition } from '@/types'
import { cn } from '@/utils/cn'

const severityOrder: AlertSeverity[] = ['critical', 'warning', 'info']

const conditionOptions = [
  { value: 'gt', label: 'Greater than' },
  { value: 'lt', label: 'Less than' },
  { value: 'gte', label: 'Greater or equal' },
  { value: 'lte', label: 'Less or equal' },
  { value: 'eq', label: 'Equal to' },
]

// Mock alert trend data matching the design specs
const alertTrendData = [
  { day: 'Mon', count: 4 },
  { day: 'Tue', count: 7 },
  { day: 'Wed', count: 5 },
  { day: 'Thu', count: 12 },
  { day: 'Fri', count: 8 },
  { day: 'Sat', count: 3 },
  { day: 'Sun', count: 6 },
]

export function AlertsPage() {
  const { alerts, rules, loading, fetchAlerts, fetchRules, acknowledgeAlert, createRule, toggleRule } = useAlertStore()
  const { devices, fetchDevices } = useDeviceStore()
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [ruleForm, setRuleForm] = useState({
    deviceId: '', metric: 'temperature', condition: 'gt' as AlertCondition, threshold: 80,
    notifyVia: ['email'] as ('email' | 'sms' | 'push')[],
  })

  useEffect(() => {
    fetchAlerts()
    fetchRules()
    fetchDevices()
  }, [fetchAlerts, fetchRules, fetchDevices])

  const activeAlerts = useMemo(() => alerts.filter((a) => !a.acknowledged), [alerts])

  const grouped = severityOrder.map((sev) => ({
    severity: sev,
    alerts: alerts.filter((a) => a.severity === sev),
  }))

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault()
    const device = devices.find((d) => d.id === ruleForm.deviceId)
    if (!device) return
    await createRule({
      deviceId: ruleForm.deviceId,
      deviceName: device.name,
      metric: ruleForm.metric,
      condition: ruleForm.condition,
      threshold: ruleForm.threshold,
      notifyVia: ruleForm.notifyVia,
      enabled: true,
    })
    setShowRuleModal(false)
  }

  const toggleNotify = (channel: 'email' | 'sms' | 'push') => {
    setRuleForm((f) => ({
      ...f,
      notifyVia: f.notifyVia.includes(channel)
        ? f.notifyVia.filter((c) => c !== channel)
        : [...f.notifyVia, channel],
    }))
  }

  return (
    <div className="space-y-8 select-none animate-in fade-in duration-300">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Alerts</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Review live network events and customize threshold rules.
          </p>
        </div>
        <Button onClick={() => setShowRuleModal(true)} className="h-10 text-xs">
          <Plus className="h-4 w-4" /> New Rule
        </Button>
      </div>

      {/* Main grids: left alerts, right analytics & rules */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Alerts feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-bold tracking-tight">Incident Stream</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {activeAlerts.length} Active
            </span>
          </div>

          {loading ? (
            <p className="text-sm font-medium text-slate-500">Loading alerts feed...</p>
          ) : alerts.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
                <CheckCircle className="h-6 w-6" />
              </div>
              <p className="mt-4 font-bold text-slate-800 dark:text-white">All systems operational</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">No unresolved alerts registered.</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {grouped.map(({ severity, alerts: groupAlerts }) =>
                groupAlerts.length > 0 ? (
                  <div key={severity} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <StatusPill status={severity} />
                      <span className="text-xs font-semibold text-slate-450 uppercase">({groupAlerts.length} total)</span>
                    </div>
                    <div className="space-y-3">
                      {groupAlerts.map((alert) => (
                        <Card
                          key={alert.id}
                          className={cn(
                            'border-l-4 transition-all',
                            alert.acknowledged ? 'opacity-55 border-l-slate-300' : 'border-l-red-500',
                          )}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 dark:text-slate-50">{alert.deviceName}</h3>
                                <StatusPill status={alert.severity} />
                              </div>
                              <p className="text-sm font-medium text-slate-650 dark:text-slate-350">{alert.condition}</p>
                              <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
                                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Value: {alert.value}</span>
                                <span>&bull;</span>
                                <span>{formatRelativeTime(alert.timestamp)}</span>
                              </div>
                            </div>
                            {!alert.acknowledged && (
                              <Button
                                variant="outline"
                                className="h-9 text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                                onClick={() => acknowledgeAlert(alert.id)}
                              >
                                Acknowledge
                              </Button>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>

        {/* Right column: Analytics chart and rules list */}
        <div className="space-y-6">
          {/* Trend analytics chart */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary-500" />
              <h2 className="text-lg font-bold tracking-tight">Alert Frequencies</h2>
            </div>
            <Card className="p-4">
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={alertTrendData}>
                    <defs>
                      <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-850" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '10px'
                      }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#ef4444" fill="url(#alertGrad)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Rules lists */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary-500" />
              <h2 className="text-lg font-bold tracking-tight">Alert Rules</h2>
            </div>
            <div className="space-y-3">
              {rules.map((rule) => (
                <Card key={rule.id} className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{rule.deviceName}</p>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        If <span className="font-mono bg-slate-50 dark:bg-slate-950 px-1 rounded">{rule.metric}</span> {rule.condition} {rule.threshold}
                      </p>
                    </div>
                    <Switch
                      checked={rule.enabled}
                      onChange={(v) => toggleRule(rule.id, v)}
                      label={rule.enabled ? 'ON' : 'OFF'}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New rule Modal dialog */}
      <Modal open={showRuleModal} onClose={() => setShowRuleModal(false)} title="Create Alert Rule">
        <form onSubmit={handleCreateRule} className="space-y-4">
          <Select
            label="Device"
            options={devices.map((d) => ({ value: d.id, label: d.name }))}
            value={ruleForm.deviceId}
            onChange={(e) => setRuleForm({ ...ruleForm, deviceId: e.target.value })}
          />
          <Select
            label="Metric"
            options={[
              { value: 'temperature', label: 'Temperature' },
              { value: 'humidity', label: 'Humidity' },
              { value: 'motion', label: 'Motion' },
            ]}
            value={ruleForm.metric}
            onChange={(e) => setRuleForm({ ...ruleForm, metric: e.target.value })}
          />
          <Select
            label="Condition"
            options={conditionOptions}
            value={ruleForm.condition}
            onChange={(e) => setRuleForm({ ...ruleForm, condition: e.target.value as AlertCondition })}
          />
          <Input
            label="Threshold Value"
            type="number"
            value={ruleForm.threshold}
            onChange={(e) => setRuleForm({ ...ruleForm, threshold: Number(e.target.value) })}
          />
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Notify via</p>
            <div className="flex gap-2">
              {(['email', 'sms', 'push'] as const).map((ch) => {
                const active = ruleForm.notifyVia.includes(ch)
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => toggleNotify(ch)}
                    className={cn(
                      'rounded-md border px-3.5 py-2 text-xs font-bold capitalize transition-all cursor-pointer min-h-[38px] flex-1',
                      active
                        ? 'border-primary-500 bg-primary-600 text-white'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-200'
                    )}
                  >
                    {ch}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex gap-3 pt-3">
            <Button variant="outline" type="button" className="flex-1 h-10 text-xs" onClick={() => setShowRuleModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-10 text-xs">
              Create Rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
