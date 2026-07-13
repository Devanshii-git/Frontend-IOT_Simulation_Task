import { useState, useEffect } from 'react'
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
  Sliders, 
  Terminal, 
  ShieldCheck, 
  AlertTriangle,
  Copy,
  Clock
} from 'lucide-react'

export function ProfileReviewPage() {
  const [profiles, setProfiles] = useState<PendingProfile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<PendingProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null) // holds profileId of currently loading action
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [copied, setCopied] = useState<boolean>(false)

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

  // Show auto-dismiss notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id)
      const res = await approveProfileApi(id)
      setNotification({ type: 'success', message: res.message })
      // Filter out approved profile from state
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
    if (!selectedProfile) return
    const rawJson = JSON.stringify(selectedProfile.profileData, null, 2)
    navigator.clipboard.writeText(rawJson)
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

  return (
    <div className="flex flex-col gap-6 md:gap-8">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 h-[400px]">
            <CardHeader className="h-20 animate-pulse bg-bg-elevated/40 rounded-t-xl" />
            <CardContent className="p-4 space-y-4">
              <div className="h-10 w-full animate-pulse bg-bg-elevated/20 rounded-md" />
              <div className="h-10 w-full animate-pulse bg-bg-elevated/20 rounded-md" />
              <div className="h-10 w-full animate-pulse bg-bg-elevated/20 rounded-md" />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2 h-[500px]">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Panel: Pending List */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Card className="border-border/40 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-accent" />
                  <span>Pending Ingestion Queue</span>
                </CardTitle>
                <CardDescription>
                  Select a draft profile to inspect its parsed thresholds and raw JSON structure.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-col max-h-[550px] overflow-y-auto divide-y divide-border/30">
                  {profiles.map((profile) => {
                    const isSelected = selectedProfile?.id === profile.id
                    return (
                      <div
                        key={profile.id}
                        onClick={() => setSelectedProfile(profile)}
                        className={`flex flex-col gap-2 p-4 text-left transition-all cursor-pointer relative ${
                          isSelected 
                            ? 'bg-accent/5 border-l-4 border-l-accent' 
                            : 'hover:bg-bg-elevated/40'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-sm text-text-primary truncate max-w-[180px]">{profile.deviceName}</h4>
                          <span className="text-[10px] text-text-muted mt-0.5">
                            {new Date(profile.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-text-muted">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium bg-bg-elevated px-2 py-0.5 rounded text-[10px]">
                              {profile.deviceType.replace('_', ' ')}
                            </span>
                            <span className="text-text-muted">•</span>
                            <span>{profile.protocol}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px]">AI Score:</span>
                            {formatConfidence(profile.aiConfidence)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Detailed Profile Auditor & JSON Code Viewer */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {selectedProfile && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                
                {/* Audit Details */}
                <Card className="border-border/40 shadow-md">
                  <CardHeader className="pb-3 border-b border-border/30 flex-row justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-xl font-bold text-text-primary">
                          {selectedProfile.deviceName}
                        </CardTitle>
                        <StatusPill status={selectedProfile.status.replace('_', ' ')} className="text-[10px]" />
                      </div>
                      <CardDescription className="mt-1 flex items-center gap-1.5">
                        <span>Confidence Score: {formatConfidence(selectedProfile.aiConfidence)}</span>
                        <span>•</span>
                        <span>Ingested at: {new Date(selectedProfile.generatedAt).toLocaleString()}</span>
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
                        disabled={actionLoading !== null}
                        loading={actionLoading === selectedProfile.id}
                        onClick={() => handleApprove(selectedProfile.id)}
                        className="bg-status-online hover:bg-status-online/90 text-white flex items-center gap-1 cursor-pointer min-h-[36px]"
                      >
                        <Check className="h-4 w-4" />
                        <span>Approve Profile</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left side: Structured Details */}
                      <div className="flex flex-col gap-5">
                        
                        {/* Device Info */}
                        <div className="flex flex-col gap-2">
                          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                            <Cpu className="h-3.5 w-3.5" />
                            <span>Device Registry Meta</span>
                          </h4>
                          <div className="grid grid-cols-2 gap-3 bg-bg-primary/45 p-3 rounded-lg border border-border/20 text-sm">
                            <div>
                              <p className="text-[11px] text-text-muted">Manufacturer</p>
                              <p className="font-semibold text-text-primary mt-0.5">{selectedProfile.profileData.manufacturer}</p>
                            </div>
                            <div>
                              <p className="text-[11px] text-text-muted">Model ID</p>
                              <p className="font-semibold text-text-primary mt-0.5">{selectedProfile.profileData.model}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[11px] text-text-muted">Firmware Build</p>
                              <p className="font-semibold text-text-primary mt-0.5 font-mono text-xs">{selectedProfile.profileData.firmwareVersion}</p>
                            </div>
                          </div>
                        </div>

                        {/* Metric Thresholds */}
                        <div className="flex flex-col gap-2">
                          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                            <Sliders className="h-3.5 w-3.5" />
                            <span>Metric Rules & Severity</span>
                          </h4>
                          <div className="flex flex-col gap-2">
                            {selectedProfile.profileData.metricsThresholds.map((threshold, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-border/20 bg-bg-primary/20 text-sm">
                                <span className="font-medium text-text-primary font-mono text-xs">{threshold.metric}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-text-muted">
                                    {threshold.min !== undefined && `min: ${threshold.min}`}
                                    {threshold.min !== undefined && threshold.max !== undefined && ' | '}
                                    {threshold.max !== undefined && `max: ${threshold.max}`}
                                  </span>
                                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                                    threshold.severity === 'critical' 
                                      ? 'bg-status-error/15 border-status-error text-status-error'
                                      : threshold.severity === 'warning'
                                      ? 'bg-status-warning/15 border-status-warning text-status-warning'
                                      : 'bg-accent/15 border-accent text-accent'
                                  }`}>
                                    {threshold.severity}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Supported commands */}
                        <div className="flex flex-col gap-2">
                          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                            <Terminal className="h-3.5 w-3.5" />
                            <span>Supported Command Operations</span>
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedProfile.profileData.supportedCommands.map((command, idx) => (
                              <span 
                                key={idx} 
                                className="text-xs font-semibold px-2.5 py-1 rounded bg-bg-elevated border border-border/50 text-text-secondary font-mono"
                              >
                                {command}()
                              </span>
                            ))}
                          </div>
                        </div>

                      </div>

                      {/* Right side: Interactive JSON Viewer */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                            <FileCode className="h-3.5 w-3.5" />
                            <span>Generated schema.json</span>
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

                        {/* Custom IDE-style code block container */}
                        <div className="flex-1 rounded-lg border border-border/30 bg-[#0d1117] text-slate-300 font-mono text-xs overflow-hidden shadow-inner flex flex-col min-h-[350px]">
                          {/* File bar header */}
                          <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-border/20 text-[10px] text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                              <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                              <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                              <span className="ml-2 font-semibold">profile-definition.json</span>
                            </div>
                            <span>JSON • UTF-8</span>
                          </div>
                          
                          {/* Scrollable code block */}
                          <div className="p-4 overflow-y-auto max-h-[350px] flex-1 text-left select-all">
                            <pre className="whitespace-pre-wrap break-all select-all font-mono">
                              <code>{JSON.stringify(selectedProfile.profileData, null, 2)}</code>
                            </pre>
                          </div>
                        </div>
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
