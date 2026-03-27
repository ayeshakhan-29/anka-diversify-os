// GitHub API integration for reading repository files and providing context to AI

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

export interface GitHubRepoContext {
  repo: GitHubRepo;
  files: GitHubFile[];
  structure: string;
  readme?: string;
  packageJson?: any;
  languages: string[];
  summary: string;
}

export class GitHubService {
  private static baseUrl = 'https://api.github.com';

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
      // GitHub API returns base64 encoded content
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

  // Build comprehensive repository context for AI
  static async buildRepoContext(repo: GitHubRepo): Promise<GitHubRepoContext> {
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

      return {
        repo,
        files,
        structure,
        readme,
        packageJson,
        languages: Object.keys(languages),
        summary,
      };
    } catch (error) {
      console.error('Error building repo context:', error);
      throw error;
    }
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
    const fileTypes = files.reduce((acc, file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'no-extension';
      acc[ext] = (acc[ext] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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

  // Search for relevant files based on query
  static async searchRelevantFiles(
    repo: GitHubRepo,
    query: string,
    maxFiles: number = 10
  ): Promise<GitHubFile[]> {
    const files = await this.getRepoContents(repo);
    
    // Simple relevance scoring based on filename and path
    const scoredFiles = files.map(file => {
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

    return scoredFiles
      .sort((a, b) => (b as any).score - (a as any).score)
      .slice(0, maxFiles) as GitHubFile[];
  }

  // Get content for multiple files (with rate limiting)
  static async getMultipleFileContents(
    repo: GitHubRepo,
    files: GitHubFile[],
    maxFiles: number = 20
  ): Promise<{ file: GitHubFile; content: string }[]> {
    const limitedFiles = files.slice(0, maxFiles);
    const results: { file: GitHubFile; content: string }[] = [];
    
    // Add delay between requests to avoid rate limiting
    for (const file of limitedFiles) {
      try {
        const content = await this.getFileContent(repo, file.path);
        results.push({ file, content });
        
        // Small delay to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`Failed to fetch content for ${file.path}:`, error);
      }
    }
    
    return results;
  }
}
