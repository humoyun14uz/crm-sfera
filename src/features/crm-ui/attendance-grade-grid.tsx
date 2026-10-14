import { Check, Clock3, Pencil, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AttendanceStatusKey } from '@/components/attendance-checkbox'

type GridStudent = { id: string; name: string; course?: string; group?: string; grade?: number }
const statusMeta: Record<AttendanceStatusKey, { label: string; icon: typeof Check; className: string }> = {
  present: { label: 'Keldi', icon: Check, className: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  late: { label: 'Kechikdi', icon: Clock3, className: 'border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  absent: { label: 'Kelmadi', icon: X, className: 'border-rose-500/30 bg-rose-500/15 text-rose-700 dark:text-rose-300' },
  excused: { label: 'Sababli', icon: Pencil, className: 'border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-300' },
}

export function AttendanceGradeGrid({ students, statuses, onStatusChange, grades, onGradeChange, english = false }: {
  students: GridStudent[]
  statuses: Record<string, AttendanceStatusKey>
  onStatusChange: (studentId: string, status: AttendanceStatusKey) => void
  grades?: Record<string, number>
  onGradeChange?: (studentId: string, value: number) => void
  english?: boolean
}) {
  return (
    <div className='overflow-x-auto rounded-2xl border border-border/70 bg-card shadow-xs'>
      <table className='min-w-[760px] w-full border-collapse text-left text-sm'>
        <thead className='bg-muted/50 text-[11px] font-bold uppercase tracking-wide text-muted-foreground'>
          <tr>
            <th className='sticky left-0 z-20 min-w-[250px] border-b border-border/70 bg-muted/95 px-4 py-3 backdrop-blur'>{english ? 'Learner' : 'O‘quvchi'}</th>
            <th className='border-b border-border/70 px-4 py-3'>{english ? 'Group' : 'Guruh'}</th>
            <th className='border-b border-border/70 px-4 py-3'>{english ? 'Attendance' : 'Davomat'}</th>
            <th className='border-b border-border/70 px-4 py-3'>{english ? 'Grade' : 'Baho'}</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-border/60'>
          {students.map((student) => {
            const status = statuses[student.id] ?? 'present'
            const meta = statusMeta[status]
            const Icon = meta.icon
            return (
              <tr key={student.id} className='group transition-colors hover:bg-muted/30'>
                <td className='sticky left-0 z-10 bg-card px-4 py-3 group-hover:bg-muted/30'>
                  <div className='flex items-center gap-3'><span className='flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary'>{student.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><div className='min-w-0'><p className='truncate text-sm font-semibold'>{student.name}</p><p className='truncate text-[11px] text-muted-foreground'>{student.course ?? '—'}</p></div></div>
                </td>
                <td className='px-4 py-3 text-xs text-muted-foreground'>{student.group ?? '—'}</td>
                <td className='px-4 py-3'>
                  <button type='button' title={english ? 'Single click: present · double click: absent' : 'Bir bosish: keldi · ikki bosish: kelmadi'} aria-label={`${student.name}: ${meta.label}`} onClick={() => onStatusChange(student.id, 'present')} onDoubleClick={() => onStatusChange(student.id, 'absent')} className={cn('inline-flex min-w-[100px] items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/40', meta.className)}><Icon className='size-3.5' />{english ? ({ present: 'Present', late: 'Late', absent: 'Absent', excused: 'Excused' }[status]) : meta.label}</button>
                </td>
                <td className='px-4 py-3'>
                  {onGradeChange ? <input aria-label={`${student.name} grade`} type='number' min={0} max={100} value={grades?.[student.id] ?? student.grade ?? ''} onChange={(event) => onGradeChange(student.id, Number(event.target.value))} className='h-9 w-20 rounded-lg border border-border/70 bg-background px-2 text-center text-xs font-bold tabular-nums outline-none focus:border-primary focus:ring-2 focus:ring-primary/20' placeholder='—' /> : <span className='text-xs font-bold tabular-nums'>{student.grade ?? '—'}</span>}
                </td>
              </tr>
            )
          })}
          {!students.length && <tr><td colSpan={4} className='px-4 py-12 text-center text-sm text-muted-foreground'>{english ? 'No learners found.' : 'O‘quvchilar topilmadi.'}</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
