import type { Project, Task, TeamMember, Sprint, Document, GitCommit, GitBranch, Notification, User, Rule, Department } from './types'

export const teamMembers: TeamMember[] = [
  { id: '1', name: 'Alex Chen', email: 'alex@anka.io', role: 'Lead Developer', avatar: '/avatars/alex.jpg', department: 'Development', status: 'online' },
  { id: '2', name: 'Sarah Miller', email: 'sarah@anka.io', role: 'Product Manager', avatar: '/avatars/sarah.jpg', department: 'Product', status: 'online' },
  { id: '3', name: 'James Wilson', email: 'james@anka.io', role: 'UI/UX Designer', avatar: '/avatars/james.jpg', department: 'Design', status: 'away' },
  { id: '4', name: 'Emily Davis', email: 'emily@anka.io', role: 'Backend Developer', avatar: '/avatars/emily.jpg', department: 'Development', status: 'online' },
  { id: '5', name: 'Michael Brown', email: 'michael@anka.io', role: 'DevOps Engineer', avatar: '/avatars/michael.jpg', department: 'Development', status: 'offline' },
  { id: '6', name: 'Lisa Wang', email: 'lisa@anka.io', role: 'Marketing Lead', avatar: '/avatars/lisa.jpg', department: 'Marketing', status: 'online' },
]

export const tasks: Task[] = [
  { id: 't1', title: 'Design system architecture', description: 'Create the foundational design system', status: 'done', priority: 'high', assignee: teamMembers[2], projectId: 'p1', phase: 'product-modeling', dueDate: '2026-03-20', createdAt: '2026-03-01', tags: ['design', 'architecture'] },
  { id: 't2', title: 'Implement user authentication', description: 'Set up OAuth and JWT authentication', status: 'in-progress', priority: 'critical', assignee: teamMembers[3], projectId: 'p1', phase: 'development', dueDate: '2026-03-28', createdAt: '2026-03-15', tags: ['backend', 'security'] },
  { id: 't3', title: 'Build dashboard components', description: 'Create reusable dashboard UI components', status: 'in-progress', priority: 'high', assignee: teamMembers[0], projectId: 'p1', phase: 'development', dueDate: '2026-03-30', createdAt: '2026-03-18', tags: ['frontend', 'ui'] },
  { id: 't4', title: 'API documentation', description: 'Write comprehensive API documentation', status: 'todo', priority: 'medium', assignee: teamMembers[4], projectId: 'p1', phase: 'development', dueDate: '2026-04-05', createdAt: '2026-03-20', tags: ['docs', 'api'] },
  { id: 't5', title: 'Performance optimization', description: 'Optimize database queries and caching', status: 'backlog', priority: 'medium', assignee: teamMembers[3], projectId: 'p1', phase: 'development', dueDate: '2026-04-10', createdAt: '2026-03-22', tags: ['backend', 'performance'] },
  { id: 't6', title: 'Marketing website design', description: 'Design landing page and marketing materials', status: 'in-progress', priority: 'high', assignee: teamMembers[2], projectId: 'p2', phase: 'marketing', dueDate: '2026-04-01', createdAt: '2026-03-10', tags: ['design', 'marketing'] },
  { id: 't7', title: 'Social media campaign', description: 'Plan and execute social media launch', status: 'todo', priority: 'medium', assignee: teamMembers[5], projectId: 'p2', phase: 'marketing', dueDate: '2026-04-15', createdAt: '2026-03-25', tags: ['marketing', 'social'] },
  { id: 't8', title: 'User research interviews', description: 'Conduct user interviews for feedback', status: 'review', priority: 'high', assignee: teamMembers[1], projectId: 'p3', phase: 'product-modeling', dueDate: '2026-03-25', createdAt: '2026-03-05', tags: ['research', 'ux'] },
]

export const projects: Project[] = [
  {
    id: 'p1',
    name: 'Anka Platform v2.0',
    description: 'Next-generation project management platform with AI capabilities',
    phase: 'development',
    progress: 65,
    team: [teamMembers[0], teamMembers[1], teamMembers[2], teamMembers[3]],
    startDate: '2026-02-01',
    dueDate: '2026-05-15',
    tasks: tasks.filter(t => t.projectId === 'p1'),
    priority: 'critical',
    status: 'active',
  },
  {
    id: 'p2',
    name: 'Marketing Campaign Q2',
    description: 'Quarterly marketing campaign for product launch',
    phase: 'marketing',
    progress: 40,
    team: [teamMembers[5], teamMembers[2]],
    startDate: '2026-03-01',
    dueDate: '2026-04-30',
    tasks: tasks.filter(t => t.projectId === 'p2'),
    priority: 'high',
    status: 'active',
  },
  {
    id: 'p3',
    name: 'Mobile App Redesign',
    description: 'Complete redesign of mobile application',
    phase: 'product-modeling',
    progress: 25,
    team: [teamMembers[1], teamMembers[2]],
    startDate: '2026-03-15',
    dueDate: '2026-06-30',
    tasks: tasks.filter(t => t.projectId === 'p3'),
    priority: 'medium',
    status: 'active',
  },
  {
    id: 'p4',
    name: 'Analytics Dashboard',
    description: 'Real-time analytics and reporting dashboard',
    phase: 'completed',
    progress: 100,
    team: [teamMembers[0], teamMembers[3]],
    startDate: '2025-11-01',
    dueDate: '2026-02-28',
    tasks: [],
    priority: 'high',
    status: 'completed',
  },
]

