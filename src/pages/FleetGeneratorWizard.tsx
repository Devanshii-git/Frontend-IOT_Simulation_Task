import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useDeviceStore } from '@/store/deviceStore'
import { 
  ArrowLeft, 
  ArrowRight, 
  Cpu, 
  Settings2, 
  Play, 
  CheckCircle, 
  Terminal,
  Workflow
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SpotlightCard } from '@/components/ui/SpotlightCard'
import { useNavigate } from 'react-router-dom'

const MOCK_PROFILES = [
  {
    id: 'prof-proj',
    name: 'Epson Installation Projector',
    type: 'projector',
    protocol: 'PJLink',
    manufacturer: 'Epson',
    model: 'EB-PU1007W',
    metrics: ['temperature', 'lamp_status']
  },
  {
    id: 'prof-cam',
    name: 'Sony PTZ Security Camera',
    type: 'camera',
    protocol: 'HTTP',
    manufacturer: 'Sony',
    model: 'SNC-WR632',
    metrics: ['fps', 'brightness', 'status']
  },
  {
    id: 'prof-mic',
    name: 'Ceo Boardroom Microphone',
    type: 'microphone',
    protocol: 'WebSocket',
    manufacturer: 'Shure',
    model: 'MXA910',
    metrics: ['audio_level', 'status']
  },
  {
    id: 'prof-temp',
    name: 'Office Temperature Sensor',
    type: 'temperature_sensor',
    protocol: 'MQTT',
    manufacturer: 'Honeywell',
    model: 'T9-Smart',
    metrics: ['temperature', 'humidity', 'battery']
  }
]

