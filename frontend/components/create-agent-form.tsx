"use client"

import type React from "react"

import { useState } from "react"
import type { Resource } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Plus, Minus, Rocket, ChevronDown, Wrench, Link, FileText, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

interface CreateAgentFormProps {
  onSubmit: (data: { name: string; role: string; backstory: string; goal: string; resources: Resource[]; documents?: File[] }) => Promise<void> | void
  onCancel: () => void
}

const builtInTools = [
  { name: "Web Search", description: "Search the web for real-time information" },
  { name: "Document Parser", description: "Parse and analyze PDF, TXT, and MD documents" },
  { name: "Code Executor", description: "Execute Python code safely in a sandbox" },
  { name: "Calculator", description: "Perform complex mathematical calculations" },
  { name: "API Caller", description: "Make HTTP requests to external APIs" },
]

export function CreateAgentForm({ onSubmit, onCancel }: CreateAgentFormProps) {
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [backstory, setBackstory] = useState("")
  const [goal, setGoal] = useState("")
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const [resources, setResources] = useState<
    { type: "tool" | "link" | "document"; name: string; description?: string; url?: string; file?: File }[]
  >([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addResource = () => {
    setResources([...resources, { type: "tool", name: "" }])
  }

  const removeResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index))
  }

  const updateResource = (index: number, updates: Partial<(typeof resources)[0]>) => {
    setResources(resources.map((r, i) => (i === index ? { ...r, ...updates } : r)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    // Validation with minimum length requirements (matching backend)
    if (!name.trim()) {
      newErrors.name = "Agent name is required"
    } else if (name.trim().length < 1) {
      newErrors.name = "Agent name must be at least 1 character"
    }

    if (!role.trim()) {
      newErrors.role = "Role is required"
    } else if (role.trim().length < 10) {
      newErrors.role = "Role must be at least 10 characters"
    }

    if (!backstory.trim()) {
      newErrors.backstory = "Backstory is required"
    } else if (backstory.trim().length < 20) {
      newErrors.backstory = "Backstory must be at least 20 characters"
    }

    if (!goal.trim()) {
      newErrors.goal = "Goal is required"
    } else if (goal.trim().length < 10) {
      newErrors.goal = "Goal must be at least 10 characters"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const formattedResources = resources
      .filter((r) => {
        if (r.type === "tool") return r.name.trim() && r.description?.trim()
        if (r.type === "link") return r.name.trim() && r.url?.trim()
        if (r.type === "document") return r.name.trim() && r.file
        return false
      })
      .map((r) => ({
        id: r.name.trim(),
        type: r.type,
        name: r.name.trim(),
        description: r.type === "tool" ? r.description?.trim() : undefined,
        url: r.type === "link" ? r.url?.trim() : undefined,
        fileName: r.type === "document" ? r.file?.name : undefined,
      }))

    const documentFiles = resources
      .filter((r) => r.type === "document" && r.file)
      .map((r) => r.file!)
      .filter((f): f is File => f !== undefined)

    setSubmitError(null)
    try {
      await onSubmit({
      name: name.trim(),
      role: role.trim(),
      backstory: backstory.trim(),
      goal: goal.trim(),
        resources: formattedResources,
        documents: documentFiles.length > 0 ? documentFiles : undefined,
      })
      // Success is handled in page.tsx via toast
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create agent"
      setSubmitError(errorMessage)
      
      // Parse validation errors if they exist
      if (errorMessage.includes("Validation failed") || errorMessage.includes("must be at least")) {
        const errorParts = errorMessage.split(";")
        const newErrors: Record<string, string> = {}
        errorParts.forEach((part) => {
          if (part.includes("Role")) {
            newErrors.role = part.trim()
          } else if (part.includes("Backstory")) {
            newErrors.backstory = part.trim()
          } else if (part.includes("Goal")) {
            newErrors.goal = part.trim()
          } else if (part.includes("Name")) {
            newErrors.name = part.trim()
          }
        })
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors)
          setTouched({
            name: true,
            role: true,
            backstory: true,
            goal: true,
          })
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 animate-fade-in">
        <div className="text-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold gradient-text">Create New Agent</h2>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Define your AI agent&apos;s personality and capabilities
        </p>
      </div>

        {submitError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
            <p className="font-medium">Error creating agent</p>
            <p className="mt-1">{submitError}</p>
          </div>
        )}

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="text-sm md:text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm">
              Agent Name
            </Label>
            <Input
              id="name"
              placeholder="e.g., Customer Support Agent"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setErrors({ ...errors, name: "" })
                setSubmitError(null)
              }}
              onBlur={() => setTouched({ ...touched, name: true })}
              className={cn(
                "text-sm md:text-base",
                errors.name && "border-destructive focus-visible:ring-destructive"
              )}
              aria-invalid={errors.name ? "true" : "false"}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && touched.name && (
              <p id="name-error" className="text-xs text-destructive flex items-center gap-1 mt-1">
                <span className="text-destructive">•</span>
                {errors.name}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="text-sm md:text-base">Agent Identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm">
              Role <span className="text-muted-foreground text-xs">(min. 10 characters)</span>
            </Label>
            <Input
              id="role"
              placeholder="e.g., Friendly and helpful customer service representative"
              value={role}
              onChange={(e) => {
                setRole(e.target.value)
                setErrors({ ...errors, role: "" })
                setSubmitError(null)
              }}
              onBlur={() => setTouched({ ...touched, role: true })}
              className={cn(
                "text-sm md:text-base",
                errors.role && "border-destructive focus-visible:ring-destructive"
              )}
              aria-invalid={errors.role ? "true" : "false"}
              aria-describedby={errors.role ? "role-error" : undefined}
            />
            {errors.role && touched.role && (
              <p id="role-error" className="text-xs text-destructive flex items-center gap-1 mt-1">
                <span className="text-destructive">•</span>
                {errors.role}
              </p>
            )}
            {!errors.role && role.length > 0 && role.length < 10 && touched.role && (
              <p className="text-xs text-amber-500 flex items-center gap-1 mt-1">
                <span>⚠</span>
                {10 - role.length} more characters needed
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="backstory" className="text-sm">
              Backstory <span className="text-muted-foreground text-xs">(min. 20 characters)</span>
            </Label>
            <Textarea
              id="backstory"
              placeholder="Describe the agent's background and experience..."
              value={backstory}
              onChange={(e) => {
                setBackstory(e.target.value)
                setErrors({ ...errors, backstory: "" })
                setSubmitError(null)
              }}
              onBlur={() => setTouched({ ...touched, backstory: true })}
              className={cn(
                "min-h-20 md:min-h-24 resize-none text-sm md:text-base",
                errors.backstory && "border-destructive focus-visible:ring-destructive",
              )}
              aria-invalid={errors.backstory ? "true" : "false"}
              aria-describedby={errors.backstory ? "backstory-error" : undefined}
            />
            {errors.backstory && touched.backstory && (
              <p id="backstory-error" className="text-xs text-destructive flex items-center gap-1 mt-1">
                <span className="text-destructive">•</span>
                {errors.backstory}
              </p>
            )}
            {!errors.backstory && backstory.length > 0 && backstory.length < 20 && touched.backstory && (
              <p className="text-xs text-amber-500 flex items-center gap-1 mt-1">
                <span>⚠</span>
                {20 - backstory.length} more characters needed
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal" className="text-sm">
              Goal <span className="text-muted-foreground text-xs">(min. 10 characters)</span>
            </Label>
            <Textarea
              id="goal"
              placeholder="What is this agent's primary objective?"
              value={goal}
              onChange={(e) => {
                setGoal(e.target.value)
                setErrors({ ...errors, goal: "" })
                setSubmitError(null)
              }}
              onBlur={() => setTouched({ ...touched, goal: true })}
              className={cn(
                "min-h-20 md:min-h-24 resize-none text-sm md:text-base",
                errors.goal && "border-destructive focus-visible:ring-destructive",
              )}
              aria-invalid={errors.goal ? "true" : "false"}
              aria-describedby={errors.goal ? "goal-error" : undefined}
            />
            {errors.goal && touched.goal && (
              <p id="goal-error" className="text-xs text-destructive flex items-center gap-1 mt-1">
                <span className="text-destructive">•</span>
                {errors.goal}
              </p>
            )}
            {!errors.goal && goal.length > 0 && goal.length < 10 && touched.goal && (
              <p className="text-xs text-amber-500 flex items-center gap-1 mt-1">
                <span>⚠</span>
                {10 - goal.length} more characters needed
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Collapsible open={resourcesOpen} onOpenChange={setResourcesOpen}>
        <Card className="bg-card border-border shadow-sm">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-secondary/30 dark:hover:bg-secondary/50 transition-colors rounded-t-lg pb-3 md:pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm md:text-base flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Resources
                  {resources.length > 0 && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      {resources.length}
                    </span>
                  )}
                </CardTitle>
                <ChevronDown className={cn("w-4 h-4 transition-transform", resourcesOpen && "rotate-180")} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {resources.map((resource, index) => (
                <div key={index} className="p-3 md:p-4 bg-secondary/30 rounded-lg space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm font-medium">Resource {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeResource(index)}
                      className="hover:bg-destructive/20 hover:text-destructive dark:hover:bg-destructive/30 dark:hover:text-destructive h-8 w-8 p-0 cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs md:text-sm">Type</Label>
                      <Select
                        value={resource.type}
                        onValueChange={(v: "tool" | "link" | "document") =>
                          updateResource(index, { type: v, name: "", description: "", url: "" })
                        }
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tool">
                            <div className="flex items-center gap-2">
                              <Wrench className="w-4 h-4" />
                              Tool
                            </div>
                          </SelectItem>
                          <SelectItem value="link">
                            <div className="flex items-center gap-2">
                              <Link className="w-4 h-4" />
                              Link
                            </div>
                          </SelectItem>
                          <SelectItem value="document">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Document
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {resource.type === "tool" && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-xs md:text-sm">Built-in Tool</Label>
                          <Select
                            value={resource.name}
                            onValueChange={(v) => {
                              const tool = builtInTools.find((t) => t.name === v)
                              updateResource(index, { name: v, description: tool?.description })
                            }}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select a tool" />
                            </SelectTrigger>
                            <SelectContent>
                              {builtInTools.map((tool) => (
                                <SelectItem key={tool.name} value={tool.name}>
                                  {tool.name}
                                </SelectItem>
                              ))}
                              <SelectItem value="custom">Custom Tool</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {resource.name === "custom" && (
                          <>
                            <div className="space-y-2">
                              <Label className="text-xs md:text-sm">Custom Tool Name</Label>
                              <Input
                                placeholder="Tool name"
                                className="text-sm"
                                onChange={(e) => updateResource(index, { name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs md:text-sm">Description</Label>
                              <Input
                                placeholder="What does this tool do?"
                                className="text-sm"
                                value={resource.description || ""}
                                onChange={(e) => updateResource(index, { description: e.target.value })}
                              />
                            </div>
                          </>
                        )}
                        {resource.name && resource.name !== "custom" && (
                          <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg">
                            <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <p className="text-xs text-muted-foreground">{resource.description}</p>
                          </div>
                        )}
                      </>
                    )}

                    {resource.type === "link" && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-xs md:text-sm">Link Name</Label>
                          <Input
                            placeholder="e.g., Documentation"
                            className="text-sm"
                            value={resource.name}
                            onChange={(e) => updateResource(index, { name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs md:text-sm">URL</Label>
                          <Input
                            type="url"
                            placeholder="https://example.com"
                            className="text-sm"
                            value={resource.url || ""}
                            onChange={(e) => updateResource(index, { url: e.target.value })}
                          />
                        </div>
                      </>
                    )}

                    {resource.type === "document" && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-xs md:text-sm">Document Name</Label>
                          <Input
                            placeholder="e.g., Product Manual"
                            className="text-sm"
                            value={resource.name}
                            onChange={(e) => updateResource(index, { name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs md:text-sm">Upload File</Label>
                          <Input
                            type="file"
                            accept=".pdf,.txt,.md,.doc,.docx"
                            className="text-sm file:bg-primary file:text-primary-foreground file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3 file:cursor-pointer"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                updateResource(index, { file, name: resource.name || file.name })
                              }
                            }}
                          />
                          {resource.file && (
                            <p className="text-xs text-muted-foreground">Selected: {resource.file.name}</p>
                          )}
                          <p className="text-xs text-muted-foreground">Supported: PDF, TXT, MD, DOC, DOCX</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 bg-transparent text-sm cursor-pointer hover:bg-secondary/80 dark:hover:bg-secondary/60"
                onClick={addResource}
              >
                <Plus className="w-4 h-4" />
                Add Resource
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <div className="flex flex-col-reverse sm:flex-row items-center gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto bg-transparent cursor-pointer hover:bg-secondary/80 dark:hover:bg-secondary/60">
          Cancel
        </Button>
        <Button type="submit" className="gap-2 w-full sm:w-auto cursor-pointer hover:bg-primary/90 dark:hover:bg-primary/80 disabled:cursor-not-allowed" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner className="w-4 h-4" />
              Creating...
            </>
          ) : (
            <>
          <Rocket className="w-4 h-4" />
          Create Agent
            </>
          )}
        </Button>
      </div>
    </form>
    </div>
  )
}
