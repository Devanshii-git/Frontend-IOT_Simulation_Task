import { useEffect, useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Cpu, Activity, Bell, Settings2, Trash2, Plus, RefreshCw, Radio
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { StatusPill } from '@/components/ui/StatusPill'
import { Switch } from '@/components/ui/Switch'
import { SignalStrength } from '@/components/ui/SignalStrength'
import { DeviceControlPanel } from '@/components/monitoring/DeviceControlPanel'
import { useDeviceStore } from '@/store/deviceStore'
import { useAlertStore } from '@/store/alertStore'
import { useSimulationStore } from '@/store/simulationStore'
import { useToastStore } from '@/store/toastStore'
import { telemetryWs } from '@/services/websocket'
import { deviceTypeConfig, protocolOptions } from '@/utils/deviceIcons'
import { formatRelativeTime } from '@/utils/format'
import type { DeviceProtocol, AlertCondition, TelemetryPoint } from '@/types'

const conditionOptions = [
  { value: 'gt', label: 'Greater than (>)' },
  { value: 'lt', label: 'Less than (<)' },
  { value: 'gte', label: 'Greater or equal (>=)' },
  { value: 'lte', label: 'Less or equal (<=)' },
  { value: 'eq', label: 'Equal to (=)' },
]

export function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { devices, loading: deviceLoading, fetchDevices, toggleDevice, updateDeviceDetails, deleteDevice } = useDeviceStore()
  const { alerts, rules, fetchAlerts, fetchRules, acknowledgeAlert, createRule, toggleRule, deleteRule } = useAlertStore()
  const { start: startSimulation, config: simConfig, telemetryBuffers } = useSimulationStore()

  const device = useMemo(() => devices.find((d) => d.id === id), [devices, id])
  const deviceRules = useMemo(() => rules.filter((r) => r.deviceId === id), [rules, id])
  const deviceAlerts = useMemo(() => alerts.filter((a) => a.deviceId === id), [alerts, id])

  const [form, setForm] = useState({ name: '', location: '', ipAddress: '', protocol: 'MQTT' as DeviceProtocol })
  const [updating, setUpdating] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [liveData, setLiveData] = useState<TelemetryPoint[]>([])

  // Rule creation state
  const [showAddRule, setShowAddRule] = useState(false)
  const [ruleForm, setRuleForm] = useState({
    metric: 'temperature',
    condition: 'gt' as AlertCondition,
    threshold: 80,
    notifyVia: ['email'] as ('email' | 'sms' | 'push')[],
  })

  useEffect(() => {
    fetchDevices()
    fetchAlerts()
    fetchRules()
    if (!simConfig.running) {
      startSimulation()
    }
  }, [fetchDevices, fetchAlerts, fetchRules, simConfig.running, startSimulation])

  // Sync form details when device loads
  useEffect(() => {
    if (device) {
      setForm({
        name: device.name,
        location: device.location,
        ipAddress: device.ipAddress,
        protocol: device.protocol,
      })
    }
  }, [device])

  // Setup WS telemetry feed for this device
  useEffect(() => {
    if (!id || !device || device.status === 'offline' || !device.isToggledOn) {
      setLiveData([])
      return
    }

    telemetryWs.connect()
    telemetryWs.send({ action: 'subscribe', deviceId: id })

    // Seed live data with existing buffer if available
    const initialBuf = telemetryBuffers[id] ?? []
    setLiveData(initialBuf)

    const unsub = telemetryWs.onMessage(id, (data) => {
      setLiveData((prev) => {
        const point = { timestamp: data.timestamp, value: data.value }
        // Keep last 40 points for smooth scrolling chart
        const next = [...prev, point]
        return next.slice(-40)
      })
    })

    return () => {
      telemetryWs.send({ action: 'unsubscribe', deviceId: id })
      unsub()
    }
  }, [id, device, telemetryBuffers])

  if (deviceLoading && !device) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500 font-medium select-none">
        Loading device configuration...
      </div>
    )
  }

  if (!device) {
    return (
      <div className="text-center py-16 select-none space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Device Not Found</h3>
        <p className="text-slate-500 dark:text-slate-400">The device you are looking for does not exist or has been deleted.</p>
        <Link to="/devices">
          <Button className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Devices
          </Button>
        </Link>
      </div>
    )
  }

  const deviceCfg = deviceTypeConfig[device.type] || deviceTypeConfig.temperature_sensor
  const Icon = deviceCfg.icon

  // Calculate live statistics
  const stats = (() => {
    if (liveData.length === 0) return { current: null, min: 0, max: 0 }
    const values = liveData.map((d) => d.value).filter((v) => !isNaN(v))
    return {
      current: values[values.length - 1] ?? null,
      min: values.length ? Math.min(...values) : 0,
      max: values.length ? Math.max(...values) : 0,
    }
  })()

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    try {
      await updateDeviceDetails(device.id, form)
      useToastStore.getState().showSuccess('Device details updated successfully!')
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(false)
    }
  }

  const handleToggle = async (id: string, checked: boolean) => {
    setToggling(true)
    try {
      await toggleDevice(id, checked)
      useToastStore.getState().showSuccess(`Device simulation ${checked ? 'started' : 'stopped'} successfully.`)
    } catch (e) {
      console.error(e)
    } finally {
      setToggling(false)
    }
  }

  const handleDeleteDevice = async () => {
    if (window.confirm(`Are you sure you want to delete ${device.name}?`)) {
      try {
        await deleteDevice(device.id)
        useToastStore.getState().showSuccess('Device deleted successfully!')
        navigate('/devices')
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleAddRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createRule({
        deviceId: device.id,
        deviceName: device.name,
        metric: ruleForm.metric,
        condition: ruleForm.condition,
        threshold: ruleForm.threshold,
        notifyVia: ruleForm.notifyVia,
        enabled: true,
      })
      useToastStore.getState().showSuccess('Alert rule created successfully!')
      setShowAddRule(false)
      setRuleForm({
        metric: 'temperature',
        condition: 'gt',
        threshold: 80,
        notifyVia: ['email'],
      })
    } catch (e) {
      console.error(e)
    }
  }

  const toggleNotifyChannel = (channel: 'email' | 'sms' | 'push') => {
    setRuleForm((f) => ({
      ...f,
      notifyVia: f.notifyVia.includes(channel)
        ? f.notifyVia.filter((c) => c !== channel)
        : [...f.notifyVia, channel],
    }))
  }

  // Format Recharts time data
  const chartData = liveData.map((d) => ({
    timestamp: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    value: d.value,
  }))

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300">
      {/* Breadcrumbs and Actions Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link to="/devices" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors uppercase tracking-wider">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Devices
          </Link>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${deviceCfg.color}`}>
              <Icon className="h-5.5 w-5.5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{device.name}</h1>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">ID: {device.id}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm h-10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Power State</span>
            <Switch
              checked={device.isToggledOn}
              onChange={(v) => handleToggle(device.id, v)}
              label={device.isToggledOn ? 'ACTIVE' : 'STANDBY'}
              loading={toggling}
            />
          </div>
          <Button
            variant="outline"
            className="h-10 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 text-red-500 border-red-205 dark:border-red-900/30 text-xs font-bold"
            onClick={handleDeleteDevice}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Telemetry Graph & Rules */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Real-time Telemetry Monitor */}
          <Card className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary-500 animate-pulse" /> Live Telemetry Chart
                </h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Real-time graph reflecting active wave simulation data.</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                <StatusPill status={device.status} />
                <SignalStrength strength={device.signalStrength} />
              </div>
            </div>

            {/* Readouts */}
            <div className="grid gap-3 grid-cols-3 mb-6 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-900">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {stats.current !== null ? `${stats.current.toFixed(1)}` : '--'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Minimum</span>
                <p className="text-2xl font-black text-slate-500">{stats.min.toFixed(1)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Maximum</span>
                <p className="text-2xl font-black text-slate-500">{stats.max.toFixed(1)}</p>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-64 w-full">
              {!device.isToggledOn ? (
                <div className="flex h-full flex-col items-center justify-center text-slate-400 gap-2">
                  <Radio className="h-8 w-8 text-slate-300" />
                  <p className="text-sm font-bold">Device in Standby Mode</p>
                  <p className="text-xs font-medium text-slate-500">Enable device power state above to stream telemetry.</p>
                </div>
              ) : device.status === 'offline' ? (
                <div className="flex h-full flex-col items-center justify-center text-slate-400 gap-2">
                  <Radio className="h-8 w-8 text-slate-350" />
                  <p className="text-sm font-bold">Device Offline</p>
                  <p className="text-xs font-medium text-slate-500">Device ping has failed. Ready state is disconnected.</p>
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-slate-400 gap-2">
                  <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                  <p className="text-sm font-bold">Connecting live stream...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="detailGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" vertical={false} />
                    <XAxis
                      dataKey="timestamp"
                      tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '10px',
                        fontFamily: 'monospace'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      name={deviceCfg.label}
                      stroke="#3b82f6"
                      fill="url(#detailGrad)"
                      strokeWidth={2}
                      activeDot={{ r: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Actionable Command Execution Panel */}
          <DeviceControlPanel device={device} />

          {/* Device Alert Rules */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary-500" /> Alert Logic Rules
              </h3>
              <Button onClick={() => setShowAddRule(!showAddRule)} variant="outline" className="h-8 text-xs font-bold">
                {showAddRule ? 'Cancel' : <><Plus className="h-3.5 w-3.5 mr-1" /> Add Rule</>}
              </Button>
            </div>

            {/* Create inline rule form */}
            {showAddRule && (
              <Card className="p-4 border-primary-500 bg-slate-50/50 dark:bg-slate-900/50">
                <form onSubmit={handleAddRuleSubmit} className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Configure New Rule</h4>
                  <div className="grid gap-4 sm:grid-cols-3">
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
                      label="Threshold"
                      type="number"
                      value={ruleForm.threshold}
                      onChange={(e) => setRuleForm({ ...ruleForm, threshold: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Notify Channels</span>
                    <div className="flex gap-2">
                      {(['email', 'sms', 'push'] as const).map((channel) => {
                        const active = ruleForm.notifyVia.includes(channel)
                        return (
                          <button
                            key={channel}
                            type="button"
                            onClick={() => toggleNotifyChannel(channel)}
                            className={`rounded-md border px-3.5 py-1.5 text-xs font-bold capitalize transition-all cursor-pointer min-h-[34px] flex-1 ${
                              active
                                ? 'border-primary-500 bg-primary-600 text-white'
                                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {channel}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="submit" size="sm" className="text-xs font-bold">
                      Create Rule
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Rules list */}
            {deviceRules.length === 0 ? (
              <Card className="flex flex-col items-center justify-center py-8 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 border-dashed">
                <p className="text-xs font-bold">No custom alerts rules assigned.</p>
                <p className="text-[11px] text-slate-500 mt-1">Simulated readings won't generate incidents without active rule logic.</p>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {deviceRules.map((rule) => (
                  <Card key={rule.id} className="p-4 flex items-center justify-between">
                    <div className="space-y-1 pr-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{rule.metric}</p>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white capitalize">
                        If {rule.condition} {rule.threshold}
                      </p>
                      <div className="flex gap-1.5 text-[10px] text-slate-400 font-bold uppercase mt-1">
                        {rule.notifyVia.map((c) => <span key={c} className="bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 rounded">{c}</span>)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={rule.enabled}
                        onChange={(v) => toggleRule(rule.id, v)}
                        label={rule.enabled ? 'ON' : 'OFF'}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Configuration Form & Incident History */}
        <div className="space-y-6">
          
          {/* Configuration Form */}
          <Card className="p-6">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base mb-4 flex items-center gap-2 border-b border-slate-105 dark:border-slate-850 pb-2">
              <Cpu className="h-4.5 w-4.5 text-slate-450" /> Hardware Profile
            </h3>
            <form onSubmit={handleUpdateDetails} className="space-y-4">
              <Input
                label="Device Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                label="Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
              />
              <Input
                label="IP Address / MAC"
                value={form.ipAddress}
                onChange={(e) => setForm({ ...form, ipAddress: e.target.value })}
              />
              <Select
                label="Communication Protocol"
                options={protocolOptions}
                value={form.protocol}
                onChange={(e) => setForm({ ...form, protocol: e.target.value as DeviceProtocol })}
              />

              <div className="pt-2">
                <Button type="submit" className="w-full h-10 text-xs font-bold" loading={updating}>
                  Save Configuration
                </Button>
              </div>
            </form>
          </Card>

          {/* Recent Incident Log */}
          <Card className="p-6">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base mb-4 flex items-center gap-2 border-b border-slate-105 dark:border-slate-850 pb-2">
              <Bell className="h-4.5 w-4.5 text-red-500 animate-pulse" /> Incidents Log
            </h3>
            {deviceAlerts.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <p className="text-xs font-bold">No incidents registered.</p>
                <p className="text-[10px] text-slate-500 mt-1">This device has not generated any warning or critical alarms.</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                {deviceAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border text-xs transition-all ${
                      alert.acknowledged
                        ? 'border-slate-205 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 opacity-60'
                        : 'border-red-205 dark:border-red-900/30 bg-red-50/20 dark:bg-red-950/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold uppercase tracking-wider text-slate-400">
                        {alert.severity}
                      </span>
                      <span className="text-[10px] text-slate-450 font-medium">
                        {formatRelativeTime(alert.timestamp)}
                      </span>
                    </div>
                    <p className="mt-1 font-extrabold text-slate-850 dark:text-slate-250">
                      {alert.condition}
                    </p>
                    <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                      Recorded value: <strong className="font-mono text-slate-800 dark:text-slate-200">{alert.value}</strong>
                    </p>
                    {!alert.acknowledged && (
                      <div className="mt-2.5 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] font-bold py-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
