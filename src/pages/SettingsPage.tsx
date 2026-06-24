import { useState } from 'react'
import { Copy, RefreshCw, Moon, Sun, User } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'

function generateApiKey() {
  return `iot_${Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('')}`
}

export function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const dark = useThemeStore((s) => s.dark)
  const toggleTheme = useThemeStore((s) => s.toggle)
  const [profile, setProfile] = useState({ name: user?.name ?? '', email: user?.email ?? '' })
  const [mqttUrl, setMqttUrl] = useState('mqtt://broker.iotlab.dev:1883')
  const [webhookUrl, setWebhookUrl] = useState('https://api.iotlab.dev/webhooks/events')
  const [apiKey, setApiKey] = useState(generateApiKey())
  const [copied, setCopied] = useState(false)

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-slate-500">Manage your profile and integrations</p>
      </div>

      <Card>
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><User className="h-5 w-5" /> Profile</h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
            {profile.name.charAt(0) || 'U'}
          </div>
          <div className="flex-1 space-y-4">
            <Button variant="outline" size="sm">Upload Avatar</Button>
            <Input label="Display Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            <Input label="Email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            <Button>Save Changes</Button>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold">Appearance</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {dark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-slate-500">Toggle between light and dark themes</p>
            </div>
          </div>
          <Switch checked={dark} onChange={() => toggleTheme()} />
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold">Integrations</h2>
        <div className="space-y-4">
          <Input label="MQTT Broker URL" value={mqttUrl} onChange={(e) => setMqttUrl(e.target.value)} />
          <Input label="Webhook Endpoint" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} />
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">API Key</label>
            <div className="mt-1 flex gap-2">
              <input
                readOnly
                value={apiKey}
                className="h-11 flex-1 rounded-lg border border-border-light bg-slate-50 px-3 font-mono text-sm dark:border-border-dark dark:bg-slate-800"
              />
              <Button variant="outline" size="icon" onClick={copyKey} title="Copy"><Copy className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => setApiKey(generateApiKey())} title="Regenerate"><RefreshCw className="h-4 w-4" /></Button>
            </div>
            {copied && <p className="mt-1 text-xs text-emerald-600">Copied to clipboard</p>}
          </div>
          <Button>Save Integrations</Button>
        </div>
      </Card>
    </div>
  )
}
