"use client"

import React from "react"
import type { Agent } from "@/lib/types"
import { AgentCard } from "./agent-card"
import { Bot, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface AgentListProps {
  agents: Agent[]
  getChatStats: (agentId: string) => Promise<{ chatCount: number; messageCount: number }>
  onTest: (agent: Agent) => void
  onDeploy: (agent: Agent) => void
  onEdit: (agent: Agent) => void
  onDelete: (agent: Agent) => void
  onCreateNew: () => void
}

export function AgentList({ agents, getChatStats, onTest, onDeploy, onEdit, onDelete, onCreateNew }: AgentListProps) {
  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 md:py-20 px-4 animate-fade-in">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 md:mb-6">
          <Bot className="w-8 h-8 md:w-10 md:h-10 text-primary" />
        </div>
        <h3 className="text-lg md:text-xl font-semibold mb-2 text-center">No Agents Yet</h3>
        <p className="text-muted-foreground mb-6 text-center max-w-md text-sm md:text-base">
          Create your first AI agent to get started. Define its personality, add resources, and start testing.
        </p>
        <Button onClick={onCreateNew} className="gap-2 cursor-pointer hover:bg-primary/90 dark:hover:bg-primary/80">
          <Plus className="w-4 h-4" />
          Create Your First Agent
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold gradient-text">Your Agents</h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Manage and deploy your AI agents</p>
        </div>
        <Button onClick={onCreateNew} className="gap-2 w-full sm:w-auto cursor-pointer hover:bg-primary/90 dark:hover:bg-primary/80">
          <Plus className="w-4 h-4" />
          New Agent
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.map((agent, index) => {
          const [stats, setStats] = React.useState({ chatCount: 0, messageCount: 0 })
          const [loadingStats, setLoadingStats] = React.useState(true)
          React.useEffect(() => {
            setLoadingStats(true)
            getChatStats(agent.id).then((data) => {
              setStats(data)
              setLoadingStats(false)
            })
          }, [agent.id])
          return (
            <div key={agent.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-fade-in">
              <AgentCard
                agent={agent}
                chatCount={stats.chatCount}
                messageCount={stats.messageCount}
                loadingStats={loadingStats}
                onTest={() => onTest(agent)}
                onDeploy={() => onDeploy(agent)}
                onEdit={() => onEdit(agent)}
                onDelete={() => onDelete(agent)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
