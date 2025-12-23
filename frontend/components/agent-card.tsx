"use client"

import type { Agent } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FlaskConical, Rocket, Pencil, Trash2, MessageSquare, Calendar, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

interface AgentCardProps {
  agent: Agent
  chatCount: number
  messageCount: number
  loadingStats?: boolean
  onTest: () => void
  onDeploy: () => void
  onEdit: () => void
  onDelete: () => void
}

export function AgentCard({ agent, chatCount, messageCount, loadingStats = false, onTest, onDeploy, onEdit, onDelete }: AgentCardProps) {
  const statusColors = {
    deployed: "bg-success/20 text-success border-success/30",
    expired: "bg-warning/20 text-warning border-warning/30",
    not_deployed: "bg-muted text-muted-foreground border-border",
  }

  const statusLabels = {
    deployed: "Deployed",
    expired: "Expired",
    not_deployed: "Not Deployed",
  }

  return (
    <Card className="group bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 dark:hover:shadow-primary/10 hover:-translate-y-0.5 shadow-sm cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base md:text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {agent.name}
          </CardTitle>
          <Badge variant="outline" className={cn("text-xs shrink-0", statusColors[agent.deploymentStatus])}>
            {statusLabels[agent.deploymentStatus]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{agent.role}</p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{agent.createdAt.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            {loadingStats ? (
              <span className="flex items-center gap-1">
                <Spinner className="w-3 h-3" />
                <span className="text-muted-foreground">Loading...</span>
              </span>
            ) : (
            <span>
              {chatCount} chats · {messageCount} msgs
            </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5 hover:bg-primary hover:text-primary-foreground hover:border-primary dark:hover:bg-primary dark:hover:text-primary-foreground transition-all bg-transparent text-xs md:text-sm cursor-pointer"
            onClick={onTest}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span className="inline">Test</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={cn(
              "flex-1 gap-1.5 transition-all bg-transparent text-xs md:text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
              agent.deploymentStatus === "not_deployed"
                ? "hover:bg-success hover:text-success-foreground hover:border-success dark:hover:bg-success dark:hover:text-success-foreground"
                : "border-success text-success hover:bg-success hover:text-success-foreground hover:border-success dark:hover:bg-success/90",
            )}
            onClick={onDeploy}
          >
            {agent.deploymentStatus === "not_deployed" ? (
              <>
                <Rocket className="w-3.5 h-3.5" />
                <span className="inline">Deploy</span>
              </>
            ) : (
              <>
                <Info className="w-3.5 h-3.5" />
                <span className="inline">View Deployment</span>
              </>
            )}
          </Button>
          <Button size="sm" variant="ghost" className="hover:bg-secondary dark:hover:bg-secondary/80 hover:text-foreground dark:hover:text-blue-900 shrink-0 cursor-pointer" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="hover:bg-destructive/20 hover:text-destructive dark:hover:bg-destructive/30 dark:hover:text-destructive shrink-0 cursor-pointer"
            onClick={onDelete}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
