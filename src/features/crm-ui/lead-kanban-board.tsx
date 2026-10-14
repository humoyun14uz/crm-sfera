import { CalendarDays, GripVertical, MoreHorizontal, Phone, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Lead = {
  name: string
  phone: string
  course: string
  status: string
  date: string
  email?: string
}

type Stage = { key: string; label: string; dot: string; surface: string }

const defaultStages: Stage[] = [
  { key: 'New', label: 'Yangi', dot: 'bg-sky-500', surface: 'bg-sky-500/[0.04]' },
  { key: 'Contacted', label: 'Bog‘lanildi', dot: 'bg-violet-500', surface: 'bg-violet-500/[0.04]' },
  { key: 'Interested', label: 'Qiziqdi', dot: 'bg-amber-500', surface: 'bg-amber-500/[0.04]' },
  { key: 'Trial Lesson', label: 'Sinov darsi', dot: 'bg-orange-500', surface: 'bg-orange-500/[0.04]' },
  { key: 'Enrolled', label: 'Qabul qilindi', dot: 'bg-emerald-500', surface: 'bg-emerald-500/[0.04]' },
  { key: 'Lost', label: 'Yo‘qotildi', dot: 'bg-slate-400', surface: 'bg-slate-500/[0.04]' },
]

export function LeadKanbanBoard({ leads, english, onMove, onOpen, draggingLead, onDragStart, onDragEnd }: {
  leads: Lead[]
  english: boolean
  onMove: (lead: Lead, stage: string) => void
  onOpen: (lead: Lead) => void
  draggingLead: string | null
  onDragStart: (name: string) => void
  onDragEnd: () => void
}) {
  const stages = defaultStages
  return (
    <div className='-mx-1 overflow-x-auto px-1 pb-2'>
      <div className='grid min-w-[1120px] grid-cols-6 gap-3'>
        {stages.map((stage) => {
          const cards = leads.filter((lead) => lead.status === stage.key)
          return (
            <section key={stage.key} className={cn('min-h-[360px] rounded-2xl border border-border/70 p-2.5', stage.surface)} onDragOver={(event) => event.preventDefault()} onDrop={() => {
              const lead = leads.find((item) => item.name === draggingLead)
              if (lead) onMove(lead, stage.key)
            }} aria-label={`${stage.label}: ${cards.length}`}>
              <div className='mb-3 flex items-center justify-between px-1'>
                <div className='flex items-center gap-2'>
                  <span className={cn('size-2 rounded-full', stage.dot)} />
                  <h3 className='text-xs font-bold'>{english ? stage.key : stage.label}</h3>
                  <span className='rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground'>{cards.length}</span>
                </div>
                <button type='button' className='rounded-md p-1 text-muted-foreground hover:bg-background hover:text-foreground' aria-label={english ? `More ${stage.key} actions` : `${stage.label} amallari`}><MoreHorizontal className='size-3.5' /></button>
              </div>
              <div className='space-y-2'>
                {cards.map((lead) => (
                  <button key={`${lead.name}-${lead.date}`} type='button' draggable onDragStart={() => onDragStart(lead.name)} onDragEnd={onDragEnd} onClick={() => onOpen(lead)} className={cn('group w-full rounded-xl border border-border/70 bg-card p-3 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary/40', draggingLead === lead.name && 'opacity-50 ring-2 ring-primary/30')}>
                    <div className='flex items-start justify-between gap-2'>
                      <div className='flex min-w-0 items-center gap-2'>
                        <span className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-bold text-primary'>{lead.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span>
                        <span className='truncate text-xs font-bold'>{lead.name}</span>
                      </div>
                      <GripVertical className='size-3.5 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary' />
                    </div>
                    <div className='mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground'><Phone className='size-3' />{lead.phone}</div>
                    <div className='mt-2 flex items-center justify-between gap-2'>
                      <Badge variant='secondary' className='max-w-[150px] truncate rounded-md px-1.5 py-0.5 text-[10px]'>{lead.course}</Badge>
                      <span className='flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground'><CalendarDays className='size-3' />{lead.date}</span>
                    </div>
                    <div className='mt-3 flex items-center gap-1 border-t border-border/50 pt-2 text-[10px] text-muted-foreground'><UserRound className='size-3' />{english ? 'Open details' : 'Batafsil ko‘rish'}</div>
                  </button>
                ))}
                {cards.length === 0 && <div className='rounded-xl border border-dashed border-border/70 px-3 py-7 text-center text-[11px] text-muted-foreground'>{english ? 'Drop leads here' : 'Leadlarni shu yerga tashlang'}</div>}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
