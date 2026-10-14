import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { labels, priorities, statuses } from '../data/data'
import { type Task } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const getTasksColumns = (english: boolean): ColumnDef<Task>[] => {
  const sortLabels = english
    ? { asc: 'Asc', desc: 'Desc', hide: 'Hide' }
    : { asc: 'O‘sish tartibida', desc: 'Kamayish tartibida', hide: 'Yashirish' }

  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={english ? 'Select all' : 'Barchasini tanlash'}
          className='translate-y-0.5'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={english ? 'Select row' : 'Qatorni tanlash'}
          className='translate-y-0.5'
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={english ? 'Task' : 'Vazifa'}
          labels={sortLabels}
        />
      ),
      cell: ({ row }) => <div className='w-20'>{row.getValue('id')}</div>,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={english ? 'Title' : 'Sarlavha'}
          labels={sortLabels}
        />
      ),
      meta: {
        className: 'min-w-[400px]',
        tdClassName: 'ps-4 pe-3',
      },
      cell: ({ row }) => {
        const label = labels.find((label) => label.value === row.original.label)

        return (
          <div className='flex items-center gap-3 py-1'>
            {label && (
              <Badge
                variant='outline'
                className='shrink-0 bg-muted/40 px-2 py-0.5 text-xs font-medium'
              >
                {english
                  ? label.label
                  : label.value === 'bug'
                    ? 'Xato'
                    : label.value === 'feature'
                      ? 'Funksiya'
                      : 'Hujjatlashtirish'}
              </Badge>
            )}
            <span className='text-sm font-medium text-foreground'>
              {row.getValue('title')}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'assignee',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={english ? 'Assigned to' : 'Mas’ul xodim'}
          labels={sortLabels}
        />
      ),
      meta: { className: 'w-44' },
      cell: ({ row }) => (
        <span className='text-xs font-medium text-muted-foreground'>
          {row.original.assignee || (english ? 'Unassigned' : 'Biriktirilmagan')}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={english ? 'Status' : 'Holati'}
          labels={sortLabels}
        />
      ),
      meta: { className: 'w-36', tdClassName: 'ps-4' },
      cell: ({ row }) => {
        const status = statuses.find(
          (status) => status.value === row.getValue('status')
        )

        if (!status) {
          return null
        }

        return (
          <div className='flex w-36 items-center gap-2 text-xs'>
            {status.icon && (
              <status.icon className='size-4 shrink-0 text-muted-foreground' />
            )}
            <span className='whitespace-nowrap'>
              {english
                ? status.label
                : (
                    {
                      backlog: 'Rejada',
                      todo: 'Bajarilishi kerak',
                      'in progress': 'Jarayonda',
                      done: 'Bajarilgan',
                      canceled: 'Bekor qilingan',
                    } as Record<string, string>
                  )[status.value]}
            </span>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: 'priority',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={english ? 'Priority' : 'Muhimlik'}
          labels={sortLabels}
        />
      ),
      meta: { className: 'w-32', tdClassName: 'ps-3' },
      cell: ({ row }) => {
        const priority = priorities.find(
          (priority) => priority.value === row.getValue('priority')
        )

        if (!priority) {
          return null
        }

        return (
          <div className='flex w-28 items-center gap-2 text-xs'>
            {priority.icon && (
              <priority.icon className='size-4 shrink-0 text-muted-foreground' />
            )}
            <span className='whitespace-nowrap'>
              {english
                ? priority.label
                : (
                    {
                      low: 'Past',
                      medium: 'O‘rta',
                      high: 'Yuqori',
                      critical: 'Juda yuqori',
                    } as Record<string, string>
                  )[priority.value]}
            </span>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => <DataTableRowActions row={row} />,
    },
  ]
}
