import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useDeviceStore } from '@/store/deviceStore'
import { useToastStore } from '@/store/toastStore'
import { USE_MOCK_API } from '@/config/api'
import { 
  ArrowLeft, 
  ArrowRight, 
  Play, 
  CheckCircle, 
  Terminal,
  Workflow,
  Projector,
  Camera,
  Mic,
  Volume2,
  Thermometer,
  Trash2,
  Plus,
  Minus,
  Home,
  PlusCircle,
  Info
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SpotlightCard } from '@/components/ui/SpotlightCard'
import { useNavigate } from 'react-router-dom'
import type { DeviceType } from '@/types'

const DEVICE_PROFILES_TEMPLATES = {
  projector: {
    name: 'Epson Installation Projector',
    protocol: 'PJLink' as const,
    manufacturer: 'Epson',
    model: 'EB-PU1007W',
    metrics: ['temperature', 'lamp_status']
  },
  camera: {
    name: 'Sony PTZ Security Camera',
    protocol: 'HTTP' as const,
    manufacturer: 'Sony',
    model: 'SNC-WR632',
    metrics: ['fps', 'brightness', 'status']
  },
  microphone: {
    name: 'Ceo Boardroom Microphone',
    protocol: 'WebSocket' as const,
    manufacturer: 'Shure',
    model: 'MXA910',
    metrics: ['audio_level', 'status']
  },
  speaker: {
    name: 'Biamp Tesira Amplifier/Speaker',
    protocol: 'HTTP' as const,
    manufacturer: 'Biamp',
    model: 'Tesira-AMP',
    metrics: ['volume', 'status']
  },
  temperature_sensor: {
    name: 'Office Temperature Sensor',
    protocol: 'MQTT' as const,
    manufacturer: 'Honeywell',
    model: 'T9-Smart',
    metrics: ['temperature', 'humidity', 'battery']
  }
}

const ROOM_PRESETS = [
  {
    name: 'Conference Room',
    deviceCounts: { projector: 1, speaker: 2, microphone: 1, camera: 1, temperature_sensor: 1 }
  },
  {
    name: 'Boardroom',
    deviceCounts: { projector: 1, speaker: 4, microphone: 2, camera: 1, temperature_sensor: 0 }
  },
  {
    name: 'Huddle Space',
    deviceCounts: { projector: 0, speaker: 1, microphone: 1, camera: 1, temperature_sensor: 0 }
  },
  {
    name: 'Auditorium',
    deviceCounts: { projector: 2, speaker: 8, microphone: 4, camera: 2, temperature_sensor: 2 }
  },
  {
    name: 'Classroom',
    deviceCounts: { projector: 1, speaker: 2, microphone: 1, camera: 0, temperature_sensor: 1 }
  },
  {
    name: 'Custom Room',
    deviceCounts: { projector: 0, speaker: 0, microphone: 0, camera: 0, temperature_sensor: 0 }
  }
]

const generateRoomId = (index: number) => {
  return `room-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`
}

