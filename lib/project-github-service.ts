// GitHub service for project integration

export interface GitHubRepo {
  owner: string;
  repo: string;
  branch?: string;
}

export interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  content?: string;
  size: number;
  sha: string;
}

export interface ProjectGitHubContext {
  repo: GitHubRepo;
  files: GitHubFile[];
  structure: string;
  readme?: string;
  packageJson?: any;
  languages: string[];
  summary: string;
  lastUpdated: Date;
}

export class ProjectGitHubService {
  private static baseUrl = 'https://api.github.com';
  private static projectContexts = new Map<string, ProjectGitHubContext>();

  // Parse GitHub URL to extract owner and repo
  static parseGitHubUrl(url: string): GitHubRepo | null {
    const githubUrlPattern = /^https?:\/\/(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)(?:\/.*)?$/;
    const match = url.trim().match(githubUrlPattern);
    
    if (match) {
      const [, owner, repo] = match;
      const cleanRepo = repo.replace(/\.git$/, "");
      return { owner, repo: cleanRepo };
    }
    
    return null;
  }

  // Get repository information
  static async getRepo(repo: GitHubRepo): Promise<any> {
    const url = `${this.baseUrl}/repos/${repo.owner}/${repo.repo}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${process.env.GITHUB_TOKEN || ''}`,
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API Error: ${response.status}`);
    }

    return response.json();
  }

  // Get repository contents (recursive)
  static async getRepoContents(
    repo: GitHubRepo,
    path: string = '',
    files: GitHubFile[] = []
  ): Promise<GitHubFile[]> {
    const url = `${this.baseUrl}/repos/${repo.owner}/${repo.repo}/contents/${path}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${process.env.GITHUB_TOKEN || ''}`,
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API Error: ${response.status}`);
    }

    const contents = await response.json();

    if (Array.isArray(contents)) {
      for (const item of contents) {
        if (item.type === 'dir') {
          // Skip common directories we don't need for AI context
          if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(item.name)) {
            await this.getRepoContents(repo, item.path, files);
          }
        } else {
          // Only include relevant file types
          const extension = item.name.split('.').pop()?.toLowerCase();
          const relevantExtensions = [
            'ts', 'tsx', 'js', 'jsx', 'py', 'java', 'cpp', 'c', 'h',
            'md', 'txt', 'json', 'yaml', 'yml', 'toml', 'env',
            'css', 'scss', 'html', 'xml', 'sql', 'sh', 'dockerfile'
          ];

          if (relevantExtensions.includes(extension || '')) {
            files.push({
              name: item.name,
              path: item.path,
              type: item.type,
              size: item.size,
              sha: item.sha,
            });
          }
        }
      }
    } else if (contents.type === 'file') {
      files.push({
        name: contents.name,
        path: contents.path,
        type: contents.type,
        size: contents.size,
        sha: contents.sha,
      });
    }

    return files;
  }

  // Get file content
  static async getFileContent(repo: GitHubRepo, path: string): Promise<string> {
    const url = `${this.baseUrl}/repos/${repo.owner}/${repo.repo}/contents/${path}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${process.env.GITHUB_TOKEN || ''}`,
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.content) {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }

    return '';
  }

  // Get repository languages
  static async getRepoLanguages(repo: GitHubRepo): Promise<Record<string, number>> {
    const url = `${this.baseUrl}/repos/${repo.owner}/${repo.repo}/languages`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${process.env.GITHUB_TOKEN || ''}`,
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API Error: ${response.status}`);
    }

    return response.json();
  }

  // Build project GitHub context
  static async buildProjectContext(projectId: string, githubUrl: string): Promise<ProjectGitHubContext> {
    const repo = this.parseGitHubUrl(githubUrl);
    if (!repo) {
      throw new Error('Invalid GitHub URL');
    }

    try {
      // Get repository info
      const repoInfo = await this.getRepo(repo);
      
      // Get all files
      const files = await this.getRepoContents(repo);
      
      // Get languages
      const languages = await this.getRepoLanguages(repo);
      
      // Read key files for context
      let readme: string | undefined;
      let packageJson: any;
      
      const readmeFile = files.find(f => 
        f.name.toLowerCase().includes('readme') || f.name.toLowerCase() === 'readme.md'
      );
      if (readmeFile) {
        readme = await this.getFileContent(repo, readmeFile.path);
      }

      const packageFile = files.find(f => f.name === 'package.json');
      if (packageFile) {
        const content = await this.getFileContent(repo, packageFile.path);
        try {
          packageJson = JSON.parse(content);
        } catch (e) {
          console.warn('Failed to parse package.json');
        }
      }

      // Build file structure tree
      const structure = this.buildFileTree(files);

      // Generate summary
      const summary = this.generateRepoSummary(repoInfo, languages, files, packageJson);

      const context: ProjectGitHubContext = {
        repo,
        files,
        structure,
        readme,
        packageJson,
        languages: Object.keys(languages),
        summary,
        lastUpdated: new Date(),
      };

      // Cache the context
      this.projectContexts.set(projectId, context);

      return context;
    } catch (error) {
      console.error('Error building project GitHub context:', error);
      throw error;
    }
  }

  // Get cached project context
  static getProjectContext(projectId: string): ProjectGitHubContext | undefined {
    return this.projectContexts.get(projectId);
  }

  // Update project context
  static async updateProjectContext(projectId: string, githubUrl: string): Promise<ProjectGitHubContext> {
    return this.buildProjectContext(projectId, githubUrl);
  }

  // Search for relevant files based on query
  static async searchRelevantFiles(
    projectId: string,
    query: string,
    maxFiles: number = 10
  ): Promise<{ file: GitHubFile; content: string }[]> {
    const context = this.projectContexts.get(projectId);
    
    if (!context) {
      throw new Error('GitHub context not found for this project');
    }

    // Simple relevance scoring based on filename and path
    const scoredFiles = context.files.map(file => {
      let score = 0;
      const queryLower = query.toLowerCase();
      const nameLower = file.name.toLowerCase();
      const pathLower = file.path.toLowerCase();
      
      // Exact name match
      if (nameLower === queryLower) score += 100;
      // Name contains query
      if (nameLower.includes(queryLower)) score += 50;
      // Path contains query
      if (pathLower.includes(queryLower)) score += 25;
      
      // File type relevance
      const ext = file.name.split('.').pop()?.toLowerCase();
      const codeExtensions = ['ts', 'tsx', 'js', 'jsx', 'py', 'java', 'cpp', 'c'];
      const docExtensions = ['md', 'txt', 'rst'];
      
      if (codeExtensions.includes(ext || '')) score += 10;
      if (docExtensions.includes(ext || '')) score += 5;
      
      return { ...file, score };
    });

    const relevantFiles = scoredFiles
      .sort((a, b) => (b as any).score - (a as any).score)
      .slice(0, maxFiles) as GitHubFile[];

    // Get file contents
    const results: { file: GitHubFile; content: string }[] = [];
    
    for (const file of relevantFiles) {
      try {
        const content = await this.getFileContent(context.repo, file.path);
        results.push({ file, content });
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`Failed to fetch content for ${file.path}:`, error);
      }
    }
    
    return results;
  }

  // Build file tree structure
  private static buildFileTree(files: GitHubFile[]): string {
    const tree: { [key: string]: any } = {};
    
    files.forEach(file => {
      const parts = file.path.split('/');
      let current = tree;
      
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = index === parts.length - 1 ? file : {};
        }
        current = current[part];
      });
    });

    return this.renderTree(tree, 0);
  }

  // Render tree as string
  private static renderTree(tree: any, depth: number): string {
    let result = '';
    const indent = '  '.repeat(depth);
    
    Object.keys(tree).forEach(key => {
      const item = tree[key];
      if (item.type) {
        result += `${indent}${key} (${item.type})\n`;
      } else {
        result += `${indent}${key}/\n`;
        result += this.renderTree(item, depth + 1);
      }
    });
    
    return result;
  }

  // Generate repository summary
  private static generateRepoSummary(
    repoInfo: any,
    languages: Record<string, number>,
    files: GitHubFile[],
    packageJson: any
  ): string {
    const languageList = Object.keys(languages).sort((a, b) => languages[b] - languages[a]);
    
    let summary = `Repository: ${repoInfo.full_name}\n`;
    summary += `Description: ${repoInfo.description || 'No description'}\n`;
    summary += `Language: ${repoInfo.language}\n`;
    summary += `Stars: ${repoInfo.stargazers_count}, Forks: ${repoInfo.forks_count}\n`;
    summary += `Files: ${files.length} total\n`;
    summary += `Languages: ${languageList.join(', ')}\n`;
    
    if (packageJson) {
      summary += `Package: ${packageJson.name || 'Unknown'} v${packageJson.version || 'Unknown'}\n`;
      if (packageJson.dependencies) {
        const deps = Object.keys(packageJson.dependencies).slice(0, 10);
        summary += `Main dependencies: ${deps.join(', ')}\n`;
      }
    }

    return summary;
  }

  // Test GitHub connection
  static async testConnection(githubUrl: string): Promise<boolean> {
    try {
      const repo = this.parseGitHubUrl(githubUrl);
      if (!repo) return false;
      
      await this.getRepo(repo);
      return true;
    } catch (error) {
      console.error('GitHub connection test failed:', error);
      return false;
    }
  }

  // Clear project context
  static clearProjectContext(projectId: string): void {
    this.projectContexts.delete(projectId);
  }

  // Get all project contexts
  static getAllProjectContexts(): Map<string, ProjectGitHubContext> {
    return this.projectContexts;
  }
}
