import { useEffect } from 'react'
import { Play, Square, Zap, AlertTriangle, Wifi, TrendingUp, Cpu } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
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
    <div className="space-y-6 select-none animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Simulation</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Configure global mock telemetry generators and preset scenarios.</p>
        </div>
        <div className="flex gap-2">
          {config.running ? (
            <Button variant="danger" className="h-10 text-xs font-bold" onClick={stop}>
              <Square className="h-4 w-4" /> Stop Simulation
            </Button>
          ) : (
            <Button className="h-10 text-xs font-bold animate-pulse" onClick={start}>
              <Play className="h-4 w-4" /> Start Simulation
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Simulation configuration parameters */}
        <Card>
          <CardHeader className="p-0 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary-500" />
              <CardTitle className="text-base font-bold">Control Board</CardTitle>
            </div>
            <CardDescription className="text-xs font-medium text-slate-450 mt-1">Adjust waveform mathematical models and intervals.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 mt-6 space-y-4">
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
            <div className="grid grid-cols-2 gap-4">
              <Input label="Min Value Limit" type="number" value={config.min} onChange={(e) => setConfig({ min: Number(e.target.value) })} />
              <Input label="Max Value Limit" type="number" value={config.max} onChange={(e) => setConfig({ max: Number(e.target.value) })} />
            </div>
          </CardContent>
        </Card>

        {/* Live Sparkline Preview */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="p-0 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Live Preview Sparkline</span>
              <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-semibold">Tick: {tick}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex items-center justify-center pt-4 min-h-[160px]">
            {previewData.length === 0 ? (
              <p className="text-sm text-slate-450 font-medium">Waiting for simulation data...</p>
            ) : (
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={previewData}>
                    <defs>
                      <linearGradient id="previewGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke="#3b82f6" fill="url(#previewGrad)" strokeWidth={2} activeDot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Global presets */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight">System Global Presets</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {presets.map(({ id, label, desc, icon: Icon }) => {
            const active = config.preset === id
            return (
              <Card
                key={id}
                interactive
                onClick={() => applyPreset(id)}
                className={cn(
                  'transition-all',
                  active && 'border-primary-500 bg-primary-50/10 dark:bg-primary-950/20'
                )}
              >
                <CardHeader className="p-0 pb-2">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg border', active ? 'border-primary-500/25 text-primary-500 bg-primary-500/10' : 'border-slate-200 dark:border-slate-800 text-slate-500')}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Simulation Console Log */}
      <Card>
        <CardHeader className="p-0 pb-3.5 flex flex-row items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Live Console Feed</span>
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-64 overflow-y-auto rounded-lg bg-slate-950 border border-slate-900 p-4 font-mono text-xs text-emerald-400 select-text scrollbar-thin shadow-inner space-y-1">
            {log.length === 0 ? (
              <p className="text-slate-650 font-medium">Waiting for console stream telemetry...</p>
            ) : (
              log.map((entry, i) => <div key={i} className="py-0.5 tracking-wide leading-relaxed">&gt; {entry}</div>)
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