export function FleetGeneratorWizard() {
  const navigate = useNavigate()
  const bulkSpawn = useDeviceStore((s) => s.bulkSpawnDevices)
  const resetWizard = useDeviceStore((s) => s.resetWizard)
  const rooms = useDeviceStore((s) => s.wizardRooms)
  const setRooms = useDeviceStore((s) => s.setWizardRooms)
  const formData = useDeviceStore((s) => s.wizardConfig)

  const [step, setStep] = useState(1)
  const [roomCountToAdd, setRoomCountToAdd] = useState<number | ''>(1)

  // Step 3: Run deployment states
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [deployLogs, setDeployLogs] = useState<string[]>([])
  const [completed, setCompleted] = useState(false)

  // Room helpers
  const handleAddRooms = (preset: typeof ROOM_PRESETS[0]) => {
    const roomsToAddCount = Math.max(1, Number(roomCountToAdd) || 1)
    const newRoomsList = [...rooms]
    
    for (let i = 0; i < roomsToAddCount; i++) {
      const presetCount = newRoomsList.filter(r => r.name.toLowerCase().startsWith(preset.name.toLowerCase())).length
      const suffix = presetCount > 0 ? ` ${presetCount + 1}` : ''
      newRoomsList.push({
        id: generateRoomId(i),
        name: `${preset.name}${suffix}`,
        deviceCounts: { ...preset.deviceCounts }
      })
    }
    
    setRooms(newRoomsList)
  }

  const handleDeleteRoom = (roomId: string) => {
    if (rooms.length <= 1) return
    setRooms(rooms.filter(r => r.id !== roomId))
  }

  const handleUpdateRoomName = (roomId: string, newName: string) => {
    setRooms(rooms.map(r => r.id === roomId ? { ...r, name: newName } : r))
  }

  const handleUpdateDeviceCount = (roomId: string, type: DeviceType, val: number) => {
    setRooms(rooms.map(r => {
      if (r.id === roomId) {
        return {
          ...r,
          deviceCounts: {
            ...r.deviceCounts,
            [type]: Math.max(0, val)
          }
        }
      }
      return r
    }))
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

  // Calculate list of all devices to generate based on room configs
  const getDevicesToGenerate = () => {
    const list: any[] = []
    let ipIndex = 0

    rooms.forEach(room => {
      Object.entries(room.deviceCounts).forEach(([type, count]) => {
        const t = type as DeviceType
        const template = DEVICE_PROFILES_TEMPLATES[t]
        for (let i = 0; i < count; i++) {
          const id = `bulk-dev-${t}-${room.id}-${i}`
          const ip = incrementIp(formData.startingIp, ipIndex)
          const mac = incrementMac(formData.startingMac, ipIndex)
          const port = formData.startingPort + ipIndex

          list.push({
            id,
            name: `${room.name} - ${template.manufacturer} ${template.model} ${i + 1}`,
            type: t,
            location: room.name,
            ip,
            mac,
            port,
            protocol: template.protocol,
            manufacturer: template.manufacturer,
            model: template.model,
            telemetry: template.metrics.map(field => ({
              field_name: field,
              data_type: field === 'temperature' || field === 'audio_level' || field === 'volume' || field === 'brightness' || field === 'fps' ? 'float' : 'int',
              unit: field === 'temperature' ? 'celsius' : field === 'volume' ? 'percent' : 'state'
            }))
          })

          ipIndex++
        }
      })
    })

    return list
  }

  const devicesToSpawn = getDevicesToGenerate()
  const totalDevices = devicesToSpawn.length

  const handleNextStep = () => {
    if (step < 3) {
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
    useToastStore.getState().showInfo(`Initiated bulk deployment of ${devicesToSpawn.length} devices...`)
    setDeployLogs([`[START] Initializing deployment runner for ${rooms.length} rooms...`])
    
    // Deploy simulation logs sequentially
    for (let i = 0; i < devicesToSpawn.length; i++) {
      const dev = devicesToSpawn[i]
      
      // Delay to simulate spawning
      await new Promise(r => setTimeout(r, 400))
      
      const ipLog = USE_MOCK_API ? `${dev.ip}:${dev.port}` : 'Auto-Assigning';
      const macLog = USE_MOCK_API ? `MAC: ${dev.mac}` : 'IP & MAC Auto-Assigned by BE';

      setDeployLogs(prev => [
        ...prev,
        `[INFO] [${dev.location}] Spawning ${dev.type.toUpperCase()} '${dev.name}' on IP ${ipLog}...`,
        `[SUCCESS] Spawned successfully (${macLog}, protocol: ${dev.protocol}).`
      ])
      
      setProgress(Math.round(((i + 1) / devicesToSpawn.length) * 100))
    }

    // Call store action
    await bulkSpawn(devicesToSpawn)

    await new Promise(r => setTimeout(r, 600))
    setDeployLogs(prev => [
      ...prev,
      `[COMPLETED] Successfully spawned ${devicesToSpawn.length} simulated devices across ${rooms.length} rooms.`,
      `[SYSTEM] Telemetry engine has hooked listeners. Workers are ONLINE.`
    ])
    
    // Reset Zustand wizard state to default configuration
    resetWizard()
    
    useToastStore.getState().showSuccess(`Successfully spawned ${devicesToSpawn.length} simulated devices!`)
    setRunning(false)
    setCompleted(true)
  }

  // Helper to render type icons
  const renderTypeIcon = (type: DeviceType, className = "h-4 w-4") => {
    switch (type) {
      case 'projector': return <Projector className={`${className} text-indigo-400`} />
      case 'camera': return <Camera className={`${className} text-teal-400`} />
      case 'microphone': return <Mic className={`${className} text-amber-400`} />
      case 'speaker': return <Volume2 className={`${className} text-pink-400`} />
      case 'temperature_sensor': return <Thermometer className={`${className} text-emerald-400`} />
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Fleet Generator Wizard</h1>
        <p className="text-sm text-text-muted">
          Design room-based device allocations, scale device counts, and spin up multiple simulated virtual devices.
        </p>
      </div>

      {/* Steps indicator bar */}
      <div className="flex items-center justify-between border border-border bg-bg-surface p-4 rounded-lg">
        {[
          { step: 1, label: 'Rooms & Devices', icon: Home },
          { step: 2, label: 'Deploy & Boot', icon: Play }
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
            {item.step < 2 && <div className="h-px w-12 bg-border hidden sm:block" />}
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
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-text-primary">Step 1: Define Rooms and Device Counts</h2>
                  <p className="text-xs text-text-muted">Create layout rooms and assign how many of each device type should exist in each.</p>
                </div>
                <div className="flex items-center gap-2 bg-accent/5 px-4 py-2.5 rounded-lg border border-accent/25 text-xs">
                  <span className="font-semibold text-text-primary">Total:</span>
                  <span className="text-text-muted">{rooms.length} Rooms</span>
                  <span className="text-border">|</span>
                  <span className="text-accent font-bold">{totalDevices} Devices</span>
                </div>
              </div>
              
              {/* Preset buttons to add room with manually set quantity */}
              <div className="bg-bg-elevated/40 border border-border/80 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">Add Room Presets</span>
                  <div className="flex flex-wrap gap-2">
                    {ROOM_PRESETS.map((preset) => (
                      <Button 
                        key={preset.name}
                        variant="outline" 
                        onClick={() => handleAddRooms(preset)}
                        className="cursor-pointer text-xs h-9 flex items-center gap-1.5 hover:bg-bg-elevated"
                      >
                        <PlusCircle className="h-3.5 w-3.5 text-accent" /> {preset.name}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5 md:border-l md:border-border/40 md:pl-6 min-w-[150px]">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">Quantity to Add</label>
                  <Input 
                    type="number" 
                    min={1} 
                    max={20}
                    value={roomCountToAdd}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setRoomCountToAdd('');
                      } else {
                        setRoomCountToAdd(parseInt(val) || 1);
                      }
                    }}
                    className="w-full text-sm font-semibold h-9 px-3"
                  />
                </div>
              </div>

              {/* Grid of rooms */}
              <div className="grid gap-6 md:grid-cols-2">
                {rooms.map((room) => {
                  const roomTotal = Object.values(room.deviceCounts).reduce((a, b) => a + b, 0)
                  return (
                    <SpotlightCard key={room.id} spotlightColor="rgba(99, 102, 241, 0.08)" className="border border-border/80">
                      <div className="p-4 border-b border-border/40 flex items-center justify-between gap-3">
                        <Input
                          value={room.name}
                          onChange={(e) => handleUpdateRoomName(room.id, e.target.value)}
                          className="bg-transparent border-transparent hover:border-border/60 focus:bg-bg-primary font-bold text-sm h-8 px-2 max-w-[200px]"
                          placeholder="Room Name"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-bg-elevated px-2 py-0.5 rounded text-text-muted font-mono">
                            {roomTotal} dev
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRoom(room.id)}
                            disabled={rooms.length <= 1}
                            className="h-8 w-8 text-status-error/80 hover:text-status-error hover:bg-status-error/10 cursor-pointer disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <CardContent className="p-4 space-y-3">
                        {(Object.keys(DEVICE_PROFILES_TEMPLATES) as DeviceType[]).map((type) => {
                          const count = room.deviceCounts[type] || 0
                          const details = DEVICE_PROFILES_TEMPLATES[type]
                          return (
                            <div key={type} className="flex items-center justify-between p-2 rounded-lg bg-bg-primary/20 border border-border/10 hover:border-border/40 transition-all">
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded bg-bg-elevated flex items-center justify-center">
                                  {renderTypeIcon(type, "h-4.5 w-4.5")}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-semibold text-text-primary capitalize">{type.replace('_', ' ')}</span>
                                  <span className="text-[10px] text-text-muted">{details.manufacturer} {details.model}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleUpdateDeviceCount(room.id, type, count - 1)}
                                  disabled={count === 0}
                                  className="h-7 w-7 rounded-full cursor-pointer disabled:opacity-30 border-border/60 hover:bg-bg-elevated"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                
                                <Input 
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={count === 0 ? '' : count}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    handleUpdateDeviceCount(room.id, type, val === '' ? 0 : parseInt(val) || 0);
                                  }}
                                  className="w-12 h-7 text-center text-xs font-mono font-bold text-text-primary p-0.5 border border-border/60 bg-transparent rounded focus:outline-none"
                                />

                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleUpdateDeviceCount(room.id, type, count + 1)}
                                  className="h-7 w-7 rounded-full cursor-pointer border-border/60 hover:bg-bg-elevated"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </CardContent>
                    </SpotlightCard>
                  )
                })}
              </div>

              {totalDevices === 0 && (
                <div className="p-4 bg-status-error/10 border border-status-error/25 rounded-lg flex items-center gap-3 text-status-error text-xs">
                  <Info className="h-4.5 w-4.5 flex-shrink-0" />
                  <span>Please configure at least 1 device in your rooms to proceed to the next step.</span>
                </div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-base font-bold text-text-primary">Step 2: Deploy & Boot Virtual Workers</h2>

              {!running && !completed ? (
                <div className="space-y-6">
                  {/* Dynamic Device Preview List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                        Allocation Preview <span className="text-xs font-normal text-text-muted">({totalDevices} Devices total)</span>
                      </h3>
                    </div>

                    <div className="border border-border rounded-lg overflow-hidden bg-bg-surface">
                      <div className="max-h-80 overflow-y-auto scrollbar-thin">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-bg-elevated/50 text-text-muted sticky top-0 border-b border-border z-10">
                            <tr>
                              <th className="p-3 font-semibold">Location (Room)</th>
                              <th className="p-3 font-semibold">Generated Device Name</th>
                              <th className="p-3 font-semibold">Type</th>
                              <th className="p-3 font-semibold">Protocol</th>
                              <th className="p-3 font-semibold">IP Endpoint</th>
                              <th className="p-3 font-semibold">MAC Address</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {devicesToSpawn.map((dev) => (
                              <tr key={dev.id} className="hover:bg-bg-elevated/20">
                                <td className="p-3 font-semibold text-text-primary">{dev.location}</td>
                                <td className="p-3 text-text-muted">{dev.name}</td>
                                <td className="p-3 capitalize flex items-center gap-1.5">
                                  {renderTypeIcon(dev.type, "h-3.5 w-3.5")}
                                  <span>{dev.type.replace('_', ' ')}</span>
                                </td>
                                <td className="p-3">
                                  <span className="px-1.5 py-0.5 rounded bg-bg-elevated text-[10px] font-mono uppercase">
                                    {dev.protocol}
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-accent">
                                  {USE_MOCK_API ? `${dev.ip}:${dev.port}` : 'Auto-Assigned'}
                                </td>
                                <td className="p-3 font-mono text-text-muted">
                                  {USE_MOCK_API ? dev.mac : 'Auto-Assigned'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="text-center space-y-4 py-8 border-t border-border/40 pt-8">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <Workflow className="h-7 w-7" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-text-primary text-base">Ready to spawn {totalDevices} workers</h3>
                      <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
                        This will register and start {totalDevices} simulated virtual devices across {rooms.length} room zones in the dashboard environment.
                      </p>
                    </div>
                    <Button onClick={handleStartDeployment} className="bg-accent hover:bg-accent/90 text-white min-h-[44px] px-8 cursor-pointer rounded-lg font-semibold shadow-md">
                      <Play className="mr-1.5 h-4.5 w-4.5" /> Initiate Bulk Spawn
                    </Button>
                  </div>
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
      {!running && !completed && (
        <div className="flex justify-between border-t border-border/40 pt-4">
          <Button
            variant="outline"
            onClick={handlePrevStep}
            disabled={step === 1}
            className="cursor-pointer min-h-[40px]"
          >
            <ArrowLeft className="mr-1.5 h-4.5 w-4.5" /> Back
          </Button>
          {step < 2 && (
            <Button
              onClick={handleNextStep}
              disabled={step === 1 && totalDevices === 0}
              className="bg-accent hover:bg-accent/90 text-white min-h-[40px] px-6 font-semibold cursor-pointer rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ArrowRight className="ml-1.5 h-4.5 w-4.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
