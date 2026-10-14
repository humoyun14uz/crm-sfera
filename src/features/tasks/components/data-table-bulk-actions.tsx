import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Trash2, CircleArrowUp, ArrowUpDown, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { useLanguage } from '@/context/language-provider'
import { priorities, statuses } from '../data/data'
import { type Task } from '../data/schema'
import { TasksMultiDeleteDialog } from './tasks-multi-delete-dialog'
import { useTasks } from './tasks-provider'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const { language } = useLanguage()
  const english = language === 'en'
  const { updateTasks } = useTasks()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkStatusChange = (status: string) => {
    const selectedTasks = selectedRows.map((row) => row.original as Task)
    updateTasks(selectedTasks.map((task) => task.id), { status })
    toast.success(
      english
        ? `Status updated for ${selectedTasks.length} task${selectedTasks.length > 1 ? 's' : ''}.`
        : `${selectedTasks.length} ta vazifa holati yangilandi.`
    )
    table.resetRowSelection()
  }

  const handleBulkPriorityChange = (priority: string) => {
    const selectedTasks = selectedRows.map((row) => row.original as Task)
    updateTasks(selectedTasks.map((task) => task.id), { priority })
    toast.success(
      english
        ? `Priority updated for ${selectedTasks.length} task${selectedTasks.length > 1 ? 's' : ''}.`
        : `${selectedTasks.length} ta vazifa muhimligi yangilandi.`
    )
    table.resetRowSelection()
  }

  const handleBulkExport = () => {
    const selectedTasks = selectedRows.map((row) => row.original as Task)
    const csv = [
      'id,title,status,label,priority',
      ...selectedTasks.map((task) =>
        [task.id, task.title, task.status, task.label, task.priority]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n')
    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8' })
    )
    const link = document.createElement('a')
    link.href = url
    link.download = 'tasks.csv'
    link.click()
    URL.revokeObjectURL(url)
    toast.success(
      english
        ? `Exported ${selectedTasks.length} task${selectedTasks.length > 1 ? 's' : ''} to CSV.`
        : `${selectedTasks.length} ta vazifa CSV fayliga eksport qilindi.`
    )
    table.resetRowSelection()
  }

  const bulkLabels = english
    ? undefined
    : {
        selected: 'tanlandi',
        clearSelection: 'Tanlovni tozalash',
        clearSelectionTitle: 'Tanlovni tozalash (Escape)',
        announcement: (count: number) =>
          `${count} ta vazifa tanlandi. Ommaviy amallar paneli mavjud.`,
      }

  return (
    <>
      <BulkActionsToolbar
        table={table}
        entityName={english ? 'task' : 'vazifa'}
        labels={bulkLabels}
      >
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='icon'
                  className='size-8'
                  aria-label={english ? 'Update status' : 'Holatni yangilash'}
                  title={english ? 'Update status' : 'Holatni yangilash'}
                >
                  <CircleArrowUp />
                  <span className='sr-only'>
                    {english ? 'Update status' : 'Holatni yangilash'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{english ? 'Update status' : 'Holatni yangilash'}</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent sideOffset={14}>
            {statuses.map((status) => (
              <DropdownMenuItem
                key={status.value}
                defaultValue={status.value}
                onClick={() => handleBulkStatusChange(status.value)}
              >
                {status.icon && (
                  <status.icon className='size-4 text-muted-foreground' />
                )}
                {english
                  ? status.label
                  : ({
                      backlog: 'Rejada',
                      todo: 'Bajarilishi kerak',
                      'in progress': 'Jarayonda',
                      done: 'Bajarilgan',
                      canceled: 'Bekor qilingan',
                    } as Record<string, string>)[status.value] ?? status.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='icon'
                  className='size-8'
                  aria-label={english ? 'Update priority' : 'Muhimlikni yangilash'}
                  title={english ? 'Update priority' : 'Muhimlikni yangilash'}
                >
                  <ArrowUpDown />
                  <span className='sr-only'>
                    {english ? 'Update priority' : 'Muhimlikni yangilash'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{english ? 'Update priority' : 'Muhimlikni yangilash'}</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent sideOffset={14}>
            {priorities.map((priority) => (
              <DropdownMenuItem
                key={priority.value}
                defaultValue={priority.value}
                onClick={() => handleBulkPriorityChange(priority.value)}
              >
                {priority.icon && (
                  <priority.icon className='size-4 text-muted-foreground' />
                )}
                {english
                  ? priority.label
                  : ({
                      low: 'Past',
                      medium: 'O‘rta',
                      high: 'Yuqori',
                      critical: 'Juda yuqori',
                    } as Record<string, string>)[priority.value] ??
                    priority.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={() => handleBulkExport()}
              className='size-8'
              aria-label={english ? 'Export tasks' : 'Vazifalarni eksport qilish'}
              title={english ? 'Export tasks' : 'Vazifalarni eksport qilish'}
            >
              <Download />
              <span className='sr-only'>
                {english ? 'Export tasks' : 'Vazifalarni eksport qilish'}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{english ? 'Export tasks' : 'Vazifalarni eksport qilish'}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label={
                english ? 'Delete selected tasks' : 'Tanlangan vazifalarni o‘chirish'
              }
              title={
                english ? 'Delete selected tasks' : 'Tanlangan vazifalarni o‘chirish'
              }
            >
              <Trash2 />
              <span className='sr-only'>
                {english
                  ? 'Delete selected tasks'
                  : 'Tanlangan vazifalarni o‘chirish'}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {english
                ? 'Delete selected tasks'
                : 'Tanlangan vazifalarni o‘chirish'}
            </p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <TasksMultiDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        table={table}
      />
    </>
  )
}
