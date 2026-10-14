import { useEffect, useMemo, useState } from 'react'
import {
  CalendarCheck2,
  CheckCircle2,
  Filter,
  Flame,
  LayoutGrid,
  ListTodo,
  Plus,
  Search,
  Sparkles,
  Timer,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/context/language-provider'
import { getPrimaryRole } from '@/lib/rbac'
import { useAuthStore } from '@/stores/auth-store'
import { TaskCard } from './components/task-card'
import { TaskDetailDialog } from './components/task-detail-dialog'
import { NewTaskDialog } from './components/new-task-dialog'
import {
  STATUS_COLUMNS,
  countOverdue,
  statusDot,
  statusLabels,
} from './data/data'
import type { Task, TaskDraft, TaskStatusValue } from './data/schema'
import {
  createTask,
  deleteTask,
  loadTasks,
  updateTaskStatus,
} from './tasks-api'

export function MyTasksPage() {
  const { language } = useLanguage()
  const en = language === 'en'
  const role = getPrimaryRole(useAuthStore((s) => s.auth.user?.role))

  const isStudent = role === 'Student'
  const canCreate = ['Super Admin', 'Admin', 'Manager', 'Teacher'].includes(role)
  const canManage = ['Super Admin', 'Admin', 'Manager'].includes(role)

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [newOpen, setNewOpen] = useState(false)
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const detailOpen = Boolean(detailTask)

  useEffect(() => {
    let active = true
    loadTasks().then((data) => {
      if (active) {
        setTasks(data)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const labels = statusLabels(en)

  const filtered = useMemo(
    () =>
      tasks.filter((t) => {
        if (selectedCategory !== 'all' && t.category !== selectedCategory) return false
        if (selectedPriority !== 'all' && t.priority !== selectedPriority) return false
        if (!query.trim()) return true
        const q = query.toLowerCase()
        return (
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.includes(q) ||
          t.assignees.some((a) => a.toLowerCase().includes(q))
        )
      }),
    [tasks, query, selectedCategory, selectedPriority],
  )

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      done: tasks.filter((t) => t.status === 'completed').length,
      overdue: countOverdue(tasks),
    }
  }, [tasks])

  const handleCreate = async (draft: TaskDraft) => {
    const saved = await createTask(draft)
    setTasks((prev) => [saved, ...prev])
  }

  const handleStatus = async (status: TaskStatusValue) => {
    if (!detailTask) return
    const saved = await updateTaskStatus(detailTask.id, status)
    setTasks((prev) => prev.map((t) => (t.id === saved.id ? saved : t)))
    setDetailTask(saved)
  }

  const handleDelete = async (id: string) => {
    await deleteTask(id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
    setDetailTask(null)
  }

  const statCards: Array<{
    label: string
    value: number
    icon: React.ReactNode
    badgeBg: string
    badgeText: string
    cardBorder: string
    subText: string
  }> = [
    {
      label: en ? 'Total Tasks' : 'Jami vazifalar',
      value: stats.total,
      icon: <ListTodo className="size-5 text-indigo-600 dark:text-indigo-400" />,
      badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
      badgeText: 'text-indigo-600 dark:text-indigo-400',
      cardBorder: 'border-indigo-100 dark:border-indigo-950/50',
      subText: en ? 'Across all boards' : 'Barcha taxtalar bo‘yicha',
    },
    {
      label: en ? 'In Progress' : 'Jarayonda',
      value: stats.inProgress,
      icon: <Flame className="size-5 text-sky-600 dark:text-sky-400" />,
      badgeBg: 'bg-sky-50 dark:bg-sky-950/40',
      badgeText: 'text-sky-600 dark:text-sky-400',
      cardBorder: 'border-sky-100 dark:border-sky-950/50',
      subText: en ? 'Currently active' : 'Hozir bajarilmoqda',
    },
    {
      label: en ? 'Completed' : 'Bajarilgan',
      value: stats.done,
      icon: <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />,
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
      badgeText: 'text-emerald-600 dark:text-emerald-400',
      cardBorder: 'border-emerald-100 dark:border-emerald-950/50',
      subText: en ? 'Finished goals' : 'Muvaffaqiyatli yakunlangan',
    },
    {
      label: en ? 'Overdue' : 'Muddati o‘tgan',
      value: stats.overdue,
      icon: <Timer className="size-5 text-rose-600 dark:text-rose-400" />,
      badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
      badgeText: 'text-rose-600 dark:text-rose-400',
      cardBorder: 'border-rose-100 dark:border-rose-950/50',
      subText: en ? 'Needs attention' : 'Kechikkan vazifalar',
    },
  ]

  const columnHeaders: Record<TaskStatusValue, { title: string; countColor: string; bgTone: string }> = {
    todo: {
      title: labels.todo,
      countColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      bgTone: 'bg-slate-500/5',
    },
    in_progress: {
      title: labels.in_progress,
      countColor: 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
      bgTone: 'bg-sky-500/5',
    },
    review: {
      title: labels.review,
      countColor: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
      bgTone: 'bg-violet-500/5',
    },
    completed: {
      title: labels.completed,
      countColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
      bgTone: 'bg-emerald-500/5',
    },
    cancelled: {
      title: labels.cancelled,
      countColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      bgTone: 'bg-slate-500/5',
    },
  }

  return (
    <>
      <Header fixed>
        <div className="relative me-auto w-full max-w-sm">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={en ? 'Search tasks or assignees...' : 'Vazifa yoki xodimni qidirish...'}
            className="ps-9 rounded-xl border-border/80 bg-background/80 shadow-xs"
          />
        </div>
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>

      <Main className="flex flex-1 flex-col gap-6 py-6 sm:px-6">
        {/* Hero Header Section */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <LayoutGrid className="size-4" />
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {en ? 'My Tasks' : 'Mening vazifalarim'}
              </h2>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
              <CalendarCheck2 className="size-4 text-primary/70" />
              {isStudent
                ? en
                  ? 'Personal workspace to track, prioritize and accomplish assignments.'
                  : 'Sizga yuklatilgan topshiriq va amaliy vazifalarni boshqarish maydoni.'
                : role === 'Teacher'
                  ? en
                    ? 'Manage your pedagogical goals, student assignments and curriculum reviews.'
                    : 'O‘z o‘quv rejalaringiz va o‘quvchilar topshiriqlarini qulay nazorat qiling.'
                  : en
                    ? 'Oversee tasks across departments, assign work and keep progress on schedule.'
                    : 'Akademiya jarayonlari bo‘yicha vazifalar taqsimoti va ularning bajarilishi.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {canCreate && (
              <Button
                onClick={() => setNewOpen(true)}
                className="rounded-xl shadow-sm shadow-primary/20 transition-all hover:shadow-md"
              >
                <Plus className="me-1.5 size-4" />
                {en ? 'New Task' : 'Yangi vazifa'}
              </Button>
            )}
          </div>
        </div>

        {/* Ovra-Style Summary Metric Cards */}
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => (
            <Card
              key={s.label}
              className={`rounded-2xl border ${s.cardBorder} bg-card/90 shadow-xs transition-all hover:shadow-sm dark:bg-slate-900/60`}
            >
              <CardContent className="flex items-center justify-between p-4 sm:p-5">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {s.value}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground/80">{s.subText}</p>
                </div>
                <div className={`flex size-11 items-center justify-center rounded-2xl ${s.badgeBg}`}>
                  {s.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Filter Bar (Categories & Priorities) */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/60 p-2 sm:px-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 pe-2 text-xs font-semibold text-muted-foreground">
              <Filter className="size-3.5" />
              {en ? 'Category:' : 'Kategoriya:'}
            </span>
            {[
              { id: 'all', label: en ? 'All' : 'Barchasi' },
              { id: 'academic', label: en ? 'Academic' : 'O‘quv' },
              { id: 'finance', label: en ? 'Finance' : 'Moliya' },
              { id: 'administration', label: en ? 'Admin' : 'Boshqaruv' },
              { id: 'technical', label: en ? 'Technical' : 'Texnik' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`}
              >
                {cat.label}
              </button>
            ))}

            <span className="ms-2 hidden h-4 w-px bg-border/80 sm:inline-block" />

            <span className="flex items-center gap-1 ps-1 pe-2 text-xs font-semibold text-muted-foreground">
              {en ? 'Priority:' : 'Muhimlik:'}
            </span>
            {[
              { id: 'all', label: en ? 'All' : 'Barchasi' },
              { id: 'high', label: en ? 'High' : 'Yuqori' },
              { id: 'medium', label: en ? 'Medium' : 'O‘rta' },
              { id: 'low', label: en ? 'Low' : 'Past' },
            ].map((pr) => (
              <button
                key={pr.id}
                type="button"
                onClick={() => setSelectedPriority(pr.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  selectedPriority === pr.id
                    ? 'bg-primary/90 text-primary-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`}
              >
                {pr.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-medium">{filtered.length}</span>
            <span>{en ? 'tasks shown' : 'ta vazifa'}</span>
          </div>
        </div>

        {/* Kanban Task Columns (Ovra Dribbble board view) */}
        {loading ? (
          <div className="grid gap-4 py-8 text-center text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
            {STATUS_COLUMNS.map((s) => (
              <div
                key={s}
                className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 p-8"
              >
                <span className="size-2 animate-ping rounded-full bg-primary/60 mb-2" />
                {en ? 'Loading tasks...' : 'Yuklanmoqda...'}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STATUS_COLUMNS.map((s) => {
              const items = filtered.filter((t) => t.status === s)
              const colInfo = columnHeaders[s]

              return (
                <div
                  key={s}
                  className={`flex flex-col gap-3 rounded-2xl border border-border/60 ${colInfo.bgTone} p-3 sm:p-3.5`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2">
                      <span className={`size-2.5 rounded-full ${statusDot(s)}`} />
                      <span className="text-sm font-bold tracking-tight text-foreground">
                        {colInfo.title}
                      </span>
                    </div>
                    <span
                      className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-bold ${colInfo.countColor}`}
                    >
                      {items.length}
                    </span>
                  </div>

                  {/* Task Card Items */}
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-card/40 py-10 text-center">
                      <Sparkles className="size-5 text-muted-foreground/40 mb-1.5" />
                      <p className="text-xs font-medium text-muted-foreground">
                        {en ? 'No tasks here' : 'Hozircha vazifa yo‘q'}
                      </p>
                      <p className="text-[11px] text-muted-foreground/60">
                        {en ? 'Drop or create a task' : 'Yangi vazifa qo‘shing'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {items.map((task) => (
                        <TaskCard key={task.id} task={task} onOpen={setDetailTask} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Main>

      <NewTaskDialog open={newOpen} onOpenChange={setNewOpen} onSave={handleCreate} />
      <TaskDetailDialog
        task={detailTask}
        open={detailOpen}
        onOpenChange={(o) => {
          if (!o) setDetailTask(null)
        }}
        isStudent={isStudent}
        canManage={canManage}
        onStatusChange={handleStatus}
        onDelete={handleDelete}
      />
    </>
  )
}
