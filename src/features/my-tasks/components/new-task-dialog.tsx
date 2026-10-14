import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useLanguage } from '@/context/language-provider'
import { categoryLabels, priorityLabels } from '../data/data'
import type { TaskCategory, TaskDraft, TaskPriority } from '../data/schema'

const DEFAULT_DUE_DATE = new Date(Date.now() + 7 * 86400000)
  .toISOString()
  .slice(0, 10)

type NewTaskDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (draft: TaskDraft) => void
}

export function NewTaskDialog({ open, onOpenChange, onSave }: NewTaskDialogProps) {
  const { language } = useLanguage()
  const en = language === 'en'

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [category, setCategory] = useState<TaskCategory>('academic')
  const [dueDate, setDueDate] = useState(DEFAULT_DUE_DATE)
  const [assignees, setAssignees] = useState('')

  const prioLabels = priorityLabels(en)
  const catLabels = categoryLabels(en)

  const reset = () => {
    setTitle('')
    setDescription('')
    setPriority('medium')
    setCategory('academic')
    setDueDate(DEFAULT_DUE_DATE)
    setAssignees('')
  }

  const handleSave = () => {
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      description: description.trim(),
      priority,
      category,
      status: 'todo',
      dueDate: new Date(`${dueDate}T23:59:59`).toISOString(),
      assignees: assignees
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
    })
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            <Plus className="me-2 inline size-5" />
            {en ? 'New task' : 'Yangi vazifa'}
          </DialogTitle>
          <DialogDescription>
            {en
              ? 'Create and assign a new task to the team or students.'
              : 'Jamoaga yoki o‘quvchilarga yangi vazifa yarating va biriktiring.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mt-title">
              {en ? 'Title' : 'Nomi'} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="mt-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                en ? 'e.g. Prepare monthly report' : 'Masalan: Oylik hisobot tayyorlash'
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mt-desc">{en ? 'Description' : 'Tavsif'}</Label>
            <Textarea
              id="mt-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-24 resize-none"
              placeholder={
                en ? 'Add details about the task...' : 'Vazifa haqida ma’lumot kiriting...'
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{en ? 'Priority' : 'Muhimlik'}</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(prioLabels) as TaskPriority[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {prioLabels[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{en ? 'Category' : 'Kategoriya'}</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TaskCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(catLabels) as TaskCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {catLabels[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mt-due">{en ? 'Due date' : 'Muddat'}</Label>
              <Input
                id="mt-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mt-assignees">{en ? 'Assign to (IDs)' : 'Biriktirish (ID)'}</Label>
              <Input
                id="mt-assignees"
                value={assignees}
                onChange={(e) => setAssignees(e.target.value)}
                placeholder={en ? 'Comma separated' : 'Vergul bilan ajrating'}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {en ? 'Cancel' : 'Bekor qilish'}
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            <Plus className="me-2 size-4" />
            {en ? 'Create task' : 'Vazifa yaratish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
