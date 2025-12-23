"use client"

import { useState, useRef, useEffect } from "react"
import type { Agent, ChatSession, Message } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Send,
  Pencil,
  RefreshCw,
  ChevronDown,
  Bot,
  User,
  X,
  Check,
  Loader2,
  History,
  Copy,
  CheckCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
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

interface ChatInterfaceProps {
  agent: Agent
  sessions: ChatSession[]
  currentSessionId: string | null
  onBack: () => void
  onNewChat: () => void
  onSelectSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => void
  onSendMessage: (content: string) => void
  onEditMessage: (messageIndex: number, content: string) => void
  onRegenerateResponse: () => void
  setSessions?: (sessions: ChatSession[]) => void
}

export function ChatInterface({
  agent,
  sessions,
  currentSessionId,
  onBack,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onSendMessage,
  onEditMessage,
  onRegenerateResponse,
  setSessions: setSessionsProp,
}: ChatInterfaceProps) {
  const [message, setMessage] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [originalEditContent, setOriginalEditContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentSession = sessions.find((s) => s.id === currentSessionId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [currentSession?.messages, isThinking])

  const handleSend = async () => {
    if (!message.trim() || isLoading || isThinking) return
    const messageContent = message.trim()
    setMessage("")
    
    // Add user message to local state immediately for instant feedback
    if (currentSession) {
      const userMsg: Message = {
        id: `temp-msg-${Date.now()}`,
        role: "user",
        content: messageContent,
        timestamp: new Date(),
      }
      const updatedSessions = sessions.map((s) => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: [...s.messages, userMsg],
          }
        }
        return s
      })
      if (setSessionsProp) {
        setSessionsProp(updatedSessions)
      }
    }
    
    setIsThinking(true) // Show thinking state immediately
    try {
      await onSendMessage(messageContent)
    } finally {
      setIsThinking(false)
    }
  }

  const handleEdit = (msg: Message) => {
    setEditingId(msg.id)
    setEditContent(msg.content)
    setOriginalEditContent(msg.content) // Store original for comparison
  }

  const saveEdit = async () => {
    if (editingId && editContent.trim() && currentSession) {
      // Only trigger if content actually changed
      if (editContent.trim() !== originalEditContent.trim()) {
        const messageIndex = currentSession.messages.findIndex((m) => m.id === editingId)
        if (messageIndex >= 0) {
          const editedContent = editContent.trim()
          
          // Close edit mode
          setEditingId(null)
          setEditContent("")
          setOriginalEditContent("")
          
          // Update local state immediately - show edited message and remove subsequent messages
          const updatedSessions = sessions.map((s) => {
            if (s.id === currentSessionId) {
              // Update the edited message and remove all messages after it
              const updatedMessages = s.messages.map((msg, idx) => {
                if (idx === messageIndex) {
                  return {
                    ...msg,
                    content: editedContent,
                  }
                }
                return msg
              }).slice(0, messageIndex + 1) // Remove all messages after the edited one
              
              return {
                ...s,
                messages: updatedMessages,
              }
            }
            return s
          })
          
          if (setSessionsProp) {
            setSessionsProp(updatedSessions)
          }
          
          // Show thinking state
          setIsThinking(true)
          
          try {
            // Call backend to update and generate response
            await onEditMessage(messageIndex, editedContent)
          } finally {
            setIsThinking(false)
          }
        } else {
          setEditingId(null)
          setEditContent("")
          setOriginalEditContent("")
        }
      } else {
        setEditingId(null)
        setEditContent("")
        setOriginalEditContent("")
      }
    }
  }

  const cancelEdit = () => {
    // Only discard if content was modified
    if (editContent.trim() !== originalEditContent.trim()) {
      setEditContent(originalEditContent)
    }
    setEditingId(null)
    setEditContent("")
    setOriginalEditContent("")
  }

  const handleRegenerate = async (messageId: string) => {
    if (!currentSession) return
    
    // Find the message index
    const messageIndex = currentSession.messages.findIndex((m) => m.id === messageId)
    if (messageIndex < 0) return
    
    // Remove the assistant response and all subsequent messages from local state immediately
    const updatedSessions = sessions.map((s) => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          messages: s.messages.slice(0, messageIndex),
        }
      }
      return s
    })
    if (setSessionsProp) {
      setSessionsProp(updatedSessions)
    }
    
    setIsThinking(true) // Show thinking state
    try {
      await onRegenerateResponse()
    } finally {
      setIsThinking(false)
    }
  }
  
  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Helper function to render message content with code blocks
  const renderMessageContentWithCodeBlocks = (content: string) => {
    // Split content by code blocks (```language\ncode\n```)
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = []
    let lastIndex = 0
    let match

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index),
        })
      }
      // Add code block
      parts.push({
        type: 'code',
        content: match[2],
        language: match[1] || 'text',
      })
      lastIndex = codeBlockRegex.lastIndex
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex),
      })
    }

    // If no code blocks found, return original content
    if (parts.length === 0) {
      return <p className="whitespace-pre-wrap">{content}</p>
    }

    return (
      <div className="space-y-2">
        {parts.map((part, index) => {
          if (part.type === 'code') {
            return (
              <div key={index} className="relative">
                <div className="bg-muted/50 rounded-lg p-3 overflow-x-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground font-mono">{part.language || 'code'}</span>
                  </div>
                  <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                    <code>{part.content}</code>
                  </pre>
                </div>
              </div>
            )
          }
          return <p key={index} className="whitespace-pre-wrap">{part.content}</p>
        })}
      </div>
    )
  }

  const ChatHistorySidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={cn("flex flex-col", isMobile ? "h-full" : "h-full")}>
      {!isMobile && (
        <div className="p-4 border-b border-border">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-3 -ml-2 cursor-pointer hover:bg-secondary/80 dark:hover:bg-secondary/60">
            <ArrowLeft className="w-4 h-4" />
            Back to Agents
          </Button>
          <h3 className="font-semibold text-sm">Chat History</h3>
        </div>
      )}

      <div className="p-3 space-y-2">
        <Button onClick={onNewChat} className="w-full gap-2 cursor-pointer hover:bg-primary/90 dark:hover:bg-primary/80" size="sm">
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
        {sessions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-muted-foreground hover:text-destructive hover:border-destructive dark:hover:text-destructive dark:hover:border-destructive bg-transparent cursor-pointer"
              onClick={() => {
                setSessionToDelete(null) // null means clear all
                setDeleteDialogOpen(true)
              }}
            >
              Clear History
            </Button>
        )}
      </div>

      <ScrollArea className="flex-1 px-3 overflow-hidden">
        <div className="space-y-1 pb-3 w-full">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors xl:w-64 w-72 box-border",
                session.id === currentSessionId ? "bg-primary/20 border border-primary/30" : "hover:bg-secondary/50 dark:hover:bg-secondary/60",
              )}
              onClick={() => onSelectSession(session.id)}
            >
              <div className="flex-1 min-w-0 overflow-hidden pr-2">
                <p className="text-sm font-medium truncate w-full">{session.title}</p>
                <p className="text-xs text-muted-foreground truncate w-full">
                  {session.messages.length} messages · {session.updatedAt.toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive dark:hover:bg-destructive/30 dark:hover:text-destructive h-7 w-7 p-0 cursor-pointer shrink-0 ml-2"
                onClick={(e) => {
                  e.stopPropagation()
                  setSessionToDelete(session.id)
                  setDeleteDialogOpen(true)
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )

  return (
    <>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {sessionToDelete === null ? "Clear All Chat History?" : "Delete Chat Session?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {sessionToDelete === null
                ? "This will permanently delete all chat sessions. This action cannot be undone."
                : "This will permanently delete this chat session. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setDeleteDialogOpen(false)
                const sessionIdToDelete = sessionToDelete
                setSessionToDelete(null)
                
                if (sessionIdToDelete === null) {
                  // Clear all sessions - delete them sequentially
                  for (const session of sessions) {
                    await onDeleteSession(session.id)
                  }
                } else {
                  // Delete single session
                  await onDeleteSession(sessionIdToDelete)
                }
              }}
              className="bg-destructive cursor-pointer text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] lg:h-[calc(100vh-3rem)] gap-4 animate-fade-in">
        <div className="hidden lg:flex w-72 flex-col bg-card rounded-xl border border-border overflow-hidden">
          <ChatHistorySidebar />
        </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-card rounded-xl border border-border overflow-hidden h-full">
        {/* Agent Details Header */}
        <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
          <CollapsibleTrigger asChild>
            <div className="p-3 md:p-4 border-b border-border cursor-pointer hover:bg-secondary/30 dark:hover:bg-secondary/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 lg:hidden">
                    <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 cursor-pointer hover:bg-secondary/80 dark:hover:bg-secondary/60">
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer hover:bg-secondary/80 dark:hover:bg-secondary/60">
                          <History className="w-4 h-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-80 p-0">
                        <SheetHeader className="p-4 border-b border-border">
                          <SheetTitle>Chat History</SheetTitle>
                        </SheetHeader>
                        <ChatHistorySidebar isMobile />
                      </SheetContent>
                    </Sheet>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Bot className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm md:text-base">{agent.name}</h3>
                    <p className="text-xs text-muted-foreground">Testing Mode</p>
                  </div>
                </div>
                <ChevronDown
                  className={cn("w-4 h-4 text-muted-foreground transition-transform", detailsOpen && "rotate-180")}
                />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-3 md:p-4 bg-secondary/20 border-b border-border space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</p>
                <p className="text-sm">{agent.role}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Goal</p>
                <p className="text-sm">{agent.goal}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Backstory</p>
                <p className="text-sm">{agent.backstory}</p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Messages */}
        <ScrollArea className="flex-1 p-3 md:p-4 min-h-0">
          {!currentSession || currentSession.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                <Bot className="w-7 h-7 md:w-8 md:h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-1 text-sm md:text-base">Start a Conversation</h3>
              <p className="text-xs md:text-sm text-muted-foreground max-w-sm">
                Send a message to test your agent. The agent will respond based on its configured personality and
                capabilities.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentSession.messages.map((msg, index) => (
                <div
                  key={`${msg.id}-${index}-${msg.role}`}
                  className={cn("flex gap-2 md:gap-3 animate-fade-in", msg.role === "user" ? "justify-end" : "")}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] md:max-w-[70%] rounded-2xl p-3 md:p-4",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-secondary rounded-bl-sm",
                      editingId === msg.id && "ring-2 ring-primary animate-subtle-pulse",
                    )}
                  >
                    {editingId === msg.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-20 bg-background/50 border-0 focus-visible:ring-0 resize-none text-sm"
                        />
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={cancelEdit} className="cursor-pointer hover:bg-secondary/80 dark:hover:bg-secondary/60">
                            <X className="w-4 h-4" />
                          </Button>
                          <Button size="sm" onClick={saveEdit} disabled={editContent.trim() === originalEditContent.trim()} className="cursor-pointer hover:bg-primary/90 dark:hover:bg-primary/80 disabled:cursor-not-allowed">
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-xs md:text-sm whitespace-pre-wrap">
                          {renderMessageContentWithCodeBlocks(msg.content)}
                        </div>
                        <div className="flex items-center justify-end gap-1 mt-2">
                          {msg.role === "user" ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 cursor-pointer hover:bg-secondary/80 dark:hover:bg-secondary/60"
                                onClick={() => handleCopyMessage(msg.content, msg.id)}
                                title="Copy message"
                              >
                                {copiedMessageId === msg.id ? (
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 cursor-pointer hover:bg-secondary/80 dark:hover:bg-secondary/60" onClick={() => handleEdit(msg)}>
                                <Pencil className="w-3 h-3" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 cursor-pointer hover:bg-secondary/80 dark:hover:bg-secondary/60 disabled:cursor-not-allowed"
                              onClick={() => handleRegenerate(msg.id)}
                              disabled={isLoading || isThinking}
                            >
                              <RefreshCw className={cn("w-3 h-3", (isLoading || isThinking) && "animate-spin")} />
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </div>
                  )}
                </div>
              ))}
              {isThinking && (
                <div className="flex gap-2 md:gap-3 animate-fade-in">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-foreground" />
                  </div>
                  <div className="bg-secondary rounded-2xl rounded-bl-sm p-3 md:p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🤔</span>
                      <span className="text-xs md:text-sm text-muted-foreground flex items-center gap-1">
                        Thinking
                        <span className="inline-flex gap-0.5">
                          <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                          <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                          <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input Area - Sticky to bottom */}
        <div className="p-3 md:p-4 border-t border-border bg-card shrink-0">
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={isLoading || isThinking}
              className="flex-1 text-sm md:text-base"
            />
            <Button onClick={handleSend} disabled={!message.trim() || isLoading || isThinking} size="icon" className="cursor-pointer hover:bg-primary/90 dark:hover:bg-primary/80 disabled:cursor-not-allowed">
              {isLoading || isThinking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

