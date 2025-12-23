"use client"

import { Bot, Plus, List, Info, X, Menu, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import type { View } from "@/lib/types"
import { cn } from "@/lib/utils"

interface SidebarProps {
  currentView: View
  onViewChange: (view: View) => void
  agentCount: number
  isOpen: boolean
  onClose: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function Sidebar({ currentView, onViewChange, agentCount, isOpen, onClose, collapsed = false, onToggleCollapse }: SidebarProps) {
  const handleNavClick = (view: View) => {
    onViewChange(view)
    onClose() // Close mobile sidebar on navigation
  }

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0 animate-slide-in" : "-translate-x-full lg:translate-x-0",
          collapsed ? "lg:w-16" : "w-72 lg:w-64",
          collapsed ? "lg:p-2" : "p-4 lg:p-6",
        )}
      >
        <div className="flex items-center justify-between lg:hidden mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            {!collapsed && <span className="font-bold text-sm gradient-text">Agent Builder</span>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 cursor-pointer hover:bg-secondary/80 dark:hover:bg-secondary/60">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="hidden lg:flex items-center gap-3 mb-2 relative">
          {collapsed && onToggleCollapse ? (
            <div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 cursor-pointer hover:opacity-80 transition-opacity group relative"
              onClick={onToggleCollapse}
            >
              <Bot className="w-6 h-6 text-primary-foreground group-hover:opacity-0 transition-opacity" />
              <ChevronRight className="w-6 h-6 text-primary-foreground absolute opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
              {!collapsed && (
          <div>
            <h1 className="text-lg font-bold gradient-text">Agent Builder</h1>
          </div>
              )}
              {onToggleCollapse && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleCollapse}
                  className={cn(
                    "absolute -right-2 top-1/2 -translate-y-1/2 h-6 w-6 cursor-pointer hover:bg-secondary/80 dark:hover:bg-secondary/60",
                    collapsed && "right-0"
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>
        {!collapsed && <p className="hidden lg:block text-sm text-muted-foreground mb-8">Create, Test & Deploy AI Agents</p>}

        <nav className="space-y-2 flex-1">
          <Button
            variant={currentView === "list" ? "default" : "ghost"}
            className={cn(
              "w-full transition-all duration-300 cursor-pointer",
              collapsed ? "justify-center px-0" : "justify-start gap-2",
              currentView === "list" && "bg-primary text-primary-foreground hover:bg-primary/90 dark:hover:bg-primary/80",
              currentView !== "list" && "hover:bg-secondary/80 dark:hover:bg-secondary/60",
            )}
            onClick={() => handleNavClick("list")}
            title={collapsed ? "Agent List" : undefined}
          >
            <List className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Agent List</span>}
          </Button>
          <Button
            variant={currentView === "create" ? "default" : "ghost"}
            className={cn(
              "w-full transition-all duration-300 cursor-pointer",
              collapsed ? "justify-center px-0" : "justify-start gap-2",
              currentView === "create" && "bg-primary text-primary-foreground hover:bg-primary/90 dark:hover:bg-primary/80",
              currentView !== "create" && "hover:bg-secondary/80 dark:hover:bg-secondary/60",
            )}
            onClick={() => handleNavClick("create")}
            title={collapsed ? "Create Agent" : undefined}
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Create Agent</span>}
          </Button>
        </nav>

        {!collapsed && (
        <div className="pt-6 border-t border-sidebar-border space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Total Agents:</span>
            <span className="font-semibold text-foreground">{agentCount}</span>
          </div>

          <div className="bg-secondary/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">About</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Build powerful AI agents with custom personalities, tools, and knowledge. Test them in real-time and
              deploy via API.
            </p>
          </div>
        </div>
        )}
        {collapsed && (
          <div className="pt-6 border-t border-sidebar-border flex flex-col items-center gap-4">
            <ThemeToggle />
          </div>
        )}
      </aside>
    </>
  )
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon" onClick={onClick} className="lg:hidden h-10 w-10 cursor-pointer hover:bg-secondary/80 dark:hover:bg-secondary/60">
      <Menu className="w-5 h-5" />
      <span className="sr-only">Open menu</span>
    </Button>
  )
}