export const sprints: Sprint[] = [
  {
    id: 's1',
    name: 'Sprint 12 - Auth & Security',
    projectId: 'p1',
    startDate: '2026-03-18',
    endDate: '2026-04-01',
    status: 'active',
    tasks: tasks.filter(t => ['t2', 't3', 't4'].includes(t.id)),
    velocity: 34,
  },
  {
    id: 's2',
    name: 'Sprint 11 - Core Features',
    projectId: 'p1',
    startDate: '2026-03-04',
    endDate: '2026-03-18',
    status: 'completed',
    tasks: tasks.filter(t => ['t1'].includes(t.id)),
    velocity: 28,
  },
]

export const documents: Document[] = [
  { id: 'd1', title: 'Product Requirements Document', type: 'doc', projectId: 'p1', author: teamMembers[1], lastModified: '2026-03-24', size: '2.4 MB' },
  { id: 'd2', title: 'API Specifications', type: 'doc', projectId: 'p1', author: teamMembers[0], lastModified: '2026-03-23', size: '1.8 MB' },
  { id: 'd3', title: 'Design System v2', type: 'design', projectId: 'p1', author: teamMembers[2], lastModified: '2026-03-25', size: '15.2 MB' },
  { id: 'd4', title: 'Sprint Planning Template', type: 'spreadsheet', author: teamMembers[1], lastModified: '2026-03-20', size: '340 KB' },
  { id: 'd5', title: 'Q2 Marketing Presentation', type: 'presentation', projectId: 'p2', author: teamMembers[5], lastModified: '2026-03-22', size: '8.5 MB' },
]

export const gitCommits: GitCommit[] = [
  { id: 'c1', hash: 'a1b2c3d', message: 'feat: implement user authentication flow', author: teamMembers[3], branch: 'feature/auth', timestamp: '2026-03-26T10:30:00', additions: 245, deletions: 12 },
  { id: 'c2', hash: 'e4f5g6h', message: 'fix: resolve dashboard rendering issue', author: teamMembers[0], branch: 'main', timestamp: '2026-03-26T09:15:00', additions: 18, deletions: 42 },
  { id: 'c3', hash: 'i7j8k9l', message: 'docs: update API documentation', author: teamMembers[4], branch: 'docs/api', timestamp: '2026-03-25T16:45:00', additions: 156, deletions: 23 },
  { id: 'c4', hash: 'm0n1o2p', message: 'refactor: optimize database queries', author: teamMembers[3], branch: 'main', timestamp: '2026-03-25T14:20:00', additions: 89, deletions: 112 },
  { id: 'c5', hash: 'q3r4s5t', message: 'style: update component styling', author: teamMembers[0], branch: 'feature/ui-refresh', timestamp: '2026-03-25T11:00:00', additions: 67, deletions: 34 },
]

export const gitBranches: GitBranch[] = [
  { name: 'main', isDefault: true, lastCommit: '2026-03-26T09:15:00', author: teamMembers[0] },
  { name: 'feature/auth', isDefault: false, lastCommit: '2026-03-26T10:30:00', author: teamMembers[3] },
  { name: 'feature/ui-refresh', isDefault: false, lastCommit: '2026-03-25T11:00:00', author: teamMembers[0] },
  { name: 'docs/api', isDefault: false, lastCommit: '2026-03-25T16:45:00', author: teamMembers[4] },
  { name: 'hotfix/security', isDefault: false, lastCommit: '2026-03-24T08:30:00', author: teamMembers[4] },
]

