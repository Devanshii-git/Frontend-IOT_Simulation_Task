import { useState } from 'react'
import { Copy, RefreshCw, Moon, Sun, User, Settings2, ShieldCheck, Globe } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { Slider } from '@/components/ui/Slider'
import { Select } from '@/components/ui/Select'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'

function generateApiKey() {
  return `iot_${Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('')}`
}

export function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const dark = useThemeStore((s) => s.dark)
  const toggleTheme = useThemeStore((s) => s.toggle)
  
  const [profile, setProfile] = useState({ name: user?.name ?? '', email: user?.email ?? '', role: 'Administrator' })
  const [mqttUrl, setMqttUrl] = useState('mqtt://broker.iotlab.dev:1883')
  const [webhookUrl, setWebhookUrl] = useState('https://api.iotlab.dev/webhooks/events')
  const [apiKey, setApiKey] = useState(() => generateApiKey())
  const [copied, setCopied] = useState(false)

  // Simulation network mocking state
  const [latencyEnabled, setLatencyEnabled] = useState(true)
  const [latencyValue, setLatencyValue] = useState([250])
  const [packetDropEnabled, setPacketDropEnabled] = useState(false)
  const [packetDropValue, setPacketDropValue] = useState([5])

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-8 select-none animate-in fade-in duration-300 max-w-4xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Settings</h1>
        <p className="text-sm text-text-muted font-medium">Manage your system profile, integrations, and mocking parameters.</p>
      </div>

      {/* User profile card */}
      <Card>
        <CardHeader className="p-0 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-accent" />
            <CardTitle className="text-base font-bold">Profile Settings</CardTitle>
          </div>
          <CardDescription className="text-xs font-medium text-text-muted mt-1">Configure your personal credentials and visibility options.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-accent/15 text-2xl font-bold text-accent border border-accent/10 shadow-inner">
              {profile.name.charAt(0).toUpperCase() || 'U'}
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs">Upload Avatar</Button>
          </div>
          <div className="flex-1 space-y-4">
            <Input label="Display Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            <Input label="Email Address" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            <Select
              label="System Role"
              options={[
                { value: 'Administrator', label: 'Administrator' },
                { value: 'Editor', label: 'Editor' },
                { value: 'Viewer', label: 'Viewer' },
              ]}
              value={profile.role}
              onChange={(e) => setProfile({ ...profile, role: e.target.value })}
            />
            <Button className="h-10 text-xs">Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      {/* Network simulation mocking */}
      <Card>
        <CardHeader className="p-0 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-accent" />
            <CardTitle className="text-base font-bold">Simulation Network Mocking</CardTitle>
          </div>
          <CardDescription className="text-xs font-medium text-text-muted mt-1">Mock precise network latency and drop rates on telemetry streams.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Network Latency Limits</p>
                <p className="text-xs text-text-muted font-medium">Add synthetic response latency on simulated messages.</p>
              </div>
              <Switch checked={latencyEnabled} onChange={(v) => setLatencyEnabled(v)} />
            </div>
            {latencyEnabled && (
              <div className="space-y-2.5 pt-2">
                <div className="flex justify-between text-xs font-bold text-text-muted">
                  <span>Latency Limit</span>
                  <span className="font-mono text-accent">{latencyValue[0]}ms</span>
                </div>
                <Slider
                  min={0}
                  max={2000}
                  step={50}
                  value={latencyValue}
                  onValueChange={setLatencyValue}
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-t border-border pt-5">
              <div>
                <p className="text-sm font-bold">Packet Drops Rate</p>
                <p className="text-xs text-text-muted font-medium">Simulate random packet drops on the socket connection.</p>
              </div>
              <Switch checked={packetDropEnabled} onChange={(v) => setPacketDropEnabled(v)} />
            </div>
            {packetDropEnabled && (
              <div className="space-y-2.5 pt-2">
                <div className="flex justify-between text-xs font-bold text-text-muted">
                  <span>Drop Rate</span>
                  <span className="font-mono text-accent">{packetDropValue[0]}%</span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={packetDropValue}
                  onValueChange={setPacketDropValue}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* DevOps integrations */}
      <Card>
        <CardHeader className="p-0 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-accent" />
            <CardTitle className="text-base font-bold">DevOps Integrations</CardTitle>
          </div>
          <CardDescription className="text-xs font-medium text-text-muted mt-1">Configure target endpoint credentials for telemetry webhooks.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-6 space-y-4">
          <Input label="MQTT Broker URL" value={mqttUrl} onChange={(e) => setMqttUrl(e.target.value)} />
          <Input label="Webhook Endpoint" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} />
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">API Access Key</label>
            <div className="mt-1.5 flex gap-2">
              <input
                readOnly
                value={apiKey}
                className="h-10 flex-1 rounded-md border border-border bg-bg-primary/50 px-3 font-mono text-xs text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-subtle/40"
              />
              <Button variant="outline" size="icon" className="h-10 w-10 border-border" onClick={copyKey} title="Copy Key">
                <Copy className="h-4 w-4 text-text-muted" />
              </Button>
              <Button variant="outline" size="icon" className="h-10 w-10 border-border" onClick={() => setApiKey(generateApiKey())} title="Regenerate Key">
                <RefreshCw className="h-4 w-4 text-text-muted" />
              </Button>
            </div>
            {copied && <p className="mt-1.5 text-xs font-semibold text-text-secondary">Copied to clipboard</p>}
          </div>
          <Button className="h-10 text-xs">Save Integrations</Button>
        </CardContent>
      </Card>

      {/* Appearance card */}
      <Card>
        <CardHeader className="p-0 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <CardTitle className="text-base font-bold">System Preferences</CardTitle>
          </div>
          <CardDescription className="text-xs font-medium text-text-muted mt-1">Configure layout appearance, dark themes, and default logs output.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-text-muted">
              {dark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-bold">Dark Canvas Theme</p>
              <p className="text-xs text-text-muted font-medium">Toggle between light and dark canvas colors.</p>
            </div>
          </div>
          <Switch checked={dark} onChange={() => toggleTheme()} />
        </CardContent>
      </Card>
    </div>
  )
}
