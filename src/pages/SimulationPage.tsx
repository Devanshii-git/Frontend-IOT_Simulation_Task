import { useEffect } from 'react'
import { Play, Square, Zap, AlertTriangle, Wifi, TrendingUp } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { useSimulationStore } from '@/store/simulationStore'
import { generateWaveValue } from '@/utils/waveforms'
import type { SimulationPreset, WaveformType } from '@/types'
import { cn } from '@/utils/cn'

const waveformOptions = [
  { value: 'sine', label: 'Sine Wave' },
  { value: 'random', label: 'Random' },
  { value: 'spike', label: 'Spike' },
  { value: 'flatline', label: 'Flatline' },
]

const presets: { id: SimulationPreset; label: string; desc: string; icon: typeof Zap }[] = [
  { id: 'normal', label: 'Normal Operation', desc: 'Stable sine waves', icon: TrendingUp },
  { id: 'sensor-fault', label: 'Sensor Fault', desc: 'Flatlines & NaN errors', icon: AlertTriangle },
  { id: 'network-degradation', label: 'Network Degradation', desc: 'Delayed, dropped packets', icon: Wifi },
  { id: 'overload-spike', label: 'Overload Spike', desc: 'Out-of-bounds spikes', icon: Zap },
]

export function SimulationPage() {
  const { config, tick, log, setConfig, applyPreset, start, stop } = useSimulationStore()

  useEffect(() => {
    if (!config.running) start()
  }, [config.running, start])

  const previewData = Array.from({ length: 30 }, (_, i) => ({
    t: i,
    v: generateWaveValue(config.waveform, tick - 30 + i, config.min, config.max, config.preset),
  })).filter((d) => !isNaN(d.v))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Simulation</h1>
          <p className="text-sm text-slate-500">Control mock IoT telemetry generation</p>
        </div>
        <div className="flex gap-2">
          {config.running ? (
            <Button variant="danger" onClick={stop}><Square className="h-4 w-4" /> Stop</Button>
          ) : (
            <Button onClick={start}><Play className="h-4 w-4" /> Start</Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Control Board</h2>
          <div className="space-y-4">
            <Select
              label="Waveform Type"
              options={waveformOptions}
              value={config.waveform}
              onChange={(e) => setConfig({ waveform: e.target.value as WaveformType })}
            />
            <Input
              label="Update Frequency (ms)"
              type="number"
              min={100}
              step={100}
              value={config.frequencyMs}
              onChange={(e) => setConfig({ frequencyMs: Number(e.target.value) })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Min Value" type="number" value={config.min} onChange={(e) => setConfig({ min: Number(e.target.value) })} />
              <Input label="Max Value" type="number" value={config.max} onChange={(e) => setConfig({ max: Number(e.target.value) })} />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-2 font-semibold">Live Preview</h2>
          <p className="mb-4 text-xs text-slate-500">Sparkline · tick {tick}</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={previewData}>
                <Line type="monotone" dataKey="v" stroke="#3b82f6" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 font-semibold">Global Presets</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {presets.map(({ id, label, desc, icon: Icon }) => (
            <Card
              key={id}
              interactive
              onClick={() => applyPreset(id)}
              className={cn(config.preset === id && 'ring-2 ring-primary-500')}
            >
              <Icon className="h-6 w-6 text-primary-600" />
              <p className="mt-2 font-medium">{label}</p>
              <p className="text-xs text-slate-500">{desc}</p>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <h2 className="mb-3 font-semibold">Simulation Log</h2>
        <div className="max-h-64 overflow-y-auto rounded-lg bg-slate-900 p-4 font-mono text-xs text-emerald-400 scrollbar-thin">
          {log.length === 0 ? (
            <p className="text-slate-500">Waiting for telemetry...</p>
          ) : (
            log.map((entry, i) => <div key={i} className="py-0.5">{entry}</div>)
          )}
        </div>
      </Card>
    </div>
  )
}
