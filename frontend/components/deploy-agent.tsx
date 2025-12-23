"use client"

import { useState } from "react"
import type { Agent } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, RefreshCw, Copy, Download, CheckCircle, AlertTriangle, Clock, Terminal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

interface DeployAgentProps {
  agent: Agent
  onBack: () => void
  onRegenerateToken: () => void
}

export function DeployAgent({ agent, onBack, onRegenerateToken }: DeployAgentProps) {
  const [copiedToken, setCopiedToken] = useState(false)
  const [copiedEndpoint, setCopiedEndpoint] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  // Use backend API URL - default to localhost:8000 for development
  // This should match the backend server URL, not the frontend URL
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const apiEndpoint = `${apiBaseUrl}/api/v1/agents/${agent.id}/chat`

  const isExpired = agent.tokenExpiry && new Date() > agent.tokenExpiry
  const getTimeUntilExpiry = () => {
    if (!agent.tokenExpiry) return null
    const now = Date.now()
    const expiry = agent.tokenExpiry.getTime()
    const diff = expiry - now
    
    if (diff <= 0) return null // Already expired
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''}`
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`
    } else if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`
    } else {
      return 'less than a minute'
    }
  }
  
  const timeUntilExpiry = getTimeUntilExpiry()

  const copyToClipboard = async (text: string, type: "token" | "endpoint") => {
    await navigator.clipboard.writeText(text)
    if (type === "token") {
      setCopiedToken(true)
      setTimeout(() => setCopiedToken(false), 2000)
    } else {
      setCopiedEndpoint(true)
      setTimeout(() => setCopiedEndpoint(false), 2000)
    }
  }

  const curlExample = `curl -X POST "${apiEndpoint}" \\
  -H "Authorization: Bearer ${agent.apiToken || "YOUR_TOKEN"}" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello, how can you help me?"}'`

  const downloadPostmanCollection = () => {
    const urlParts = new URL(apiEndpoint)
    const collection = {
      info: {
        name: `${agent.name} API`,
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      },
      item: [
        {
          name: "Chat with Agent",
          request: {
            method: "POST",
            header: [
              { key: "Authorization", value: `Bearer ${agent.apiToken}` },
              { key: "Content-Type", value: "application/json" },
            ],
            body: { mode: "raw", raw: JSON.stringify({ message: "Hello!" }) },
            url: {
              raw: apiEndpoint,
              protocol: urlParts.protocol.replace(':', ''),
              host: [urlParts.hostname],
              port: urlParts.port || undefined,
              path: urlParts.pathname.split('/').filter(Boolean),
            },
          },
        },
      ],
    }
    const blob = new Blob([JSON.stringify(collection, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${agent.name.replace(/\s+/g, "_")}_postman.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-3xl animate-fade-in">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 -ml-2 cursor-pointer hover:bg-secondary/80 dark:hover:bg-secondary/60">
        <ArrowLeft className="w-4 h-4" />
        Back to Agents
      </Button>

      <div>
        <h2 className="text-xl md:text-2xl font-bold gradient-text">Deploy {agent.name}</h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">Configure and deploy your agent via API</p>
      </div>

      {/* Status Card */}
      <Card
        className={cn(
          "border-l-4 shadow-sm",
          agent.deploymentStatus === "deployed" && !isExpired && "border-l-success bg-success/5",
          agent.deploymentStatus === "expired" || isExpired ? "border-l-warning bg-warning/5" : "",
          agent.deploymentStatus === "not_deployed" && "border-l-muted bg-muted/5",
        )}
      >
        <CardContent className="pt-4 md:pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {agent.deploymentStatus === "deployed" && !isExpired && (
                <CheckCircle className="w-5 h-5 text-success shrink-0" />
              )}
              {(agent.deploymentStatus === "expired" || isExpired) && (
                <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
              )}
              {agent.deploymentStatus === "not_deployed" && (
                <Clock className="w-5 h-5 text-muted-foreground shrink-0" />
              )}
              <div>
                <p className="font-medium text-sm md:text-base">
                  {agent.deploymentStatus === "deployed" && !isExpired && "Agent is Live"}
                  {(agent.deploymentStatus === "expired" || isExpired) && "Token Expired"}
                  {agent.deploymentStatus === "not_deployed" && "Not Deployed"}
                </p>
                {agent.tokenExpiry && !isExpired && timeUntilExpiry && (
                  <p className="text-xs md:text-sm text-muted-foreground">Token expires in {timeUntilExpiry}</p>
                )}
              </div>
            </div>
            <Button 
              onClick={async () => {
                setIsRegenerating(true)
                try {
                  await onRegenerateToken()
                } finally {
                  setIsRegenerating(false)
                }
              }} 
              variant="outline" 
              className="gap-2 bg-transparent w-full sm:w-auto cursor-pointer hover:bg-secondary/80 dark:hover:bg-secondary/60 disabled:cursor-not-allowed"
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <>
                  <Spinner className="w-4 h-4" />
                  Generating...
                </>
              ) : (
                <>
              <RefreshCw className="w-4 h-4" />
              {agent.deploymentStatus === "not_deployed" ? "Generate Token" : "Regenerate Token"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {agent.apiToken && (
        <>
          {/* API Credentials */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-sm md:text-base">API Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-medium">API Endpoint</label>
                <div className="flex gap-2">
                  <Input value={apiEndpoint} readOnly className="font-mono text-xs md:text-sm bg-secondary" />
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 bg-transparent"
                    onClick={() => copyToClipboard(apiEndpoint, "endpoint")}
                  >
                    {copiedEndpoint ? <CheckCircle className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs md:text-sm font-medium">API Token</label>
                <div className="flex gap-2">
                  <Input
                    value={agent.apiToken}
                    readOnly
                    type="password"
                    className="font-mono text-xs md:text-sm bg-secondary"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 bg-transparent cursor-pointer hover:bg-secondary/80 dark:hover:bg-secondary/60"
                    onClick={() => copyToClipboard(agent.apiToken!, "token")}
                  >
                    {copiedToken ? <CheckCircle className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Keep this token secret. Do not share it publicly.</p>
              </div>
            </CardContent>
          </Card>

          {/* Integration Tools */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-sm md:text-base">Integration Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="gap-2 bg-transparent w-full sm:w-auto cursor-pointer hover:bg-secondary/80 dark:hover:bg-secondary/60"
                onClick={downloadPostmanCollection}
              >
                <Download className="w-4 h-4" />
                Download Postman Collection
              </Button>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-muted-foreground" />
                  <label className="text-xs md:text-sm font-medium">cURL Example</label>
                </div>
                <pre className="p-3 md:p-4 bg-secondary rounded-lg overflow-x-auto text-xs font-mono whitespace-pre-wrap break-all">
                  {curlExample}
                </pre>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
