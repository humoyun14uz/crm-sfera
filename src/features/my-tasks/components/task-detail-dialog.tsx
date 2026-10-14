import { CalendarClock, Flag, Trash2, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useLanguage } from '@/context/language-provider'
import {
  categoryLabels,
  priorityLabels,
  statusDot,
  statusLabels,
  STATUS_COLUMNS,
} from '../data/data'
import type { Task, TaskStatusValue } from '../data/schema'

const STUDENT_TRANSITIONS: Record<TaskStatusValue, TaskStatusValue[]> = {
  todo: ['in_progress'],
  in_progress: ['review', 'completed'],
  review: ['completed', 'in_progress'],
  completed: [],
  cancelled: [],
}

type TaskDetailDialogProps = {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isStudent: boolean
  canManage: boolean
  onStatusChange: (status: TaskStatusValue) => void
  onDelete: (id: string) => void
}

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
  isStudent,
  canManage,
  onStatusChange,
  onDelete,
}: TaskDetailDialogProps) {
  const { language } = useLanguage()
  const en = language === 'en'
  if (!task) return null

  const labels = statusLabels(en)
  const catLabels = categoryLabels(en)
  const prioLabels = priorityLabels(en)
  const allowed =
    isStudent && !canManage ? STUDENT_TRANSITIONS[task.status] ?? [] : STATUS_COLUMNS

  const formatDate = (iso: string) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString(en ? 'en-GB' : 'uz-UZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className={`size-2.5 rounded-full ${statusDot(task.status)}`} />
            <Badge variant="outline" className="font-medium">
              {labels[task.status]}
            </Badge>
            <Badge variant="secondary" className="font-medium">
              {catLabels[task.category]}
            </Badge>
          </div>
          <DialogTitle className="pt-2 text-lg leading-snug">
            {task.title}
          </DialogTitle>
          <DialogDescription>
            {task.description || (en ? 'No description' : 'Tavsif yo‘q')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Flag className="size-4" />
            {en ? 'Priority' : 'Muhimlik'}:
            <span className="font-medium capitalize text-foreground">
              {prioLabels[task.priority]}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarClock className="size-4" />
            {en ? 'Due' : 'Muddat'}:
            <span className="font-medium text-foreground">
              {formatDate(task.dueDate)}
            </span>
          </div>
          {task.assignees.length > 0 && (
            <div className="col-span-2 flex items-center gap-2 text-muted-foreground">
              <Users className="size-4" />
              {en ? 'Assignees' : 'Bajaruvchilar'}:
              <span className="font-medium text-foreground">
                {task.assignees.join(', ')}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {en ? 'Move status' : 'Holatini o‘zgartirish'}
          </p>
          <div className="flex flex-wrap gap-2">
            {allowed.map((status) => (
              <Button
                key={status}
                size="sm"
                variant={status === task.status ? 'default' : 'outline'}
                onClick={() => onStatusChange(status)}
              >
                <span className={`me-1.5 size-2 rounded-full ${statusDot(status)}`} />
                {labels[status]}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <span className="text-xs text-muted-foreground">
            {en ? 'Updated' : 'Yangilangan'}: {formatDate(task.updatedAt)}
          </span>
          <div className="flex items-center gap-2">
            {canManage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onDelete(task.id)
                  onOpenChange(false)
                }}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="me-1.5 size-4" />
                {en ? 'Delete' : 'O‘chirish'}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              {en ? 'Close' : 'Yopish'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
