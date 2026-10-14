import type {
  Task,
  TaskCategory,
  TaskPriority,
  TaskStatusValue,
} from './schema'

export const STATUS_COLUMNS: TaskStatusValue[] = [
  'todo',
  'in_progress',
  'review',
  'completed',
]

export const statusLabels = (en: boolean): Record<TaskStatusValue, string> => ({
  todo: en ? 'To Do' : 'Bajarilishi kerak',
  in_progress: en ? 'In Progress' : 'Jarayonda',
  review: en ? 'In Review' : 'Tekshiruvda',
  completed: en ? 'Done' : 'Bajarilgan',
  cancelled: en ? 'Cancelled' : 'Bekor qilingan',
})

export const priorityLabels = (en: boolean): Record<TaskPriority, string> => ({
  low: en ? 'Low' : 'Past',
  medium: en ? 'Medium' : 'O‘rta',
  high: en ? 'High' : 'Yuqori',
  urgent: en ? 'Urgent' : 'Shoshilinch',
})

export const categoryLabels = (en: boolean): Record<TaskCategory, string> => ({
  administration: en ? 'Administration' : 'Boshqaruv',
  academic: en ? 'Academic' : 'O‘quv',
  finance: en ? 'Finance' : 'Moliya',
  technical: en ? 'Technical' : 'Texnik',
  communication: en ? 'Communication' : 'Kommunikatsiya',
  other: en ? 'Other' : 'Boshqa',
})

export const categoryStyles: Record<
  TaskCategory,
  { bg: string; text: string; border: string }
> = {
  academic: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200/60 dark:border-indigo-800/40',
  },
  finance: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200/60 dark:border-emerald-800/40',
  },
  administration: {
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-200/60 dark:border-sky-800/40',
  },
  technical: {
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-200/60 dark:border-violet-800/40',
  },
  communication: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200/60 dark:border-amber-800/40',
  },
  other: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
  },
}

export const priorityBadgeStyles: Record<
  TaskPriority,
  { bg: string; text: string; dot: string }
> = {
  urgent: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40',
    text: 'text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
  high: {
    bg: 'bg-orange-50 text-orange-700 border-orange-200/70 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/40',
    text: 'text-orange-600 dark:text-orange-400',
    dot: 'bg-orange-500',
  },
  medium: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  low: {
    bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    text: 'text-slate-600 dark:text-slate-400',
    dot: 'bg-emerald-500',
  },
}

export const priorityDot = (p: TaskPriority) => {
  return priorityBadgeStyles[p]?.dot ?? 'bg-slate-400'
}

export const statusDot = (s: TaskStatusValue) => {
  switch (s) {
    case 'in_progress':
      return 'bg-sky-500 shadow-sm shadow-sky-500/50'
    case 'review':
      return 'bg-violet-500 shadow-sm shadow-violet-500/50'
    case 'completed':
      return 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
    default:
      return 'bg-slate-400'
  }
}

export const isOverdue = (task: Task) =>
  task.status !== 'completed' &&
  task.status !== 'cancelled' &&
  task.dueDate &&
  new Date(task.dueDate).getTime() < Date.now()

export const countOverdue = (tasks: Task[]) =>
  tasks.filter(
    (t) =>
      t.status !== 'completed' &&
      t.status !== 'cancelled' &&
      t.dueDate &&
      new Date(t.dueDate).getTime() < Date.now(),
  ).length

const daysFromNow = (days: number) =>
  new Date(Date.now() + days * 86400000).toISOString()

export const seedTasks: Task[] = [
  {
    id: 'task-seed-1',
    title: 'React amaliyot vazifasi: Custom Hooks',
    description:
      'useDebounce va useLocalStorage custom hooklarini yozing va unit-testlar bilan to‘liq qamrab oling.',
    priority: 'high',
    status: 'in_progress',
    category: 'academic',
    dueDate: daysFromNow(2),
    assignees: ['Azizbek', 'Malika'],
    createdBy: 'teacher-1',
    createdAt: daysFromNow(-3),
    updatedAt: daysFromNow(-1),
  },
  {
    id: 'task-seed-2',
    title: 'Oylik moliyaviy hisobot tayyorlash',
    description:
      'Sentabr oyi uchun daromad/xarajat hisobotini tuzib, rahbariyatga yuborish.',
    priority: 'urgent',
    status: 'todo',
    category: 'finance',
    dueDate: daysFromNow(1),
    assignees: ['Nodira'],
    createdBy: 'admin-1',
    createdAt: daysFromNow(-2),
    updatedAt: daysFromNow(-2),
  },
  {
    id: 'task-seed-3',
    title: 'Yangi guruh uchun dars jadvali yaratish',
    description: 'FD-03 guruhi uchun dars jadvali va auditoriya biriktirish.',
    priority: 'medium',
    status: 'review',
    category: 'administration',
    dueDate: daysFromNow(4),
    assignees: ['Temurbek', 'Bobur'],
    createdBy: 'admin-1',
    createdAt: daysFromNow(-5),
    updatedAt: daysFromNow(-1),
  },
  {
    id: 'task-seed-4',
    title: 'O‘quvchilar davomatini ma’lumotlar bazasiga kiritish',
    description: 'Haftalik davomatni tizimga to‘liq kiriting va tekshiring.',
    priority: 'low',
    status: 'completed',
    category: 'communication',
    dueDate: daysFromNow(-1),
    assignees: ['Jasurbek'],
    createdBy: 'teacher-1',
    createdAt: daysFromNow(-8),
    updatedAt: daysFromNow(-1),
  },
]
