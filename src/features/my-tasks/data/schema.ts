export type TaskStatusValue =
  | 'todo'
  | 'in_progress'
  | 'review'
  | 'completed'
  | 'cancelled'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type TaskCategory =
  | 'administration'
  | 'academic'
  | 'finance'
  | 'technical'
  | 'communication'
  | 'other'

export type Task = {
  id: string
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatusValue
  category: TaskCategory
  dueDate: string
  assignees: string[]
  groupId?: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

export type TaskDraft = {
  title: string
  description: string
  priority: TaskPriority
  category: TaskCategory
  status: TaskStatusValue
  dueDate: string
  assignees: string[]
  groupId?: string
}
