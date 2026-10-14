import {
  apiClient,
  getApiData,
  isBackendEnabled,
  postApiData,
  putApiData,
} from '@/lib/api-client'
import { seedTasks } from './data/data'
import type { Task, TaskDraft, TaskStatusValue } from './data/schema'

const STORAGE_KEY = 'sfera-my-tasks'

function readLocal(): Task[] {
  if (typeof window === 'undefined') return seedTasks
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedTasks
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Task[]) : seedTasks
  } catch {
    return seedTasks
  }
}

function writeLocal(tasks: Task[]) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }
}

type ApiTask = {
  id: string
  title: string
  description: string
  priority: string
  status: string
  category: string
  dueDate: string
  assignees?: string[]
  groupId?: string | null
  createdAt: string
  updatedAt: string
  createdBy: string
}

const mapApiTask = (a: ApiTask): Task => ({
  id: a.id,
  title: a.title,
  description: a.description ?? '',
  priority: (a.priority as Task['priority']) || 'medium',
  status: (a.status as Task['status']) || 'todo',
  category: (a.category as Task['category']) || 'administration',
  dueDate: a.dueDate,
  assignees: a.assignees ?? [],
  groupId: a.groupId ?? undefined,
  createdAt: a.createdAt,
  updatedAt: a.updatedAt,
  createdBy: a.createdBy ?? '',
})

export async function loadTasks(): Promise<Task[]> {
  if (!isBackendEnabled()) return readLocal()
  try {
    const data = await getApiData<ApiTask[]>('/tasks')
    return (Array.isArray(data) ? data : []).map(mapApiTask)
  } catch {
    return readLocal()
  }
}

export async function createTask(draft: TaskDraft): Promise<Task> {
  if (!isBackendEnabled()) {
    const now = new Date().toISOString()
    const next: Task = {
      ...draft,
      id: `TASK-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      createdBy: 'self',
    }
    writeLocal([next, ...readLocal()])
    return next
  }
  const saved = await postApiData<ApiTask>('/tasks', {
    title: draft.title,
    description: draft.description || draft.title,
    priority: draft.priority,
    category: draft.category,
    dueDate: new Date(draft.dueDate).toISOString(),
    assignees: draft.assignees,
    ...(draft.groupId ? { groupId: draft.groupId } : {}),
  })
  return mapApiTask(saved)
}

export async function updateTaskStatus(
  id: string,
  status: TaskStatusValue,
): Promise<Task> {
  if (!isBackendEnabled()) {
    const list = readLocal().map((t) =>
      t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t,
    )
    writeLocal(list)
    return list.find((t) => t.id === id)!
  }
  const saved = await putApiData<ApiTask>(`/tasks/${id}`, { status })
  return mapApiTask(saved)
}

export async function deleteTask(id: string): Promise<void> {
  if (!isBackendEnabled()) {
    writeLocal(readLocal().filter((t) => t.id !== id))
    return
  }
  await apiClient.delete(`/tasks/${id}`)
}
