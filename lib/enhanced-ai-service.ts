import { ContextManager, type ProjectContext } from './context-manager'

export interface ParallelRequest {
  id: string
  type: 'global' | 'project'
  projectId?: string
  message: string
  priority: 'high' | 'medium' | 'low'
}

export interface ParallelResponse {
  id: string
  content: string
  type: 'global' | 'project'
  projectId?: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  timestamp: Date
}

export class EnhancedAIService {
  private static contextManager = ContextManager.getInstance()

  // Process multiple requests in parallel
  static async processParallelRequests(requests: ParallelRequest[]): Promise<ParallelResponse[]> {
    // Group requests by type for optimized processing
    const globalRequests = requests.filter(r => r.type === 'global')
    const projectRequests = requests.filter(r => r.type === 'project')

    // Process requests concurrently
    const [globalResponses, projectResponses] = await Promise.allSettled([
      this.processGlobalRequests(globalRequests),
      this.processProjectRequests(projectRequests)
    ])

    const responses: ParallelResponse[] = []

    // Handle global responses
    if (globalResponses.status === 'fulfilled') {
      responses.push(...globalResponses.value)
    } else {
      console.error('Global requests failed:', globalResponses.reason)
      globalRequests.forEach(req => {
        responses.push(this.createErrorResponse(req))
      })
    }

    // Handle project responses
    if (projectResponses.status === 'fulfilled') {
      responses.push(...projectResponses.value)
    } else {
      console.error('Project requests failed:', projectResponses.reason)
      projectRequests.forEach(req => {
        responses.push(this.createErrorResponse(req))
      })
    }

    return responses.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  // Process global context requests
  private static async processGlobalRequests(requests: ParallelRequest[]): Promise<ParallelResponse[]> {
    const workspaceContext = this.contextManager.getWorkspaceContext()
    
    // Add messages to global history
    requests.forEach(req => {
      this.contextManager.addToGlobalChatHistory({
        role: 'user',
        content: req.message
      })
    })

    // Create batch API call
    const apiCalls = requests.map(req => 
      this.callAIAPI(req.message, 'global', undefined, workspaceContext)
    )

    const responses = await Promise.allSettled(apiCalls)
    
    return responses.map((result, index) => {
      if (result.status === 'fulfilled') {
        const response = result.value
        this.contextManager.addToGlobalChatHistory({
          role: 'assistant',
          content: response.content
        })
        return {
          id: requests[index].id,
          type: 'global',
          content: response.content,
          usage: response.usage,
          timestamp: new Date()
        }
      } else {
        return this.createErrorResponse(requests[index])
      }
    })
  }

  // Process project context requests
  private static async processProjectRequests(requests: ParallelRequest[]): Promise<ParallelResponse[]> {
    const workspaceContext = this.contextManager.getWorkspaceContext()
    
    // Group by project for efficiency
    const requestsByProject = new Map<string, ParallelRequest[]>()
    requests.forEach(req => {
      if (req.projectId) {
        const projectReqs = requestsByProject.get(req.projectId) || []
        projectReqs.push(req)
        requestsByProject.set(req.projectId, projectReqs)
      }
    })

    const allResponses: ParallelResponse[] = []

    // Process each project's requests
    for (const [projectId, projectReqs] of requestsByProject.entries()) {
      const project = this.contextManager.getProjectContext(projectId)
      
      if (!project) {
        // Project not found, create error responses
        projectReqs.forEach(req => {
          allResponses.push(this.createErrorResponse(req, `Project ${projectId} not found`))
        })
        continue
      }

      // Add messages to project history
      projectReqs.forEach(req => {
        this.contextManager.addToProjectChatHistory(projectId, {
          role: 'user',
          content: req.message
        })
      })

      // Create API calls for this project
      const apiCalls = projectReqs.map(req => 
        this.callAIAPI(req.message, 'project', projectId, workspaceContext)
      )

      const responses = await Promise.allSettled(apiCalls)
      
      responses.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const response = result.value
          this.contextManager.addToProjectChatHistory(projectId, {
            role: 'assistant',
            content: response.content
          })
          allResponses.push({
            id: projectReqs[index].id,
            type: 'project',
            projectId,
            content: response.content,
            usage: response.usage,
            timestamp: new Date()
          })
        } else {
          allResponses.push(this.createErrorResponse(projectReqs[index]))
        }
      })
    }

    return allResponses
  }

  // Call AI API with enhanced context
  private static async callAIAPI(
    message: string,
    contextType: 'global' | 'project',
    projectId?: string,
    workspaceContext?: any
  ): Promise<{ content: string; usage?: any }> {
    try {
      // Get enhanced context
      const systemPrompt = this.contextManager.getAIContext(contextType, projectId)
      
      // Get relevant chat history
      const history = contextType === 'global' 
        ? this.contextManager.getGlobalChatHistory().slice(-10)
        : projectId ? this.contextManager.getProjectChatHistory(projectId).slice(-10) : []

      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      ]

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          contextType,
          projectId,
          projectName: projectId ? this.contextManager.getProjectContext(projectId)?.name : undefined
        })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('AI API Error:', error)
      return {
        content: 'I apologize, but I encountered an error while processing your request. Please try again later.'
      }
    }
  }

  // Create error response
  private static createErrorResponse(request: ParallelRequest, customMessage?: string): ParallelResponse {
    return {
      id: request.id,
      type: request.type,
      projectId: request.projectId,
      content: customMessage || 'I apologize, but I encountered an error while processing your request. Please try again later.',
      timestamp: new Date()
    }
  }

  // Update project context (call this when project data changes)
  static updateProjectContext(project: ProjectContext): void {
    this.contextManager.updateProjectContext(project)
  }

  // Get workspace overview for AI
  static getWorkspaceOverview(): string {
    const context = this.contextManager.getWorkspaceContext()
    const activeProjects = context.projects.filter(p => p.phase !== 'completed')
    const completedProjects = context.projects.filter(p => p.phase === 'completed')
    
    return `Workspace Overview:
- Total Projects: ${context.projects.length}
- Active Projects: ${activeProjects.length}
- Completed Projects: ${completedProjects.length}
- Total Chat Messages: ${context.globalChatHistory.length}

Active Projects:
${activeProjects.map(p => `- ${p.name}: ${p.phase} (${p.progress}% complete)`).join('\n') || 'None'}`
  }

  // Get cross-project insights
  static getCrossProjectInsights(): string {
    const context = this.contextManager.getWorkspaceContext()
    const projects = context.projects
    
    if (projects.length < 2) {
      return "Need at least 2 projects for cross-project insights."
    }

    const phases = projects.map(p => p.phase)
    const avgProgress = projects.reduce((sum, p) => sum + p.progress, 0) / projects.length
    
    const insights = [
      `Average project progress: ${avgProgress.toFixed(1)}%`,
      `Projects in development: ${phases.filter(p => p === 'development').length}`,
      `Projects in marketing: ${phases.filter(p => p === 'marketing').length}`,
      `Projects in product-modeling: ${phases.filter(p => p === 'product-modeling').length}`
    ]

    // Find projects that might need attention
    const stuckProjects = projects.filter(p => p.progress < 30 && p.phase !== 'completed')
    if (stuckProjects.length > 0) {
      insights.push(`Projects needing attention: ${stuckProjects.map(p => p.name).join(', ')}`)
    }

    return insights.join('\n')
  }
}
