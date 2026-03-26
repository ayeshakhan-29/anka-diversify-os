export interface ProjectContext {
  id: string
  name: string
  phase: string
  progress: number
  team: Array<{ id: string; name: string; role: string }>
  tasks: Array<{ id: string; title: string; status: string }>
  lastUpdated: Date
}

export interface WorkspaceContext {
  projects: ProjectContext[]
  globalChatHistory: Array<{ role: string; content: string; timestamp: Date }>
  projectChatHistories: Map<string, Array<{ role: string; content: string; timestamp: Date }>>
  lastSync: Date
}

export class ContextManager {
  private static instance: ContextManager
  private workspaceContext: WorkspaceContext
  private readonly STORAGE_KEY = 'anka-workspace-context'

  private constructor() {
    this.workspaceContext = this.loadContext()
  }

  static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager()
    }
    return ContextManager.instance
  }

  // Load context from localStorage
  private loadContext(): WorkspaceContext {
    if (typeof window === 'undefined') {
      // Server-side default
      return {
        projects: [],
        globalChatHistory: [],
        projectChatHistories: new Map(),
        lastSync: new Date()
      }
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          ...parsed,
          projectChatHistories: new Map(parsed.projectChatHistories || [])
        }
      }
    } catch (error) {
      console.error('Failed to load workspace context:', error)
    }

    return {
      projects: [],
      globalChatHistory: [],
      projectChatHistories: new Map(),
      lastSync: new Date()
    }
  }

  // Save context to localStorage
  private saveContext(): void {
    if (typeof window === 'undefined') return

    try {
      const serialized = {
        ...this.workspaceContext,
        projectChatHistories: Array.from(this.workspaceContext.projectChatHistories.entries())
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serialized))
    } catch (error) {
      console.error('Failed to save workspace context:', error)
    }
  }

  // Get all projects context
  getWorkspaceContext(): WorkspaceContext {
    return { ...this.workspaceContext }
  }

  // Update project context
  updateProjectContext(project: ProjectContext): void {
    const existingIndex = this.workspaceContext.projects.findIndex(p => p.id === project.id)
    
    if (existingIndex >= 0) {
      this.workspaceContext.projects[existingIndex] = project
    } else {
      this.workspaceContext.projects.push(project)
    }
    
    this.workspaceContext.lastSync = new Date()
    this.saveContext()
  }

  // Get specific project context
  getProjectContext(projectId: string): ProjectContext | undefined {
    return this.workspaceContext.projects.find(p => p.id === projectId)
  }

  // Add multiple projects at once (bulk update)
  updateProjectsContext(projects: ProjectContext[]): void {
    projects.forEach(project => this.updateProjectContext(project))
  }

  // Get global chat history
  getGlobalChatHistory(): Array<{ role: string; content: string; timestamp: Date }> {
    return this.workspaceContext.globalChatHistory
  }

  // Add to global chat history
  addToGlobalChatHistory(message: { role: string; content: string }): void {
    this.workspaceContext.globalChatHistory.push({
      ...message,
      timestamp: new Date()
    })
    this.saveContext()
  }

  // Get project chat history
  getProjectChatHistory(projectId: string): Array<{ role: string; content: string; timestamp: Date }> {
    return this.workspaceContext.projectChatHistories.get(projectId) || []
  }

  // Add to project chat history
  addToProjectChatHistory(projectId: string, message: { role: string; content: string }): void {
    const history = this.workspaceContext.projectChatHistories.get(projectId) || []
    history.push({
      ...message,
      timestamp: new Date()
    })
    this.workspaceContext.projectChatHistories.set(projectId, history)
    this.saveContext()
  }

  // Clear global chat history
  clearGlobalChatHistory(): void {
    this.workspaceContext.globalChatHistory = []
    this.saveContext()
  }

  // Clear project chat history
  clearProjectChatHistory(projectId: string): void {
    this.workspaceContext.projectChatHistories.set(projectId, [])
    this.saveContext()
  }

  // Get context for AI prompt
  getAIContext(contextType: 'global' | 'project', projectId?: string): string {
    const projects = this.workspaceContext.projects
    
    if (contextType === 'global') {
      return `You are assisting with a workspace that contains ${projects.length} projects:
${projects.map(p => `- ${p.name}: ${p.phase} phase, ${p.progress}% complete`).join('\n')}

You can reference any project when helpful, but maintain awareness of the overall workspace context.`
    }

    if (projectId) {
      const project = projects.find(p => p.id === projectId)
      if (project) {
        const otherProjects = projects.filter(p => p.id !== projectId)
        return `You are assisting with the project "${project.name}" (${project.phase} phase, ${project.progress}% complete).

Project Details:
- Team: ${project.team.map(t => `${t.name} (${t.role})`).join(', ')}
- Active Tasks: ${project.tasks.filter(t => t.status !== 'done').length}
- Completed Tasks: ${project.tasks.filter(t => t.status === 'done').length}

Other Projects in Workspace:
${otherProjects.map(p => `- ${p.name}: ${p.phase} phase`).join('\n') || 'No other projects'}

Consider how this project relates to others in the workspace when providing assistance.`
      }
    }

    return 'You are an AI assistant for project management.'
  }
}