export function FleetGeneratorWizard() {
  const navigate = useNavigate()
  const bulkSpawn = useDeviceStore((s) => s.bulkSpawnDevices)
  const [step, setStep] = useState(1)

  // Step 1 states
  const [selectedProfileId, setSelectedProfileId] = useState(MOCK_PROFILES[0].id)

  // Step 2 states
  const [formData, setFormData] = useState({
    namePrefix: 'Virtual-Device-',
    deviceCount: 5,
    startingIp: '192.168.1.10',
    startingPort: 8000,
    startingMac: '00:11:22:33:44:00'
  })

  // Step 3 states
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [deployLogs, setDeployLogs] = useState<string[]>([])
  const [completed, setCompleted] = useState(false)

  const selectedProfile = MOCK_PROFILES.find(p => p.id === selectedProfileId)!

  const updateField = (key: string, val: any) => {
    setFormData(prev => ({ ...prev, [key]: val }))
  }

  // Helpers to calculate IP increment
  const incrementIp = (ip: string, offset: number) => {
    const parts = ip.split('.').map(Number)
    if (parts.length !== 4) return ip
    parts[3] = (parts[3] + offset) % 256
    return parts.join('.')
  }

  // Helper to calculate MAC increment
  const incrementMac = (mac: string, offset: number) => {
    const parts = mac.split(':')
    if (parts.length !== 6) return mac
    let hex = parseInt(parts[5], 16)
    hex = (hex + offset) % 256
    const hexStr = hex.toString(16).padStart(2, '0').toUpperCase()
    parts[5] = hexStr
    return parts.join(':')
  }

  const handleNextStep = () => {
    if (step < 3) {
      if (step === 1 && selectedProfile) {
        // Set prefix based on profile name
        updateField('namePrefix', `Virtual-${selectedProfile.manufacturer}-${selectedProfile.model}-`)
      }
      setStep(prev => prev + 1)
    }
  }

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(prev => prev - 1)
    }
  }

  const handleStartDeployment = async () => {
    setRunning(true)
    setDeployLogs([`[START] Initializing deployment runner...`])
    
    const devicesToSpawn: any[] = []
    
    // Generate device payloads
    for (let i = 0; i < formData.deviceCount; i++) {
      const devId = `bulk-dev-${selectedProfile.type}-${i}-${Date.now().toString().slice(-4)}`
      const devIp = incrementIp(formData.startingIp, i)
      const devMac = incrementMac(formData.startingMac, i)
      const devPort = formData.startingPort + i
      
      devicesToSpawn.push({
        id: devId,
        ip: devIp,
        mac: devMac,
        port: devPort,
        protocol: selectedProfile.protocol,
        manufacturer: selectedProfile.manufacturer,
        model: selectedProfile.model,
        telemetry: selectedProfile.metrics.map(field => ({
          field_name: field,
          data_type: field === 'temperature' || field === 'audio_level' ? 'float' : 'int',
          unit: field === 'temperature' ? 'celsius' : 'state'
        }))
      })
    }

    // Deploy simulation logs sequentially
    for (let i = 0; i < devicesToSpawn.length; i++) {
      const dev = devicesToSpawn[i]
      
      // Delay to simulate spawning
      await new Promise(r => setTimeout(r, 600))
      
      setDeployLogs(prev => [
        ...prev,
        `[INFO] Checking IP address availability on ${dev.ip}... Available.`,
        `[INFO] Building virtual worker listener for ID: ${dev.id} on port ${dev.port}...`,
        `[SUCCESS] Spawned ${selectedProfile.manufacturer} ${selectedProfile.model} worker successfully (IP: ${dev.ip}, MAC: ${dev.mac}).`
      ])
      
      setProgress(Math.round(((i + 1) / devicesToSpawn.length) * 100))
    }

    // Call store action
    await bulkSpawn(devicesToSpawn)

    await new Promise(r => setTimeout(r, 800))
    setDeployLogs(prev => [
      ...prev,
      `[COMPLETED] Successfully spawned ${formData.deviceCount} simulated devices in fleet.`,
      `[SYSTEM] Telemetry engine has hooked listeners. Workers are ONLINE.`
    ])
    setRunning(false)
    setCompleted(true)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Fleet Generator Wizard</h1>
        <p className="text-sm text-text-muted">
          Design, generate, and spin up multiple simulated virtual devices simultaneously in bulk.
        </p>
      </div>

      {/* Steps indicator bar */}
      <div className="flex items-center justify-between border border-border bg-bg-surface p-4 rounded-lg">
        {[
          { step: 1, label: 'Choose Profile', icon: Cpu },
          { step: 2, label: 'Configure Fleet', icon: Settings2 },
          { step: 3, label: 'Deploy Devices', icon: Workflow }
        ].map((item) => (
          <div key={item.step} className="flex items-center gap-3">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${
              step === item.step 
                ? 'bg-accent text-white ring-4 ring-accent-subtle/20' 
                : step > item.step 
                  ? 'bg-status-success text-white' 
                  : 'bg-bg-elevated text-text-muted border border-border'
            }`}>
              {step > item.step ? <CheckCircle className="h-4.5 w-4.5" /> : item.step}
            </div>
            <span className={`text-xs font-semibold hidden sm:inline ${step === item.step ? 'text-text-primary' : 'text-text-muted'}`}>
              {item.label}
            </span>
            {item.step < 3 && <div className="h-px w-12 bg-border hidden sm:block" />}
          </div>
        ))}
      </div>

      {/* Main wizard contents */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-base font-bold text-text-primary">Step 1: Choose Device Profile</h2>
              <p className="text-xs text-text-muted">Select the hardware specifications structure you want to deploy in bulk.</p>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {MOCK_PROFILES.map((profile) => {
                  const active = selectedProfileId === profile.id
                  return (
                    <button
                      key={profile.id}
                      onClick={() => setSelectedProfileId(profile.id)}
                      className={`text-left p-5 rounded-lg border transition-all flex flex-col justify-between h-44 cursor-pointer relative overflow-hidden ${
                        active 
                          ? 'border-accent bg-accent/5 ring-2 ring-accent/30' 
                          : 'border-border bg-bg-surface hover:bg-bg-elevated/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs uppercase font-semibold px-2 py-0.5 rounded ${active ? 'bg-accent/15 text-accent' : 'bg-bg-elevated text-text-muted'}`}>
                            {profile.protocol}
                          </span>
                          <span className="text-xs text-text-muted capitalize">{profile.type.replace('_', ' ')}</span>
                        </div>
                        <h3 className="font-bold text-text-primary text-sm mt-3">{profile.name}</h3>
                        <p className="text-xs text-text-muted mt-1.5">{profile.manufacturer} {profile.model}</p>
                      </div>
                      <div className="text-xs text-text-muted border-t border-border/40 pt-2 flex justify-between items-center w-full">
                        <span>Metrics: {profile.metrics.join(', ')}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-base font-bold text-text-primary">Step 2: Fleet Spawning Settings</h2>
              <p className="text-xs text-text-muted">Configure the address ranges, scaling size, and naming schemas for your simulated fleet.</p>

              <SpotlightCard spotlightColor="rgba(99, 102, 241, 0.1)">
                <CardContent className="p-5 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted uppercase">Device Name Prefix</label>
                    <Input
                      value={formData.namePrefix}
                      onChange={(e) => updateField('namePrefix', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted uppercase">Fleet Size (Instances)</label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={formData.deviceCount}
                      onChange={(e) => updateField('deviceCount', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted uppercase">Starting IP Address</label>
                    <Input
                      value={formData.startingIp}
                      onChange={(e) => updateField('startingIp', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted uppercase">Starting TCP Port</label>
                    <Input
                      type="number"
                      value={formData.startingPort}
                      onChange={(e) => updateField('startingPort', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-text-muted uppercase">Starting MAC Address</label>
                    <Input
                      value={formData.startingMac}
                      onChange={(e) => updateField('startingMac', e.target.value)}
                    />
                  </div>
                </CardContent>
              </SpotlightCard>

              {/* Range Preview Card */}
              <div className="p-4 rounded-lg bg-bg-elevated/40 border border-border flex items-center justify-between text-xs text-text-muted">
                <span>Deploying range: <strong>{formData.startingIp}</strong> to <strong>{incrementIp(formData.startingIp, formData.deviceCount - 1)}</strong></span>
                <span>Ports: <strong>{formData.startingPort}</strong> - <strong>{formData.startingPort + formData.deviceCount - 1}</strong></span>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-base font-bold text-text-primary">Step 3: Deploy simulated workers</h2>

              {!running && !completed ? (
                <div className="text-center space-y-4 py-8">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Workflow className="h-7 w-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-text-primary text-base">Ready to spawn {formData.deviceCount} workers</h3>
                    <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
                      Deploying {formData.deviceCount} simulated {selectedProfile.manufacturer} virtual workers using the {selectedProfile.protocol} protocol.
                    </p>
                  </div>
                  <Button onClick={handleStartDeployment} className="bg-accent hover:bg-accent/90 text-white min-h-[44px] px-8 cursor-pointer rounded-lg font-semibold shadow-md">
                    <Play className="mr-1.5 h-4.5 w-4.5" /> Initiate Bulk Spawn
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-text-muted">
                      <span>Deployment progress...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-bg-elevated overflow-hidden">
                      <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  {/* Logs terminal */}
                  <Card className="border border-border bg-bg-surface overflow-hidden">
                    <CardHeader className="py-2.5 px-4 bg-bg-elevated/40 border-b border-border/40 flex flex-row items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider flex items-center gap-1.5">
                        <Terminal className="h-4 w-4 text-accent" /> deployment logs
                      </span>
                    </CardHeader>
                    <CardContent className="p-4 bg-black font-mono text-xs text-green-400 space-y-1 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-border">
                      {deployLogs.map((log, i) => (
                        <div key={i} className={log.startsWith('[SUCCESS]') ? 'text-status-success' : log.startsWith('[START]') ? 'text-accent' : 'text-green-400'}>
                          {log}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {completed && (
                    <div className="flex justify-end gap-3 pt-4">
                      <Button variant="outline" className="cursor-pointer min-h-[40px]" onClick={() => { setStep(1); setCompleted(false); setProgress(0); setDeployLogs([]); }}>
                        Spawn Another Fleet
                      </Button>
                      <Button className="bg-accent hover:bg-accent/90 text-white min-h-[40px] px-6 font-semibold cursor-pointer rounded-lg shadow-sm" onClick={() => navigate('/fleet')}>
                        Go to Fleet Dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation button controls */}
      {step < 3 && (
        <div className="flex justify-between border-t border-border/40 pt-4">
          <Button
            variant="outline"
            onClick={handlePrevStep}
            disabled={step === 1}
            className="cursor-pointer min-h-[40px]"
          >
            <ArrowLeft className="mr-1.5 h-4.5 w-4.5" /> Back
          </Button>
          <Button
            onClick={handleNextStep}
            className="bg-accent hover:bg-accent/90 text-white min-h-[40px] px-6 font-semibold cursor-pointer rounded-lg shadow-sm"
          >
            Next <ArrowRight className="ml-1.5 h-4.5 w-4.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
