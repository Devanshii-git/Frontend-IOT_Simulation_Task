import { useState } from 'react'
import {
  Terminal, Power, RotateCcw, Volume2, VolumeX, Sun, Mic, Sliders,
  CheckCircle2, AlertCircle, Play, Pause, Compass, ZoomIn, ZoomOut, Moon
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { executeCommandApi, type CommandExecutionResult } from '@/services/api'
import type { Device, DeviceType } from '@/types'

interface DeviceControlPanelProps {
  device: Device
  supportedCommands?: string[]
}

interface CommandConfig {
  id: string
  label: string
  icon: any
  variant?: 'primary' | 'outline' | 'danger' | 'ghost'
  hasParam?: boolean
  paramKey?: string
  paramType?: 'number' | 'select'
  paramMin?: number
  paramMax?: number
  paramStep?: number
  paramDefault?: number | string
  paramUnit?: string
  selectOptions?: { value: string; label: string }[]
}

const COMMAND_MAP: Record<DeviceType, CommandConfig[]> = {
  temperature_sensor: [
    {
      id: 'set_temperature',
      label: 'Set Temperature',
      icon: Sliders,
      variant: 'primary',
      hasParam: true,
      paramKey: 'temperature',
      paramType: 'number',
      paramMin: 15,
      paramMax: 35,
      paramStep: 0.5,
      paramDefault: 22,
      paramUnit: '°C',
    },
    { id: 'calibrate_sensor', label: 'Calibrate Sensor', icon: RotateCcw, variant: 'outline' },
    { id: 'toggle_power', label: 'Toggle Power', icon: Power, variant: 'outline' },
    { id: 'reboot', label: 'Reboot Device', icon: RotateCcw, variant: 'danger' },
  ],
  camera: [
    { id: 'pan_left', label: 'Pan Left', icon: Compass, variant: 'outline' },
    { id: 'pan_right', label: 'Pan Right', icon: Compass, variant: 'outline' },
    { id: 'tilt_up', label: 'Tilt Up', icon: Compass, variant: 'outline' },
    { id: 'tilt_down', label: 'Tilt Down', icon: Compass, variant: 'outline' },
    { id: 'zoom_in', label: 'Zoom In', icon: ZoomIn, variant: 'primary' },
    { id: 'zoom_out', label: 'Zoom Out', icon: ZoomOut, variant: 'primary' },
    { id: 'trigger_night_mode', label: 'Toggle Night Mode', icon: Moon, variant: 'outline' },
    { id: 'reboot', label: 'Reboot Camera', icon: RotateCcw, variant: 'danger' },
  ],
  microphone: [
    {
      id: 'set_gain',
      label: 'Set Gain',
      icon: Sliders,
      variant: 'primary',
      hasParam: true,
      paramKey: 'gain_db',
      paramType: 'number',
      paramMin: 0,
      paramMax: 60,
      paramStep: 1,
      paramDefault: 24,
      paramUnit: 'dB',
    },
    { id: 'toggle_mute', label: 'Toggle Mute', icon: Mic, variant: 'outline' },
    { id: 'enable_noise_cancellation', label: 'Noise Cancellation', icon: Sliders, variant: 'outline' },
    { id: 'reboot', label: 'Reboot Mic', icon: RotateCcw, variant: 'danger' },
  ],
  speaker: [
    {
      id: 'set_volume',
      label: 'Set Volume',
      icon: Volume2,
      variant: 'primary',
      hasParam: true,
      paramKey: 'volume_percent',
      paramType: 'number',
      paramMin: 0,
      paramMax: 100,
      paramStep: 5,
      paramDefault: 50,
      paramUnit: '%',
    },
    { id: 'toggle_mute', label: 'Mute / Unmute', icon: VolumeX, variant: 'outline' },
    { id: 'play_test_tone', label: 'Play Test Tone', icon: Play, variant: 'outline' },
    { id: 'reboot', label: 'Reboot Speaker', icon: RotateCcw, variant: 'danger' },
  ],
  projector: [
    { id: 'power_on', label: 'Power On', icon: Power, variant: 'primary' },
    { id: 'power_off', label: 'Power Off', icon: Power, variant: 'danger' },
    {
      id: 'select_input',
      label: 'Switch Input',
      icon: Sliders,
      variant: 'outline',
      hasParam: true,
      paramKey: 'input_source',
      paramType: 'select',
      paramDefault: 'HDMI_1',
      selectOptions: [
        { value: 'HDMI_1', label: 'HDMI 1' },
        { value: 'HDMI_2', label: 'HDMI 2' },
        { value: 'DisplayPort', label: 'DisplayPort' },
        { value: 'Wireless', label: 'Wireless AirPlay' },
      ],
    },
    {
      id: 'set_brightness',
      label: 'Set Brightness',
      icon: Sun,
      variant: 'outline',
      hasParam: true,
      paramKey: 'brightness',
      paramType: 'number',
      paramMin: 10,
      paramMax: 100,
      paramStep: 5,
      paramDefault: 80,
      paramUnit: '%',
    },
    { id: 'freeze_frame', label: 'Freeze Frame', icon: Pause, variant: 'outline' },
    { id: 'reboot', label: 'Reboot Projector', icon: RotateCcw, variant: 'danger' },
  ],
}

export function DeviceControlPanel({ device, supportedCommands }: DeviceControlPanelProps) {
  const baseCommands = COMMAND_MAP[device.type] ?? COMMAND_MAP['temperature_sensor']
  const commands = supportedCommands && supportedCommands.length > 0
    ? baseCommands.filter((c) => supportedCommands.includes(c.id))
    : baseCommands

  // Track parameter inputs per command
  const [paramValues, setParamValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {}
    commands.forEach((c) => {
      if (c.hasParam && c.paramKey && c.paramDefault !== undefined) {
        initial[c.id] = c.paramDefault
      }
    })
    return initial
  })

  const [loadingCmd, setLoadingCmd] = useState<string | null>(null)
  const [history, setHistory] = useState<CommandExecutionResult[]>([])

  const handleExecute = async (cmdConfig: CommandConfig) => {
    setLoadingCmd(cmdConfig.id)
    try {
      const params: Record<string, any> = {}
      if (cmdConfig.hasParam && cmdConfig.paramKey) {
        params[cmdConfig.paramKey] = paramValues[cmdConfig.id] ?? cmdConfig.paramDefault
      }

      const result = await executeCommandApi(device.id, cmdConfig.id, params)

      setHistory((prev) => [result, ...prev.slice(0, 4)])
    } catch (err) {
      console.error(`Failed to execute command ${cmdConfig.id}`, err)
    } finally {
      setLoadingCmd(null)
    }
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-bold text-text-primary">Dynamic Control Panel</h2>
        </div>
        <span className="text-xs font-semibold text-text-muted bg-bg-elevated px-2.5 py-1 rounded-full border border-border/40">
          Bi-Directional Command API
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {commands.map((cmd) => {
          const Icon = cmd.icon
          const isLoading = loadingCmd === cmd.id

          return (
            <div
              key={cmd.id}
              className="flex flex-col gap-2 rounded-xl bg-bg-elevated/50 p-4 border border-border/40 hover:border-border/80 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-text-muted" />
                  <span className="text-sm font-semibold text-text-primary">{cmd.label}</span>
                </div>
                {cmd.hasParam && cmd.paramUnit && (
                  <span className="text-xs font-mono text-accent font-bold">
                    {paramValues[cmd.id] ?? cmd.paramDefault}{cmd.paramUnit}
                  </span>
                )}
              </div>

              {cmd.hasParam && (
                <div className="mt-1">
                  {cmd.paramType === 'number' && (
                    <input
                      type="range"
                      min={cmd.paramMin}
                      max={cmd.paramMax}
                      step={cmd.paramStep}
                      value={paramValues[cmd.id] ?? cmd.paramDefault}
                      onChange={(e) =>
                        setParamValues((p) => ({ ...p, [cmd.id]: parseFloat(e.target.value) }))
                      }
                      className="w-full accent-accent cursor-pointer"
                    />
                  )}
                  {cmd.paramType === 'select' && (
                    <select
                      value={paramValues[cmd.id] ?? cmd.paramDefault}
                      onChange={(e) =>
                        setParamValues((p) => ({ ...p, [cmd.id]: e.target.value }))
                      }
                      className="w-full rounded-lg bg-bg-surface text-xs font-medium px-3 py-1.5 border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      {cmd.selectOptions?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <Button
                size="sm"
                variant={cmd.variant ?? 'primary'}
                disabled={isLoading || device.status === 'offline'}
                onClick={() => handleExecute(cmd)}
                className="mt-2 w-full justify-center text-xs font-semibold"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Dispatching…
                  </span>
                ) : (
                  `Execute ${cmd.label}`
                )}
              </Button>
            </div>
          )
        })}
      </div>

      {history.length > 0 && (
        <div className="pt-4 border-t border-border/40 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Command Execution Audit Log
          </p>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1 text-xs">
            {history.map((h, i) => (
              <div
                key={`${h.command}-${i}`}
                className="flex items-start gap-2 rounded-lg bg-bg-surface p-2.5 border border-border/30"
              >
                {h.status === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-primary truncate">{h.message}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    {new Date(h.executedAt).toLocaleTimeString()} — Device: {h.deviceId}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