export const notifications: Notification[] = [
  { id: 'n1', title: 'New Comment', message: 'Sarah commented on your task "Build dashboard components"', type: 'info', read: false, timestamp: '2026-03-26T10:45:00', link: '/development/projects/p1' },
  { id: 'n2', title: 'Sprint Completed', message: 'Sprint 11 has been marked as completed', type: 'success', read: false, timestamp: '2026-03-26T09:00:00', link: '/development/sprints' },
  { id: 'n3', title: 'Due Date Approaching', message: 'Task "Implement user authentication" is due in 2 days', type: 'warning', read: false, timestamp: '2026-03-26T08:00:00', link: '/development/projects/p1' },
  { id: 'n4', title: 'Build Failed', message: 'CI/CD pipeline failed for branch feature/auth', type: 'error', read: true, timestamp: '2026-03-25T18:30:00', link: '/development/git' },
  { id: 'n5', title: 'Team Member Added', message: 'Michael Brown joined the Anka Platform v2.0 project', type: 'info', read: true, timestamp: '2026-03-25T14:00:00' },
]

export const users: User[] = [
  { id: 'u1', name: 'Alex Chen', email: 'alex@anka.io', role: 'admin', department: 'Development', avatar: '/avatars/alex.jpg', status: 'active', lastActive: '2026-03-26T11:00:00', createdAt: '2024-01-15' },
  { id: 'u2', name: 'Sarah Miller', email: 'sarah@anka.io', role: 'manager', department: 'Product', avatar: '/avatars/sarah.jpg', status: 'active', lastActive: '2026-03-26T10:30:00', createdAt: '2024-02-20' },
  { id: 'u3', name: 'James Wilson', email: 'james@anka.io', role: 'designer', department: 'Design', avatar: '/avatars/james.jpg', status: 'active', lastActive: '2026-03-26T09:45:00', createdAt: '2024-03-10' },
  { id: 'u4', name: 'Emily Davis', email: 'emily@anka.io', role: 'developer', department: 'Development', avatar: '/avatars/emily.jpg', status: 'active', lastActive: '2026-03-26T11:15:00', createdAt: '2024-04-05' },
  { id: 'u5', name: 'Michael Brown', email: 'michael@anka.io', role: 'developer', department: 'Development', avatar: '/avatars/michael.jpg', status: 'inactive', lastActive: '2026-03-24T16:00:00', createdAt: '2024-05-12' },
  { id: 'u6', name: 'Lisa Wang', email: 'lisa@anka.io', role: 'manager', department: 'Marketing', avatar: '/avatars/lisa.jpg', status: 'active', lastActive: '2026-03-26T10:00:00', createdAt: '2024-06-01' },
  { id: 'u7', name: 'David Kim', email: 'david@anka.io', role: 'viewer', department: 'Sales', avatar: '/avatars/david.jpg', status: 'suspended', lastActive: '2026-03-20T09:00:00', createdAt: '2024-07-15' },
]

export const rules: Rule[] = [
  { id: 'r1', name: 'Auto-assign critical tasks', description: 'Automatically assign critical priority tasks to team leads', category: 'workflow', enabled: true, conditions: ['priority == critical', 'assignee == null'], actions: ['assign to team lead', 'send notification'], createdBy: 'Alex Chen', createdAt: '2026-01-15' },
  { id: 'r2', name: 'Due date reminder', description: 'Send reminder 24 hours before task due date', category: 'notification', enabled: true, conditions: ['due_date - now <= 24h'], actions: ['send email', 'push notification'], createdBy: 'Sarah Miller', createdAt: '2026-02-01' },
  { id: 'r3', name: 'Restrict project deletion', description: 'Only admins can delete projects with active tasks', category: 'access', enabled: true, conditions: ['action == delete', 'project.tasks > 0'], actions: ['require admin role', 'log action'], createdBy: 'Alex Chen', createdAt: '2026-02-10' },
  { id: 'r4', name: 'Two-factor authentication', description: 'Require 2FA for all admin users', category: 'security', enabled: true, conditions: ['user.role == admin'], actions: ['require 2fa', 'block if not enabled'], createdBy: 'Alex Chen', createdAt: '2026-01-01' },
  { id: 'r5', name: 'Sprint auto-close', description: 'Automatically close sprint when all tasks are done', category: 'workflow', enabled: false, conditions: ['sprint.tasks.all.status == done'], actions: ['close sprint', 'generate report'], createdBy: 'Sarah Miller', createdAt: '2026-03-01' },
]

export const departments: Department[] = [
  { id: 'dep1', name: 'Development', description: 'Software development and engineering', head: teamMembers[0], members: [teamMembers[0], teamMembers[3], teamMembers[4]], projects: projects.filter(p => p.phase === 'development') },
  { id: 'dep2', name: 'Product', description: 'Product management and strategy', head: teamMembers[1], members: [teamMembers[1]], projects: projects.filter(p => p.phase === 'product-modeling') },
  { id: 'dep3', name: 'Design', description: 'UI/UX design and branding', head: teamMembers[2], members: [teamMembers[2]], projects: [] },
  { id: 'dep4', name: 'Marketing', description: 'Marketing and communications', head: teamMembers[5], members: [teamMembers[5]], projects: projects.filter(p => p.phase === 'marketing') },
]
