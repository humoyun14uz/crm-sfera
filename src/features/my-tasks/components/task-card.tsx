import { Calendar, CheckCircle2, Clock, Pencil, Save, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/context/language-provider'
import {
  categoryLabels,
  categoryStyles,
  isOverdue,
  priorityBadgeStyles,
  priorityLabels,
} from '../data/data'
import type { Task } from '../data/schema'

type TaskCardProps = {
  task: Task
  onOpen: (task: Task) => void
}

const getInitials = (name: string) => {
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const avatarColors = [
  'bg-emerald-500 text-white',
  'bg-indigo-500 text-white',
  'bg-sky-500 text-white',
  'bg-amber-500 text-white',
  'bg-purple-500 text-white',
  'bg-rose-500 text-white',
]

export function TaskCard({ task, onOpen }: TaskCardProps) {
  const { language } = useLanguage()
  const en = language === 'en'
  const overdue = isOverdue(task)
  const isCompleted = task.status === 'completed'

  const formatDate = (iso: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleDateString(en ? 'en-US' : 'uz-UZ', {
      month: 'short',
      day: 'numeric',
    })
  }

  const catStyle = categoryStyles[task.category] || categoryStyles.other
  const prioStyle = priorityBadgeStyles[task.priority] || priorityBadgeStyles.medium

  return (
    <div
      onClick={() => onOpen(task)}
      className="group relative flex cursor-pointer flex-col justify-between rounded-2xl border border-border/70 bg-card p-4.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md dark:border-border/60 dark:bg-slate-900/80"
    >
      <div>
        {/* Top bar: Category + Priority badge + options menu icon */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
            >
              {categoryLabels(en)[task.category]}
            </span>

            <span
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-medium ${prioStyle.bg}`}
            >
              <span className={`size-1.5 rounded-full ${prioStyle.dot}`} />
              {priorityLabels(en)[task.priority]}
            </span>
          </div>

          {/* Hover actions: Edit, Save, Delete - aligned right */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              type="button"
              className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors"
              title="Edit"
              onClick={(e) => {
                e.stopPropagation()
                // Edit action
              }}
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-emerald-600 hover:bg-emerald-50/50 transition-colors"
              title="Save"
              onClick={(e) => {
                e.stopPropagation()
                // Save action
              }}
            >
              <Save className="size-3.5" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-rose-600 hover:bg-rose-50/50 transition-colors"
              title="Delete"
              onClick={(e) => {
                e.stopPropagation()
                // Delete action
              }}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Task Title */}
        <h4
          className={`mt-3 line-clamp-2 text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors ${
            isCompleted ? 'line-through text-muted-foreground' : ''
          }`}
        >
          {task.title}
        </h4>

        {/* Description snippet */}
        {task.description && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground/80">
            {task.description}
          </p>
        )}
      </div>

      {/* Bottom Footer: Due date + Overdue indicator + Avatars */}
      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
        {/* Due Date & Meta */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
              overdue
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 font-semibold'
                : isCompleted
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-muted/60 text-muted-foreground'
            }`}
          >
            {overdue ? (
              <Clock className="size-3 text-rose-500 animate-pulse" />
            ) : isCompleted ? (
              <CheckCircle2 className="size-3 text-emerald-500" />
            ) : (
              <Calendar className="size-3" />
            )}
            <span>{formatDate(task.dueDate)}</span>
          </span>

          {overdue && (
            <Badge
              variant="outline"
              className="border-rose-200/80 bg-rose-50/50 px-1.5 py-0 text-[10px] text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 font-bold"
            >
              {en ? 'Late' : 'Kechikkan'}
            </Badge>
          )}
        </div>

        {/* Assignee Avatar Stack (Ovra signature look) */}
        {task.assignees.length > 0 && (
          <div className="flex -space-x-2 overflow-hidden items-center">
            {task.assignees.slice(0, 3).map((assignee, idx) => (
              <div
                key={assignee}
                title={assignee}
                className={`inline-flex size-6 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-background ${
                  avatarColors[idx % avatarColors.length]
                }`}
              >
                {getInitials(assignee)}
              </div>
            ))}
            {task.assignees.length > 3 && (
              <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground ring-2 ring-background">
                +{task.assignees.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
