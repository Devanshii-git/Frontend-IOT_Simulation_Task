import { useEffect, useState } from 'react'
import { Bell, Plus } from 'lucide-react'
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alerts</h1>
          <p className="text-sm text-slate-500">{alerts.filter((a) => !a.acknowledged).length} active alerts</p>
        </div>
        <Button onClick={() => setShowRuleModal(true)}><Plus className="h-4 w-4" /> New Rule</Button>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading alerts...</p>
      ) : alerts.length === 0 ? (
        <Card className="flex flex-col items-center py-12">
          <Bell className="h-12 w-12 text-slate-300" />
          <p className="mt-4 font-medium">No active alerts</p>
          <p className="text-sm text-slate-500">All systems operating normally</p>
        </Card>
      ) : (
        grouped.map(({ severity, alerts: groupAlerts }) =>
          groupAlerts.length > 0 ? (
            <div key={severity}>
              <div className="mb-3 flex items-center gap-2">
                <StatusPill status={severity} />
                <span className="text-sm text-slate-500">({groupAlerts.length})</span>
              </div>
              <div className="space-y-3">
                {groupAlerts.map((alert) => (
                  <Card
                    key={alert.id}
                    className={cn(alert.acknowledged && 'opacity-50')}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{alert.deviceName}</h3>
                          <StatusPill status={alert.severity} />
                        </div>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{alert.condition}</p>
                        <p className="text-sm font-mono text-slate-500">Value: {alert.value}</p>
                        <p className="text-xs text-slate-400">{formatRelativeTime(alert.timestamp)}</p>
                      </div>
                      {!alert.acknowledged && (
                        <Button variant="outline" onClick={() => acknowledgeAlert(alert.id)}>Acknowledge</Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : null,
        )
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Alert Rules</h2>
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{rule.deviceName}</p>
                  <p className="text-sm text-slate-500">
                    If {rule.metric} {rule.condition} {rule.threshold} → notify via {rule.notifyVia.join(', ')}
                  </p>
                </div>
                <Switch checked={rule.enabled} onChange={(v) => toggleRule(rule.id, v)} label={rule.enabled ? 'Enabled' : 'Disabled'} />
              </div>
            </Card>
          ))}
        </div>
      </div>

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
          <div>
            <p className="mb-2 text-sm font-medium">Notify via</p>
            <div className="flex gap-2">
              {(['email', 'sms', 'push'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => toggleNotify(ch)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm capitalize min-h-[44px]',
                    ruleForm.notifyVia.includes(ch) ? 'border-primary-500 bg-primary-50' : 'border-border-light',
                  )}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full">Create Rule</Button>
        </form>
      </Modal>
    </div>
  )
}
