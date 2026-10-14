import React, { useEffect, useState } from 'react'
import {
  getApiData,
  isBackendEnabled,
  postApiData,
  putApiData,
  apiClient,
} from '@/lib/api-client'
import useDialogState from '@/hooks/use-dialog-state'
import { type Task } from '../data/schema'
import { tasks as initialTasks } from '../data/tasks'

type TasksDialogType = 'create' | 'update' | 'delete' | 'import'
const TASKS_STORAGE_KEY = 'sfera-crm-tasks'

type TasksContextType = {
  open: TasksDialogType | null
  setOpen: (str: TasksDialogType | null) => void
  currentRow: Task | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Task | null>>
  tasks: Task[]
  createTask: (task: Omit<Task, 'id'>) => Task
  updateTask: (id: string, task: Omit<Task, 'id'>) => void
  deleteTask: (id: string) => void
  deleteTasks: (ids: string[]) => void
  updateTasks: (ids: string[], changes: Partial<Omit<Task, 'id'>>) => void
}

const TasksContext = React.createContext<TasksContextType | null>(null)

function readTasks(): Task[] {
  if (typeof window === 'undefined') return initialTasks as Task[]
  try {
    const saved = window.localStorage.getItem(TASKS_STORAGE_KEY)
    if (!saved) return initialTasks as Task[]
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : (initialTasks as Task[])
  } catch {
    return initialTasks as Task[]
  }
}

type ApiTask = {
  id: string
  title: string
  status: string
  category: string
  priority: string
  assignees?: string[]
  description?: string
  dueDate?: string
}

const fromApiTask = (item: ApiTask): Task => ({
  id: item.id,
  title: item.title,
  status:
    item.status === 'in_progress'
      ? 'in progress'
      : item.status === 'completed'
        ? 'done'
        : item.status,
  label:
    item.category === 'administration'
      ? 'documentation'
      : item.category === 'academic'
        ? 'feature'
        : 'bug',
  priority: item.priority === 'urgent' ? 'critical' : item.priority,
  assignee: Array.isArray(item.assignees) ? item.assignees[0] : '',
  description: item.description,
  dueDate: item.dueDate?.slice(0, 10),
})
const toApiTask = (task: Partial<Task>) => ({
  title: task.title,
  description: task.description || task.title,
  status:
    task.status === 'in progress'
      ? 'in_progress'
      : task.status === 'done'
        ? 'completed'
        : task.status,
  category:
    task.label === 'documentation'
      ? 'administration'
      : task.label === 'feature'
        ? 'academic'
        : 'technical',
  priority: task.priority === 'critical' ? 'urgent' : task.priority,
  dueDate: task.dueDate
    ? new Date(task.dueDate).toISOString()
    : new Date(Date.now() + 7 * 86400000).toISOString(),
  assignees: task.assignee ? [task.assignee] : [],
})

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<TasksDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Task | null>(null)
  const [tasks, setTasks] = useState<Task[]>(readTasks)
  useEffect(() => {
    if (!isBackendEnabled()) return
    void getApiData<ApiTask[]>('/tasks')
      .then((items) => setTasks(items.map(fromApiTask)))
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!isBackendEnabled())
      window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  const createTask = (task: Omit<Task, 'id'>) => {
    const next: Task = { ...task, id: `TASK-${Date.now()}` }
    setTasks((current) => [next, ...current])
    if (isBackendEnabled())
      void postApiData<ApiTask>('/tasks', toApiTask(next))
        .then((saved) =>
          setTasks((current) =>
            current.map((item) =>
              item.id === next.id ? fromApiTask(saved) : item
            )
          )
        )
        .catch(() => undefined)
    return next
  }

  const updateTask = (id: string, task: Omit<Task, 'id'>) => {
    setTasks((current) =>
      current.map((item) => (item.id === id ? { ...item, ...task, id } : item))
    )
    if (isBackendEnabled())
      void putApiData<ApiTask>(`/tasks/${id}`, toApiTask({ ...task, id }))
        .then((saved) =>
          setTasks((current) =>
            current.map((item) => (item.id === id ? fromApiTask(saved) : item))
          )
        )
        .catch(() => undefined)
  }

  const deleteTask = (id: string) => {
    setTasks((current) => current.filter((item) => item.id !== id))
    if (isBackendEnabled())
      void apiClient.delete(`/tasks/${id}`).catch(() => undefined)
  }

  const deleteTasks = (ids: string[]) => {
    const selected = new Set(ids)
    setTasks((current) => current.filter((item) => !selected.has(item.id)))
  }

  const updateTasks = (ids: string[], changes: Partial<Omit<Task, 'id'>>) => {
    const selected = new Set(ids)
    setTasks((current) =>
      current.map((item) =>
        selected.has(item.id) ? { ...item, ...changes } : item
      )
    )
  }

  return (
    <TasksContext
      value={{
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        tasks,
        createTask,
        updateTask,
        deleteTask,
        deleteTasks,
        updateTasks,
      }}
    >
      {children}
    </TasksContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTasks = () => {
  const tasksContext = React.useContext(TasksContext)
  if (tasksContext) return tasksContext
  return {
    open: null,
    setOpen: () => undefined,
    currentRow: null,
    setCurrentRow: () => undefined,
    tasks: initialTasks as Task[],
    createTask: (task: Omit<Task, 'id'>) => ({
      ...task,
      id: `TASK-${Date.now()}`,
    }),
    updateTask: () => undefined,
    deleteTask: () => undefined,
    deleteTasks: () => undefined,
    updateTasks: () => undefined,
  }
}

export { TASKS_STORAGE_KEY }
