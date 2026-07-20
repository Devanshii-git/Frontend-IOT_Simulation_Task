import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/ui/StatusPill'
import { getPendingProfilesApi, approveProfileApi, rejectProfileApi } from '@/services/api'
import type { PendingProfile } from '@/types'
import { 
  Check, 
  X, 
  FileCode, 
  Cpu, 
  Terminal, 
  ShieldCheck, 
  AlertTriangle,
  Copy,
  Clock,
  Search,
  SlidersHorizontal
} from 'lucide-react'

export function ProfileReviewPage() {
  const [profiles, setProfiles] = useState<PendingProfile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<PendingProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [copied, setCopied] = useState<boolean>(false)

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [protocolFilter, setProtocolFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'highest' | 'lowest'>('highest')

  // JSON Editor States
  const [editorText, setEditorText] = useState('')
  const [isValidJson, setIsValidJson] = useState(true)
  const [jsonError, setJsonError] = useState('')
  const [parsedData, setParsedData] = useState<any>(null)

  // Fetch pending profiles
  const fetchProfiles = async () => {
    try {
      setLoading(true)
      const data = await getPendingProfilesApi()
      setProfiles(data)
      if (data.length > 0) {
        setSelectedProfile(data[0])
      } else {
        setSelectedProfile(null)
      }
    } catch (err: any) {
      console.error(err)
      setNotification({ type: 'error', message: err.message || 'Failed to load profiles.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfiles()
  }, [])

  // Auto-update JSON Editor when selection changes
  useEffect(() => {
    if (selectedProfile) {
      const text = JSON.stringify(selectedProfile.profileData, null, 2)
      setEditorText(text)
      setIsValidJson(true)
      setJsonError('')
      setParsedData(selectedProfile.profileData)
    } else {
      setEditorText('')
      setIsValidJson(true)
      setJsonError('')
      setParsedData(null)
    }
  }, [selectedProfile])

  // Show auto-dismiss notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleEditorChange = (val: string) => {
    setEditorText(val)
    try {
      if (!val.trim()) {
        throw new Error('JSON profile data cannot be empty.')
      }
      const parsed = JSON.parse(val)
      setIsValidJson(true)
      setJsonError('')
      setParsedData(parsed)
    } catch (err: any) {
      setIsValidJson(false)
      setJsonError(err.message || 'Invalid JSON format')
    }
  }

  const handleApprove = async (id: string, updatedData: any) => {
    if (!isValidJson || !updatedData) return
    try {
      setActionLoading(id)
      const res = await approveProfileApi(id, updatedData)
      setNotification({ type: 'success', message: res.message })
      // Filter out approved profile from local state
      const nextProfiles = profiles.filter((p) => p.id !== id)
      setProfiles(nextProfiles)
      if (selectedProfile?.id === id) {
        setSelectedProfile(nextProfiles.length > 0 ? nextProfiles[0] : null)
      }
    } catch (err: any) {
      console.error(err)
      setNotification({ type: 'error', message: err.message || 'Failed to approve profile.' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string) => {
    try {
      setActionLoading(id)
      const res = await rejectProfileApi(id)
      setNotification({ type: 'success', message: res.message })
      // Filter out rejected profile from state
      const nextProfiles = profiles.filter((p) => p.id !== id)
      setProfiles(nextProfiles)
      if (selectedProfile?.id === id) {
        setSelectedProfile(nextProfiles.length > 0 ? nextProfiles[0] : null)
      }
    } catch (err: any) {
      console.error(err)
      setNotification({ type: 'error', message: err.message || 'Failed to reject profile.' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleCopyJson = () => {
    if (!editorText) return
    navigator.clipboard.writeText(editorText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatConfidence = (score: number) => {
    const pct = Math.round(score * 100)
    let color = 'text-status-online'
    if (pct < 85 && pct >= 70) color = 'text-status-warning'
    if (pct < 70) color = 'text-status-offline'
    return <span className={`font-semibold ${color}`}>{pct}%</span>
  }

  // Derive unique filters
  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(profiles.map((p) => p.deviceType)))
  }, [profiles])

  const uniqueProtocols = useMemo(() => {
    return Array.from(new Set(profiles.map((p) => p.protocol)))
  }, [profiles])

  // Filter and sort pending profiles
  const filteredProfiles = useMemo(() => {
    let result = [...profiles]

    // 1. Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.deviceName.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.deviceType.toLowerCase().includes(q)
      )
    }

    // 2. Protocol Filter
    if (protocolFilter !== 'all') {
      result = result.filter((p) => p.protocol.toLowerCase() === protocolFilter.toLowerCase())
    }

    // 3. Device Type Filter
    if (typeFilter !== 'all') {
      result = result.filter((p) => p.deviceType === typeFilter)
    }

    // 4. Sort
    result.sort((a, b) => {
      if (sortBy === 'highest') {
        return b.aiConfidence - a.aiConfidence
      } else {
        return a.aiConfidence - b.aiConfidence
      }
    })

    return result
  }, [profiles, searchQuery, protocolFilter, typeFilter, sortBy])

  // Structured preview reads from parsedData (fallback to raw selected profile)
  const activeProfileData = parsedData || selectedProfile?.profileData

  return (
    <div className="flex flex-col gap-6 md:gap-8 select-none">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-2.5 rounded-lg px-4 py-3 shadow-lg border backdrop-blur-md animate-in slide-in-from-right duration-250 ${
          notification.type === 'success' 
            ? 'bg-status-online/15 border-status-online text-status-online' 
            : 'bg-status-error/15 border-status-error text-status-error'
        }`}>
          {notification.type === 'success' ? <ShieldCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          <span className="text-sm font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Header section */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">Profile Review Registry</h1>
        <p className="text-sm text-text-muted font-medium mt-1">
          Review and verify device telemetry schemas ingested and generated dynamically by the AI system.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <Card className="xl:col-span-2 h-[450px]">
            <CardHeader className="h-20 animate-pulse bg-bg-elevated/40 rounded-t-xl" />
            <CardContent className="p-4 space-y-4">
              <div className="h-10 w-full animate-pulse bg-bg-elevated/20 rounded-md" />
              <div className="h-10 w-full animate-pulse bg-bg-elevated/20 rounded-md" />
              <div className="h-10 w-full animate-pulse bg-bg-elevated/20 rounded-md" />
            </CardContent>
          </Card>
          <Card className="xl:col-span-3 h-[500px]">
            <CardHeader className="h-20 animate-pulse bg-bg-elevated/40 rounded-t-xl" />
            <CardContent className="p-4 space-y-4">
              <div className="h-40 w-full animate-pulse bg-bg-elevated/10 rounded-md" />
              <div className="h-32 w-full animate-pulse bg-bg-elevated/10 rounded-md" />
            </CardContent>
          </Card>
        </div>
      ) : profiles.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 py-16 text-center border-dashed border-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-status-online/15 text-status-online mb-4 shadow-inner">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <CardTitle className="text-xl font-bold text-text-primary">All Clear! No Pending Reviews</CardTitle>
          <CardDescription className="max-w-md mt-2">
            Every AI-generated JSON profile has been fully audited and registered. We will notify you when new profiles are ingested from network triggers.
          </CardDescription>
          <Button onClick={fetchProfiles} variant="outline" size="sm" className="mt-6 flex items-center gap-2 cursor-pointer">
            Refresh Pipeline
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
          
          {/* Left Panel: React Data Table of Pending Queue */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            <Card className="border-border/40 shadow-md overflow-hidden">
              <CardHeader className="pb-3 bg-bg-elevated/10 border-b border-border/20">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-accent" />
                  <span>Pending Ingestion Queue</span>
                </CardTitle>
                <CardDescription>
                  Audit profiles using filters, search, and confidence scores.
                </CardDescription>
              </CardHeader>

              {/* Data Table Search and Filters */}
              <div className="p-4 bg-bg-elevated/5 border-b border-border/20 flex flex-col gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search device name or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-bg-primary border border-border/30 rounded-lg pl-9 pr-4 py-2 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full bg-bg-primary border border-border/30 rounded-lg px-2 py-1.5 text-[10px] text-text-secondary focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Types</option>
                      {uniqueTypes.map((t) => (
                        <option key={t} value={t}>{t.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <select
                      value={protocolFilter}
                      onChange={(e) => setProtocolFilter(e.target.value)}
                      className="w-full bg-bg-primary border border-border/30 rounded-lg px-2 py-1.5 text-[10px] text-text-secondary focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Protocols</option>
                      {uniqueProtocols.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full bg-bg-primary border border-border/30 rounded-lg px-2 py-1.5 text-[10px] text-text-secondary focus:outline-none cursor-pointer"
                    >
                      <option value="highest">Score: High-Low</option>
                      <option value="lowest">Score: Low-High</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto max-h-[480px]">
                {filteredProfiles.length === 0 ? (
                  <div className="p-8 text-center text-xs text-text-muted">No pending profiles match the current filter selection.</div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-bg-elevated/20 text-text-muted border-b border-border/20 uppercase text-[9px] tracking-wider font-bold">
                        <th className="p-3 pl-4">Device</th>
                        <th className="p-3">Protocol</th>
                        <th className="p-3 pr-4">AI Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {filteredProfiles.map((profile) => {
                        const isSelected = selectedProfile?.id === profile.id
                        return (
                          <tr
                            key={profile.id}
                            onClick={() => setSelectedProfile(profile)}
                            className={`cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-accent/10 border-l-4 border-l-accent' 
                                : 'hover:bg-bg-elevated/20'
                            }`}
                          >
                            <td className="p-3 pl-4">
                              <div className="font-semibold text-text-primary text-xs truncate max-w-[140px]">{profile.deviceName}</div>
                              <div className="text-[10px] text-text-muted mt-0.5">{profile.deviceType.replace('_', ' ')}</div>
                            </td>
                            <td className="p-3 text-text-secondary font-medium">{profile.protocol}</td>
                            <td className="p-3 pr-4">{formatConfidence(profile.aiConfidence)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          </div>

          {/* Right Panel: Detailed Profile Auditor & Code Editor */}
          <div className="xl:col-span-3 flex flex-col gap-6">
            {selectedProfile && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                
                {/* Audit Controls & Details */}
                <Card className="border-border/40 shadow-md">
                  <CardHeader className="pb-3 border-b border-border/30 flex-row justify-between items-start gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-xl font-bold text-text-primary">
                          {selectedProfile.deviceName}
                        </CardTitle>
                        <StatusPill status={selectedProfile.status.replace('_', ' ')} className="text-[10px]" />
                      </div>
                      <CardDescription className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span>Confidence: {formatConfidence(selectedProfile.aiConfidence)}</span>
                        <span>•</span>
                        <span>Ingested: {new Date(selectedProfile.generatedAt).toLocaleString()}</span>
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={actionLoading !== null}
                        loading={actionLoading === selectedProfile.id}
                        onClick={() => handleReject(selectedProfile.id)}
                        className="text-status-error hover:bg-status-error/10 flex items-center gap-1 cursor-pointer min-h-[36px]"
                      >
                        <X className="h-4 w-4" />
                        <span>Discard</span>
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={actionLoading !== null || !isValidJson}
                        loading={actionLoading === selectedProfile.id}
                        onClick={() => handleApprove(selectedProfile.id, parsedData)}
                        className="bg-status-online hover:bg-status-online/90 disabled:opacity-50 text-white flex items-center gap-1 cursor-pointer min-h-[36px]"
                      >
                        <Check className="h-4 w-4" />
                        <span>Approve Profile</span>
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      
                      {/* Left Column: Structured Dynamic Live Preview */}
                      <div className="flex flex-col gap-5 text-left">
                        
                        {/* Device Info */}
                        <div className="flex flex-col gap-2">
                          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                            <Cpu className="h-3.5 w-3.5 text-accent" />
                            <span>Device Registry Preview</span>
                          </h4>
                          <div className="grid grid-cols-2 gap-3 bg-bg-primary/45 p-3 rounded-lg border border-border/20 text-sm">
                            <div>
                              <p className="text-[10px] text-text-muted uppercase font-semibold">Manufacturer</p>
                              <p className="font-semibold text-text-primary mt-0.5 truncate">{activeProfileData?.manufacturer || '--'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-text-muted uppercase font-semibold">Model ID</p>
                              <p className="font-semibold text-text-primary mt-0.5 truncate">{activeProfileData?.model || '--'}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[10px] text-text-muted uppercase font-semibold">Firmware version</p>
                              <p className="font-semibold text-text-primary mt-0.5 font-mono text-xs truncate">{activeProfileData?.firmwareVersion || '--'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Metric Thresholds */}
                        <div className="flex flex-col gap-2">
                          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                            <SlidersHorizontal className="h-3.5 w-3.5 text-accent" />
                            <span>Metric Rules & Severity</span>
                          </h4>
                          <div className="flex flex-col gap-2">
                            {!activeProfileData?.metricsThresholds || activeProfileData.metricsThresholds.length === 0 ? (
                              <div className="text-xs text-text-muted p-2 rounded bg-bg-primary/20 text-center">No metric rules defined.</div>
                            ) : (
                              activeProfileData.metricsThresholds.map((threshold: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-lg border border-border/20 bg-bg-primary/20 text-xs">
                                  <span className="font-semibold text-text-primary font-mono">{threshold?.metric || 'metric'}</span>
                                  <div className="flex items-center gap-3">
                                    <span className="text-[11px] text-text-muted">
                                      {threshold?.min !== undefined && `min: ${threshold.min}`}
                                      {threshold?.min !== undefined && threshold?.max !== undefined && ' | '}
                                      {threshold?.max !== undefined && `max: ${threshold.max}`}
                                    </span>
                                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full border ${
                                      threshold?.severity === 'critical' 
                                        ? 'bg-status-error/15 border-status-error text-status-error'
                                        : threshold?.severity === 'warning'
                                        ? 'bg-status-warning/15 border-status-warning text-status-warning'
                                        : 'bg-accent/15 border-accent text-accent'
                                    }`}>
                                      {threshold?.severity || 'info'}
                                    </span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Supported commands */}
                        <div className="flex flex-col gap-2">
                          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                            <Terminal className="h-3.5 w-3.5 text-accent" />
                            <span>Command Operations</span>
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {!activeProfileData?.supportedCommands || activeProfileData.supportedCommands.length === 0 ? (
                              <div className="text-xs text-text-muted">No commands parsed.</div>
                            ) : (
                              activeProfileData.supportedCommands.map((command: string, idx: number) => (
                                <span 
                                  key={idx} 
                                  className="text-[11px] font-semibold px-2 py-0.5 rounded bg-bg-elevated border border-border/50 text-text-secondary font-mono"
                                >
                                  {command}()
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Right Column: Code Editor & Validation Alerts */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                            <FileCode className="h-3.5 w-3.5 text-accent" />
                            <span>schema-definition.json</span>
                          </h4>
                          <button
                            onClick={handleCopyJson}
                            className="text-xs font-medium text-text-muted hover:text-accent flex items-center gap-1 px-2 py-1 rounded hover:bg-bg-elevated transition-colors cursor-pointer"
                          >
                            {copied ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-status-online" />
                                <span className="text-status-online">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy JSON</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* IDE-style Interactive Editor Block */}
                        <div className="rounded-lg border border-border/30 bg-[#0d1117] text-[#58a6ff] font-mono text-xs overflow-hidden shadow-inner flex flex-col min-h-[380px]">
                          {/* File bar header */}
                          <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-border/20 text-[10px] text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-[#ff5f56]" />
                              <div className="w-2 h-2 rounded-full bg-[#ffbd2e]" />
                              <div className="w-2 h-2 rounded-full bg-[#27c93f]" />
                              <span className="ml-2 font-semibold text-slate-300">schema.json</span>
                            </div>
                            <span>JSON • Editable</span>
                          </div>
                          
                          {/* Code Editor Input */}
                          <textarea
                            value={editorText}
                            onChange={(e) => handleEditorChange(e.target.value)}
                            className="w-full flex-1 p-4 bg-[#0d1117] text-[#79c0ff] font-mono text-xs focus:outline-none resize-none leading-relaxed border-0 min-h-[330px]"
                            spellCheck={false}
                          />
                        </div>

                        {/* Real-time Syntax Warnings */}
                        {!isValidJson && (
                          <div className="p-3 bg-status-error/15 border border-status-error/30 rounded-lg flex items-start gap-2 text-status-error text-xs text-left animate-in fade-in slide-in-from-top duration-200">
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">JSON Syntax Error: </span>
                              <span className="font-mono">{jsonError}</span>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </CardContent>
                </Card>

              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

