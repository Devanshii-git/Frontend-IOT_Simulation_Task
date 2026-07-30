import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { parseProfileApi } from '@/services/api'
import { useToastStore } from '@/store/toastStore'
import { USE_MOCK_API } from '@/config/api'
import { 
  Terminal, 
  FileText, 
  Brain, 
  Sparkles, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  FolderOpen
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SpotlightCard } from '@/components/ui/SpotlightCard'

const EXTRACTION_STEPS = [
  'Reading manual content and running lexical analyzer...',
  'Extracting device manufacturer, model, and metadata info...',
  'Analyzing custom protocols and mapping endpoints...',
  'Identifying hardware telemetry streams and formatting data types...',
  'Formatting device profile JSON schema...'
]

export function DeviceProfilerStudio() {
  const [manualText, setManualText] = useState('')
  const [useMock, setUseMock] = useState(USE_MOCK_API)
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [consoleLogs, setConsoleLogs] = useState<string[]>([])
  
  // Output states
  const [profile, setProfile] = useState<any>(null)
  const [jsonText, setJsonText] = useState('')
  const [jsonError, setJsonError] = useState('')
  const [copied, setCopied] = useState(false)

  // Simulation parameters for progressive steps
  useEffect(() => {
    let interval: any
    if (loading) {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < EXTRACTION_STEPS.length - 1) {
            const next = prev + 1
            setConsoleLogs((logs) => [
              ...logs,
              `[INFO] ${EXTRACTION_STEPS[next - 1]} DONE`,
              `[INFO] Starting step: ${EXTRACTION_STEPS[next]}`
            ])
            return next
          } else {
            clearInterval(interval)
            return prev
          }
        })
      }, 1200)
    } else {
      setCurrentStep(0)
    }
    return () => clearInterval(interval)
  }, [loading])

  const handleStartAnalysis = async () => {
    if (!manualText.trim()) return
    setLoading(true)
    setProfile(null)
    setConsoleLogs([
      `[INIT] Booting AlignAV AI parser engine...`,
      `[INFO] Target text: ${manualText.substring(0, 60)}...`,
      `[INFO] Starting step: ${EXTRACTION_STEPS[0]}`
    ])
    
    try {
      const data = await parseProfileApi(manualText, useMock)
      
      // Keep loading active for visual progress if mock/fast response
      await new Promise((resolve) => setTimeout(resolve, useMock ? 5000 : 1000))
      
      setProfile(data)
      setJsonText(JSON.stringify(data, null, 2))
      setJsonError('')
      useToastStore.getState().showSuccess(`AI parsing completed for ${data.manufacturer} ${data.model}!`)
      setConsoleLogs((logs) => [
        ...logs,
        `[SUCCESS] AI parsing completed successfully.`,
        `[COMPLETED] DeviceProfile schema structured for ${data.manufacturer} ${data.model}`
      ])
    } catch (err: any) {
      setConsoleLogs((logs) => [
        ...logs,
        `[ERROR] Parser failed: ${err.message || 'Unknown integration error'}`
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleJsonChange = (val: string) => {
    setJsonText(val)
    try {
      const parsed = JSON.parse(val)
      setProfile(parsed)
      setJsonError('')
    } catch (e: any) {
      setJsonError(e.message || 'Invalid JSON syntax')
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Schema editing functions
  const updateProfileField = (key: string, value: any) => {
    const updated = { ...profile, [key]: value }
    setProfile(updated)
    setJsonText(JSON.stringify(updated, null, 2))
  }

  const handleAddEndpoint = () => {
    const endpoints = profile.endpoints ? [...profile.endpoints] : []
    endpoints.push({ protocol: 'PJLink', command: '', description: '', expected_response: '', variables: {} })
    updateProfileField('endpoints', endpoints)
  }

  const handleRemoveEndpoint = (index: number) => {
    const endpoints = [...profile.endpoints]
    endpoints.splice(index, 1)
    updateProfileField('endpoints', endpoints)
  }

  const handleUpdateEndpoint = (index: number, key: string, val: any) => {
    const endpoints = [...profile.endpoints]
    endpoints[index] = { ...endpoints[index], [key]: val }
    updateProfileField('endpoints', endpoints)
  }

  const handleAddTelemetry = () => {
    const telemetry = profile.telemetry ? [...profile.telemetry] : []
    telemetry.push({ field_name: '', data_type: 'int', unit: '' })
    updateProfileField('telemetry', telemetry)
  }

  const handleRemoveTelemetry = (index: number) => {
    const telemetry = [...profile.telemetry]
    telemetry.splice(index, 1)
    updateProfileField('telemetry', telemetry)
  }

  const handleUpdateTelemetry = (index: number, key: string, val: any) => {
    const telemetry = [...profile.telemetry]
    telemetry[index] = { ...telemetry[index], [key]: val }
    updateProfileField('telemetry', telemetry)
  }

  const handleAddCommand = () => {
    const commands = profile.commands ? [...profile.commands] : []
    commands.push({ command_name: '', payload: '', description: '' })
    updateProfileField('commands', commands)
  }

  const handleRemoveCommand = (index: number) => {
    const commands = [...profile.commands]
    commands.splice(index, 1)
    updateProfileField('commands', commands)
  }

  const handleUpdateCommand = (index: number, key: string, val: any) => {
    const commands = [...profile.commands]
    commands[index] = { ...commands[index], [key]: val }
    updateProfileField('commands', commands)
  }

  const handleLoadSampleManual = () => {
    setManualText(
      `EP-PU1007W 3LCD Projector Installation Manual.\n` +
      `Manufacturer: Epson Corp. Model: EP-PU1007W. Description: Pro installation projector.\n` +
      `Supports PJLink command set. Port: 4352.\n` +
      `Power On control sequence: %1POWR 1. Expect response: %1POWR=OK.\n` +
      `Power Off control sequence: %1POWR 0. Expect response: %1POWR=OK.\n` +
      `Monitors telemetry values: temperature (range 20 to 80 Celsius), lamp_hours (int, life expectation 20000).`
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Device Profiler Studio</h1>
          <p className="text-sm text-text-muted">
            Parse hardware user manuals using AI to auto-generate structured virtual device profile contracts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleLoadSampleManual} disabled={loading} className="cursor-pointer min-h-[40px]">
            <FolderOpen className="mr-2 h-4.5 w-4.5" /> Load Sample Manual
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left column: PDF/Manual Raw Text Ingestion */}
        <div className="lg:col-span-5 space-y-6">
          <SpotlightCard spotlightColor="rgba(99, 102, 241, 0.15)">
            <CardHeader className="p-5 border-b border-border/40">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent animate-pulse" /> Manual Ingestion Deck
              </CardTitle>
              <CardDescription>
                Paste the raw specifications, commands, or text from the product data sheet.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <textarea
                placeholder="Paste device user manual texts here..."
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                disabled={loading}
                className="w-full h-80 rounded-md border border-border bg-bg-primary/50 p-3.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-subtle/40 focus:border-border-accent transition-all resize-none"
              />

              <div className="flex items-center justify-between rounded-lg border border-border bg-bg-elevated/40 px-4 py-3.5">
                <div className="space-y-0.5">
                  <label className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                    <Brain className="h-4.5 w-4.5 text-accent" /> Mock AI Response
                  </label>
                  <p className="text-xs text-text-muted">Simulate AI analysis locally without LLM API calls</p>
                </div>
                <Switch checked={useMock} onChange={setUseMock} disabled={loading} />
              </div>

              <Button
                onClick={handleStartAnalysis}
                disabled={loading || !manualText.trim()}
                className="w-full cursor-pointer bg-accent hover:bg-accent/90 text-white min-h-[44px] flex items-center justify-center font-semibold rounded-lg shadow-md transition-all"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4.5 w-4.5 animate-spin" /> Analysing Spec Sheet...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4.5 w-4.5" /> Generate Device Profile <ArrowRight className="ml-1 h-4.5 w-4.5" />
                  </>
                )}
              </Button>
            </CardContent>
          </SpotlightCard>

          {/* Console Output Deck */}
          {(loading || consoleLogs.length > 0) && (
            <Card className="border border-border bg-bg-surface overflow-hidden">
              <CardHeader className="py-3 px-4 border-b border-border/40 bg-bg-elevated/30 flex flex-row items-center justify-between">
                <span className="text-xs font-semibold text-text-muted flex items-center gap-1.5 uppercase tracking-wider">
                  <Terminal className="h-4 w-4 text-status-warning animate-pulse" /> Live Analysis Console
                </span>
                {loading && (
                  <span className="h-2 w-2 rounded-full bg-status-warning animate-ping" />
                )}
              </CardHeader>
              <CardContent className="p-4 bg-black/90 font-mono text-xs text-green-400 space-y-1 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-border">
                {consoleLogs.map((log, i) => (
                  <div key={i} className={log.startsWith('[ERROR]') ? 'text-status-error' : log.startsWith('[SUCCESS]') ? 'text-status-success' : log.startsWith('[INIT]') ? 'text-accent' : 'text-green-400'}>
                    {log}
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-1 text-text-muted mt-1 animate-pulse">
                    <span>&gt; Processing stage {currentStep + 1}/{EXTRACTION_STEPS.length}...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Target Schema Editor / JSON viewer */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {!profile && !loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex items-center justify-center border border-dashed border-border rounded-lg p-10 bg-bg-surface/30"
              >
                <div className="text-center space-y-3.5 max-w-md">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-bg-elevated text-text-muted">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <h3 className="text-base font-bold text-text-primary">No Device Profile Generated Yet</h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Once you input a device manual and trigger the generation deck, the structured protocol endpoints and parameters will appear here for review.
                  </p>
                </div>
              </motion.div>
            ) : loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[520px] flex flex-col items-center justify-center border border-border bg-bg-surface rounded-lg p-10 space-y-6"
              >
                <div className="relative flex items-center justify-center">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-accent border-t-transparent" />
                  <Brain className="absolute h-6 w-6 text-accent animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-base font-bold text-text-primary">Extracting Device Schemas</h3>
                  <p className="text-xs text-text-muted max-w-xs leading-relaxed">
                    Our AI models are parsing the protocol constraints, commands, expected answers, and telemetry intervals.
                  </p>
                </div>
                {/* Step indicator */}
                <div className="w-full max-w-sm space-y-3.5">
                  {EXTRACTION_STEPS.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-3.5 text-xs">
                      {idx < currentStep ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-status-success shrink-0" />
                      ) : idx === currentStep ? (
                        <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-accent border-t-transparent shrink-0" />
                      ) : (
                        <div className="h-4.5 w-4.5 rounded-full border border-border shrink-0" />
                      )}
                      <span className={idx <= currentStep ? 'text-text-primary font-medium' : 'text-text-muted'}>
                        {step.split('...')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <Card className="border border-border bg-bg-surface">
                  <CardHeader className="p-5 border-b border-border/40 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">Parsed Device Profile Contract</CardTitle>
                      <CardDescription>
                        Review, modify, or add telemetry streams before saving the hardware definition.
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopy} className="cursor-pointer min-h-[36px]">
                        {copied ? <Check className="mr-1.5 h-4 w-4 text-status-success" /> : <Copy className="mr-1.5 h-4 w-4" />}
                        {copied ? 'Copied' : 'Copy JSON'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5">
                    <Tabs defaultValue="visual" className="w-full">
                      <TabsList className="mb-4">
                        <TabsTrigger value="visual">Visual Schema Editor</TabsTrigger>
                        <TabsTrigger value="json">Raw JSON Editor</TabsTrigger>
                      </TabsList>

                      <TabsContent value="visual" className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text-muted uppercase">Manufacturer</label>
                            <Input
                              value={profile.manufacturer || ''}
                              onChange={(e) => updateProfileField('manufacturer', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text-muted uppercase">Model</label>
                            <Input
                              value={profile.model || ''}
                              onChange={(e) => updateProfileField('model', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text-muted uppercase">Device Type</label>
                            <Input
                              value={profile.device_type || ''}
                              onChange={(e) => updateProfileField('device_type', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text-muted uppercase">Description</label>
                            <Input
                              value={profile.description || ''}
                              onChange={(e) => updateProfileField('description', e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Endpoints Table */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-border/40 pb-2">
                            <h4 className="text-sm font-bold text-text-primary">Protocol Endpoints</h4>
                            <Button variant="outline" size="sm" onClick={handleAddEndpoint} className="h-8 cursor-pointer">
                              <Plus className="mr-1 h-3.5 w-3.5" /> Add Endpoint
                            </Button>
                          </div>
                          <div className="space-y-3.5">
                            {profile.endpoints?.map((ep: any, idx: number) => (
                              <div key={idx} className="flex gap-2 items-center bg-bg-primary/40 border border-border p-3.5 rounded-lg relative group">
                                <div className="grid gap-3 sm:grid-cols-4 flex-1">
                                  <Input
                                    placeholder="Protocol"
                                    value={ep.protocol}
                                    onChange={(e) => handleUpdateEndpoint(idx, 'protocol', e.target.value)}
                                  />
                                  <Input
                                    placeholder="Command"
                                    value={ep.command}
                                    onChange={(e) => handleUpdateEndpoint(idx, 'command', e.target.value)}
                                  />
                                  <Input
                                    placeholder="Description"
                                    value={ep.description}
                                    onChange={(e) => handleUpdateEndpoint(idx, 'description', e.target.value)}
                                  />
                                  <Input
                                    placeholder="Expected Response"
                                    value={ep.expected_response}
                                    onChange={(e) => handleUpdateEndpoint(idx, 'expected_response', e.target.value)}
                                  />
                                </div>
                                <button
                                  onClick={() => handleRemoveEndpoint(idx)}
                                  className="h-8 w-8 min-h-[32px] min-w-[32px] rounded-md border border-border bg-bg-surface flex items-center justify-center text-status-error hover:bg-status-error/10 cursor-pointer"
                                >
                                  <Trash2 className="h-4.5 w-4.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Telemetry fields */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-border/40 pb-2">
                            <h4 className="text-sm font-bold text-text-primary">Telemetry Fields</h4>
                            <Button variant="outline" size="sm" onClick={handleAddTelemetry} className="h-8 cursor-pointer">
                              <Plus className="mr-1 h-3.5 w-3.5" /> Add Field
                            </Button>
                          </div>
                          <div className="space-y-3.5">
                            {profile.telemetry?.map((t: any, idx: number) => (
                              <div key={idx} className="flex gap-2 items-center bg-bg-primary/40 border border-border p-3.5 rounded-lg relative group">
                                <div className="grid gap-3 sm:grid-cols-3 flex-1">
                                  <Input
                                    placeholder="Field Name"
                                    value={t.field_name}
                                    onChange={(e) => handleUpdateTelemetry(idx, 'field_name', e.target.value)}
                                  />
                                  <select
                                    className="h-10 rounded-md border border-border bg-bg-primary text-sm px-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                                    value={t.data_type}
                                    onChange={(e) => handleUpdateTelemetry(idx, 'data_type', e.target.value)}
                                  >
                                    <option value="int">Integer (int)</option>
                                    <option value="float">Decimal (float)</option>
                                    <option value="string">Text (string)</option>
                                    <option value="bool">Boolean (bool)</option>
                                  </select>
                                  <Input
                                    placeholder="Unit (optional)"
                                    value={t.unit || ''}
                                    onChange={(e) => handleUpdateTelemetry(idx, 'unit', e.target.value)}
                                  />
                                </div>
                                <button
                                  onClick={() => handleRemoveTelemetry(idx)}
                                  className="h-8 w-8 min-h-[32px] min-w-[32px] rounded-md border border-border bg-bg-surface flex items-center justify-center text-status-error hover:bg-status-error/10 cursor-pointer"
                                >
                                  <Trash2 className="h-4.5 w-4.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Custom actions commands */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-border/40 pb-2">
                            <h4 className="text-sm font-bold text-text-primary">Control Commands</h4>
                            <Button variant="outline" size="sm" onClick={handleAddCommand} className="h-8 cursor-pointer">
                              <Plus className="mr-1 h-3.5 w-3.5" /> Add Command
                            </Button>
                          </div>
                          <div className="space-y-3.5">
                            {profile.commands?.map((cmd: any, idx: number) => (
                              <div key={idx} className="flex gap-2 items-center bg-bg-primary/40 border border-border p-3.5 rounded-lg relative group">
                                <div className="grid gap-3 sm:grid-cols-3 flex-1">
                                  <Input
                                    placeholder="Command Name"
                                    value={cmd.command_name}
                                    onChange={(e) => handleUpdateCommand(idx, 'command_name', e.target.value)}
                                  />
                                  <Input
                                    placeholder="Payload"
                                    value={typeof cmd.payload === 'object' ? JSON.stringify(cmd.payload) : cmd.payload || ''}
                                    onChange={(e) => handleUpdateCommand(idx, 'payload', e.target.value)}
                                  />
                                  <Input
                                    placeholder="Description"
                                    value={cmd.description || ''}
                                    onChange={(e) => handleUpdateCommand(idx, 'description', e.target.value)}
                                  />
                                </div>
                                <button
                                  onClick={() => handleRemoveCommand(idx)}
                                  className="h-8 w-8 min-h-[32px] min-w-[32px] rounded-md border border-border bg-bg-surface flex items-center justify-center text-status-error hover:bg-status-error/10 cursor-pointer"
                                >
                                  <Trash2 className="h-4.5 w-4.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="json" className="space-y-4">
                        <div className="space-y-2">
                          <textarea
                            value={jsonText}
                            onChange={(e) => handleJsonChange(e.target.value)}
                            className="w-full h-[400px] font-mono text-xs rounded-md border border-border bg-bg-primary/50 p-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                          {jsonError && (
                            <div className="flex items-center gap-2 rounded-lg bg-status-error/10 border border-status-error/20 p-3 text-status-error text-xs">
                              <AlertTriangle className="h-4 w-4 shrink-0" />
                              <span>{jsonError}</span>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Final action save block */}
                <div className="flex justify-end gap-3">
                  <Button variant="outline" className="cursor-pointer min-h-[40px]" onClick={() => { setProfile(null); setManualText(''); }}>
                    Discard
                  </Button>
                  <Button className="bg-accent hover:bg-accent/90 text-white min-h-[40px] px-6 font-semibold cursor-pointer rounded-lg shadow-sm" disabled={!!jsonError} onClick={() => alert('Profile definition saved successfully!')}>
                    Save and Register Profile
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
