"use client"

import React, { useState, useCallback, useEffect } from "react"
import type { Agent, View } from "@/lib/types"
import { Sidebar, MobileMenuButton } from "@/components/sidebar"
import { AgentList } from "@/components/agent-list"
import { CreateAgentForm } from "@/components/create-agent-form"
import { ChatInterface } from "@/components/chat-interface"
import { DeployAgent } from "@/components/deploy-agent"
import { EditAgent } from "@/components/edit-agent"
import {
  getAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  getChatSessions,
  createChatSession,
  addMessage,
  updateMessage,
  deleteChatSession,
  deployAgent,
  regenerateToken,
} from "@/lib/store"
import { chatApi } from "@/lib/api-services"
import type { ChatSession, Message } from "@/lib/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Spinner } from "@/components/ui/spinner"

export default function AgentBuilder() {
  const { toast } = useToast()
  const [currentView, setCurrentView] = useState<View>("list")
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Load agents on mount
  const loadAgents = useCallback(async () => {
    try {
      setLoading(true)
      const loadedAgents = await getAgents()
      setAgents(loadedAgents)
    } catch (error) {
      console.error('Failed to load agents:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load agents on mount
  React.useEffect(() => {
    loadAgents()
  }, [loadAgents])

  const refreshAgents = useCallback(async () => {
    await loadAgents()
  }, [loadAgents])

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])

  // Load selected agent and sessions
  useEffect(() => {
    if (selectedAgentId) {
      getAgent(selectedAgentId).then(setSelectedAgent)
      getChatSessions(selectedAgentId).then(setSessions)
    } else {
      setSelectedAgent(null)
      setSessions([])
    }
  }, [selectedAgentId])

  const getChatStats = async (agentId: string) => {
    try {
      const agentSessions = await getChatSessions(agentId)
      return {
        chatCount: agentSessions.length,
        messageCount: agentSessions.reduce((sum, s) => sum + s.messages.length, 0),
      }
    } catch (error) {
      return { chatCount: 0, messageCount: 0 }
    }
  }

  const handleTest = async (agent: Agent) => {
    setSelectedAgentId(agent.id)
    try {
      const agentSessions = await getChatSessions(agent.id)
      if (agentSessions.length > 0) {
        setCurrentSessionId(agentSessions[0].id)
      } else {
        const newSession = await createChatSession(agent.id)
        setCurrentSessionId(newSession.id)
      }
      setCurrentView("test")
      await refreshAgents()
    } catch (error) {
      console.error('Failed to start test:', error)
    }
  }

  const handleDeploy = async (agent: Agent) => {
    setSelectedAgentId(agent.id)

    // If agent is already deployed or expired, just open the deployment details view
    if (agent.deploymentStatus !== "not_deployed") {
      setCurrentView("deploy")
      return
    }

    try {
      // Auto-deploy the agent, then show deployment details
      await deployAgent(agent.id)
      await refreshAgents()
      setCurrentView("deploy")
      toast({
        title: "Agent deployed",
        description: `${agent.name} has been successfully deployed.`,
      })
    } catch (error) {
      toast({
        title: "Deployment failed",
        description: error instanceof Error ? error.message : "Failed to deploy agent",
        variant: "destructive",
      })
      // Still redirect to deploy page even if deployment fails, so user can see details/errors
      setCurrentView("deploy")
    }
  }

  const handleEdit = (agent: Agent) => {
    setSelectedAgentId(agent.id)
    setCurrentView("edit")
  }

  const handleDelete = (agent: Agent) => {
    setAgentToDelete(agent)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (agentToDelete) {
      try {
        await deleteAgent(agentToDelete.id)
        await refreshAgents()
        setDeleteDialogOpen(false)
        const agentName = agentToDelete.name
        setAgentToDelete(null)
        toast({
          title: "Agent deleted",
          description: `${agentName} has been successfully deleted.`,
        })
      } catch (error) {
        toast({
          title: "Deletion failed",
          description: error instanceof Error ? error.message : "Failed to delete agent",
          variant: "destructive",
        })
      }
    }
  }

  const handleCreateAgent = async (data: {
    name: string
    role: string
    backstory: string
    goal: string
    resources: Agent["resources"]
    documents?: File[]
  }) => {
    try {
      await createAgent(data)
      await refreshAgents()
      setCurrentView("list")
      toast({
        title: "Agent created",
        description: `${data.name} has been successfully created.`,
      })
    } catch (error) {
      toast({
        title: "Creation failed",
        description: error instanceof Error ? error.message : "Failed to create agent",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleUpdateAgent = async (updates: { name: string; role: string; backstory: string; goal: string; resources: Agent["resources"] }) => {
    if (selectedAgentId) {
      try {
        await updateAgent(selectedAgentId, updates)
        await refreshAgents()
        setCurrentView("list")
        toast({
          title: "Agent updated",
          description: `${updates.name} has been successfully updated.`,
        })
      } catch (error) {
        toast({
          title: "Update failed",
          description: error instanceof Error ? error.message : "Failed to update agent",
          variant: "destructive",
        })
        throw error
      }
    }
  }

  const handleNewChat = async () => {
    if (selectedAgentId) {
      try {
        const newSession = await createChatSession(selectedAgentId)
        setCurrentSessionId(newSession.id)
        // Force refresh to get the new session
        const updatedSessions = await getChatSessions(selectedAgentId, true)
        setSessions(updatedSessions)
        toast({
          title: "New chat started",
          description: "A new chat session has been created.",
        })
      } catch (error) {
        toast({
          title: "Failed to create chat",
          description: error instanceof Error ? error.message : "Failed to create new chat session",
          variant: "destructive",
        })
      }
    }
  }

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId)
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!selectedAgentId) return
    try {
      // Optimistically update UI - remove session from local state immediately
      const currentSessions = sessions.filter((s) => s.id !== sessionId)
      setSessions(currentSessions)
      
      // Update current session if needed
      if (currentSessionId === sessionId) {
        if (currentSessions.length > 0) {
          setCurrentSessionId(currentSessions[0].id)
        } else {
          // Create new session if all were deleted
          const newSession = await createChatSession(selectedAgentId)
          setCurrentSessionId(newSession.id)
        }
      }
      
      // Delete the session on backend
      await deleteChatSession(selectedAgentId, sessionId)
      
      // Verify deletion by refreshing from backend
      const updatedSessions = await getChatSessions(selectedAgentId, true)
      
      // Verify the session was actually deleted
      const sessionStillExists = updatedSessions.find((s) => s.id === sessionId)
      if (sessionStillExists) {
        // If session still exists, the backend deletion failed
        // Restore the session in UI and show error
        setSessions(sessions) // Restore original sessions
        throw new Error("Failed to delete session - it still exists on the server")
      }
      
      // Update with verified backend state
      setSessions(updatedSessions)
      
      // Ensure current session is still valid
      if (updatedSessions.length > 0) {
        const currentStillExists = updatedSessions.find((s) => s.id === currentSessionId)
        if (!currentStillExists) {
          setCurrentSessionId(updatedSessions[0].id)
        }
      } else {
        // Create new session if all were deleted
        const newSession = await createChatSession(selectedAgentId)
        setCurrentSessionId(newSession.id)
        const finalSessions = await getChatSessions(selectedAgentId, true)
        setSessions(finalSessions)
      }
      
      toast({
        title: "Chat deleted",
        description: "The chat session has been successfully deleted.",
      })
    } catch (error) {
      // Restore original sessions on error
      const originalSessions = await getChatSessions(selectedAgentId, true)
      setSessions(originalSessions)
      
      toast({
        title: "Deletion failed",
        description: error instanceof Error ? error.message : "Failed to delete chat session",
        variant: "destructive",
      })
    }
  }

  const handleSendMessage = async (content: string) => {
    if (currentSessionId && selectedAgentId) {
      try {
        // Send to API - backend will save user message and generate response
        await addMessage(selectedAgentId, currentSessionId, { role: "user", content })
        
        // Refresh sessions from API to get the complete updated state (backend saves both messages)
        const updatedSessions = await getChatSessions(selectedAgentId, true) // Force refresh
        
        // Remove temp messages (those starting with "temp-msg-") and replace with real ones
        const cleanedSessions = updatedSessions.map((session) => ({
          ...session,
          messages: session.messages.filter((msg) => !msg.id.startsWith("temp-msg-")),
        }))
        
        setSessions(cleanedSessions)
        
        // Ensure current session is still selected
        const updatedCurrentSession = cleanedSessions.find((s) => s.id === currentSessionId)
        if (!updatedCurrentSession && cleanedSessions.length > 0) {
          // If current session was deleted, select the first one
          setCurrentSessionId(cleanedSessions[0].id)
        }
      } catch (error) {
        toast({
          title: "Failed to send message",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        })
      }
    }
  }

  const handleEditMessage = async (messageIndex: number, content: string) => {
    if (currentSessionId && selectedAgentId) {
      try {
        // Update the message (backend now automatically regenerates response after edit)
        await updateMessage(selectedAgentId, currentSessionId, messageIndex, content)
        
        // Refresh sessions to get updated messages (backend has already generated the response)
        const updatedSessions = await getChatSessions(selectedAgentId, true)
        
        // Remove temp messages (those starting with "temp-msg-")
        const cleanedSessions = updatedSessions.map((session) => ({
          ...session,
          messages: session.messages.filter((msg) => !msg.id.startsWith("temp-msg-")),
        }))
        
        setSessions(cleanedSessions)
        
        // Ensure current session is still selected
        const updatedCurrentSession = cleanedSessions.find((s) => s.id === currentSessionId)
        if (updatedCurrentSession) {
          setCurrentSessionId(currentSessionId)
        }
        // No toast - silent update
      } catch (error) {
        toast({
          title: "Update failed",
          description: error instanceof Error ? error.message : "Failed to update message",
          variant: "destructive",
        })
      }
    }
  }

  const handleRegenerateResponse = async () => {
    if (currentSessionId && selectedAgentId) {
      try {
        await chatApi.regenerateResponse(selectedAgentId, currentSessionId)
        // Force refresh to get updated messages (backend truncates and regenerates)
        const updatedSessions = await getChatSessions(selectedAgentId, true)
        setSessions(updatedSessions)
        // Ensure current session is still selected
        const updatedCurrentSession = updatedSessions.find((s) => s.id === currentSessionId)
        if (!updatedCurrentSession && updatedSessions.length > 0) {
          setCurrentSessionId(updatedSessions[0].id)
        }
        toast({
          title: "Response regenerated",
          description: "A new response has been generated.",
        })
      } catch (error) {
        toast({
          title: "Regeneration failed",
          description: error instanceof Error ? error.message : "Failed to regenerate response",
          variant: "destructive",
        })
      }
    }
  }

  const handleRegenerateToken = async () => {
    if (selectedAgentId) {
      try {
        await regenerateToken(selectedAgentId)
        await refreshAgents()
        toast({
          title: "Token regenerated",
          description: "A new API token has been generated successfully.",
        })
      } catch (error) {
        toast({
          title: "Regeneration failed",
          description: error instanceof Error ? error.message : "Failed to regenerate token",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view)
          if (view === "list") {
            setSelectedAgentId(null)
            setCurrentSessionId(null)
          }
        }}
        agentCount={agents.length}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        <header className="sticky top-0 z-30 flex items-center justify-between p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border lg:hidden">
          <MobileMenuButton onClick={() => setSidebarOpen(true)} />
          <h1 className="text-lg font-bold gradient-text">Agent Builder</h1>
          <div className="w-10" />
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {loading && currentView === "list" ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Spinner className="w-8 h-8 text-primary" />
              <div className="text-muted-foreground">Loading agents...</div>
            </div>
          ) : currentView === "list" ? (
            <AgentList
              agents={agents}
              getChatStats={getChatStats}
              onTest={handleTest}
              onDeploy={handleDeploy}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCreateNew={() => setCurrentView("create")}
            />
          ) : null}

          {currentView === "create" && (
            <div className="flex items-start justify-center min-h-[calc(100vh-8rem)] py-8">
              <CreateAgentForm onSubmit={handleCreateAgent} onCancel={() => setCurrentView("list")} />
            </div>
          )}

          {currentView === "test" && selectedAgent && (
            <ChatInterface
              agent={selectedAgent}
              sessions={sessions}
              currentSessionId={currentSessionId}
              onBack={() => {
                setCurrentView("list")
                setSelectedAgentId(null)
                setCurrentSessionId(null)
              }}
              onNewChat={handleNewChat}
              onSelectSession={handleSelectSession}
              onDeleteSession={handleDeleteSession}
              onSendMessage={handleSendMessage}
              onEditMessage={handleEditMessage}
              onRegenerateResponse={handleRegenerateResponse}
              setSessions={setSessions}
            />
          )}

          {currentView === "deploy" && selectedAgent && (
            <DeployAgent
              agent={selectedAgent}
              onBack={() => {
                setCurrentView("list")
                setSelectedAgentId(null)
              }}
              onRegenerateToken={handleRegenerateToken}
            />
          )}

          {currentView === "edit" && selectedAgent && (
            <EditAgent
              agent={selectedAgent}
              onBack={() => {
                setCurrentView("list")
                setSelectedAgentId(null)
              }}
              onSave={handleUpdateAgent}
            />
          )}
        </main>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{agentToDelete?.name}&quot;? This action cannot be undone and will
              also delete all associated chat sessions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
