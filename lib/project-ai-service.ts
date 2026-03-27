// Enhanced AI service for projects with GitHub context

import { ProjectGitHubService, ProjectGitHubContext } from './project-github-service';

export interface ProjectAIRequest {
  projectId: string;
  projectName: string;
  message: string;
  githubUrl?: string;
  includeFileContents?: boolean;
  maxFiles?: number;
}

export interface ProjectAIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  githubContext?: {
    repo: string;
    fileCount: number;
    languages: string[];
  };
}

export class ProjectAIService {
  // Send message with GitHub context
  static async sendMessageWithGitHub(request: ProjectAIRequest): Promise<ProjectAIResponse> {
    const { projectId, projectName, message, githubUrl, includeFileContents = false, maxFiles = 5 } = request;

    try {
      let githubContext: ProjectGitHubContext | undefined;
      let relevantFilesContent = '';

      // If GitHub URL is provided, build or get context
      if (githubUrl) {
        try {
          // Try to get cached context first
          githubContext = ProjectGitHubService.getProjectContext(projectId);
          
          // If no cached context, build it
          if (!githubContext) {
            githubContext = await ProjectGitHubService.buildProjectContext(projectId, githubUrl);
          }

          // Search for relevant files based on the message
          if (includeFileContents) {
            const relevantFiles = await ProjectGitHubService.searchRelevantFiles(
              projectId,
              message,
              maxFiles
            );
            
            relevantFilesContent = '\n\nRelevant Files:\n';
            relevantFiles.forEach(({ file, content }) => {
              relevantFilesContent += `\n--- ${file.path} ---\n${content.slice(0, 2000)}...\n`;
            });
          }
        } catch (error) {
          console.warn('Failed to load GitHub context:', error);
          // Continue without GitHub context
        }
      }

      // Create enhanced message
      const enhancedMessage = this.createEnhancedMessage(
        message,
        projectName,
        githubContext,
        relevantFilesContent
      );

      // Call AI API
      const response = await this.callAIAPI(enhancedMessage, projectName, githubContext);

      return {
        content: response.content,
        usage: response.usage,
        githubContext: githubContext ? {
          repo: `${githubContext.repo.owner}/${githubContext.repo.repo}`,
          fileCount: githubContext.files.length,
          languages: githubContext.languages,
        } : undefined,
      };
    } catch (error) {
      console.error('Project AI Service Error:', error);
      return {
        content: 'I apologize, but I encountered an error while processing your request. Please try again later.',
      };
    }
  }

  // Create enhanced message with GitHub context
  private static createEnhancedMessage(
    originalMessage: string,
    projectName: string,
    githubContext?: ProjectGitHubContext,
    relevantFilesContent?: string
  ): string {
    let enhancedMessage = originalMessage;

    if (githubContext) {
      enhancedMessage += `\n\nProject GitHub Context:\n${githubContext.summary}\n\nFile Structure:\n${githubContext.structure.slice(0, 1500)}`;
      
      if (githubContext.readme) {
        enhancedMessage += `\n\nREADME Preview:\n${githubContext.readme.slice(0, 1000)}...`;
      }
    }

    if (relevantFilesContent) {
      enhancedMessage += relevantFilesContent;
    }

    return enhancedMessage;
  }

  // Call AI API with enhanced context
  private static async callAIAPI(
    message: string,
    projectName: string,
    githubContext?: ProjectGitHubContext
  ): Promise<{ content: string; usage?: any }> {
    // Create system prompt
    const systemPrompt = this.createSystemPrompt(projectName, githubContext);

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        contextType: 'project',
        projectName,
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // Create system prompt with GitHub context
  private static createSystemPrompt(
    projectName: string,
    githubContext?: ProjectGitHubContext
  ): string {
    let prompt = `You are an AI assistant for the Anka Project Management OS, specifically helping with the project "${projectName}".

Your capabilities include:
- Writing and reviewing code (React, TypeScript, Next.js, etc.)
- Generating documentation
- Answering technical questions
- Debugging issues
- Providing best practices
- Project planning and task breakdown

Be helpful, concise, and provide practical solutions. When providing code, ensure it follows modern best practices and is properly formatted.`;

    if (githubContext) {
      prompt += `\n\nGitHub Repository Context:
You have access to the repository: ${githubContext.repo.owner}/${githubContext.repo.repo}

Repository Information:
${githubContext.summary}

File Structure:
${githubContext.structure.slice(0, 2000)}

Key Technologies:
${githubContext.languages.join(', ')}

When providing assistance:
1. Reference actual files and paths from the repository
2. Follow the existing code patterns and conventions
3. Consider the technologies and frameworks used
4. Provide specific examples using real file names
5. Suggest changes that align with the current architecture
6. Consider dependencies from package.json when relevant`;

      if (githubContext.packageJson) {
        prompt += `\n\nPackage Information:
- Name: ${githubContext.packageJson.name || 'Unknown'}
- Version: ${githubContext.packageJson.version || 'Unknown'}
- Main dependencies: ${Object.keys(githubContext.packageJson.dependencies || {}).slice(0, 10).join(', ')}`;
      }
    }

    return prompt;
  }

  // Update project GitHub context
  static async updateProjectGitHubContext(projectId: string, githubUrl: string): Promise<void> {
    try {
      await ProjectGitHubService.updateProjectContext(projectId, githubUrl);
    } catch (error) {
      console.error('Failed to update project GitHub context:', error);
      throw error;
    }
  }

  // Get project GitHub context summary
  static getProjectGitHubSummary(projectId: string): string {
    const context = ProjectGitHubService.getProjectContext(projectId);
    
    if (!context) {
      return 'No GitHub repository connected to this project.';
    }

    const { repo, lastUpdated } = context;
    
    let summary = `Connected to GitHub repository: ${repo.owner}/${repo.repo}\n`;
    summary += `Last updated: ${lastUpdated.toLocaleString()}\n\n`;
    summary += `${context.summary}\n\n`;
    
    if (context.readme) {
      summary += `README Preview:\n${context.readme.slice(0, 500)}...\n\n`;
    }
    
    summary += `File Structure:\n${context.structure.slice(0, 1000)}...`;
    
    return summary;
  }

  // Search project repository
  static async searchProjectRepository(
    projectId: string,
    query: string,
    options: {
      includeContent?: boolean;
      maxFiles?: number;
      fileTypes?: string[];
    } = {}
  ): Promise<any[]> {
    const { includeContent = true, maxFiles = 20, fileTypes = [] } = options;

    const results = await ProjectGitHubService.searchRelevantFiles(projectId, query, maxFiles);

    // Filter by file types if specified
    if (fileTypes.length > 0) {
      return results.filter(({ file }) => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        return fileTypes.some(type => ext === type.toLowerCase());
      });
    }

    return results;
  }

  // Test GitHub connection for project
  static async testProjectGitHubConnection(githubUrl: string): Promise<boolean> {
    return ProjectGitHubService.testConnection(githubUrl);
  }

  // Clear project GitHub context
  static clearProjectGitHubContext(projectId: string): void {
    ProjectGitHubService.clearProjectContext(projectId);
  }

  // Get all project contexts
  static getAllProjectContexts(): Map<string, ProjectGitHubContext> {
    return ProjectGitHubService.getAllProjectContexts();
  }
}
