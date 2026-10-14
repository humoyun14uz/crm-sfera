import { ArrowDownRight, ArrowUpRight, CircleDollarSign, UsersRound, UserMinus, Workflow } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type ManagerScorecard = {
  label: string
  value: string | number
  detail: string
  trend?: string
  trendDirection?: 'up' | 'down' | 'neutral'
  icon: 'conversion' | 'revenue' | 'groups' | 'churn'
}

const icons = { conversion: Workflow, revenue: CircleDollarSign, groups: UsersRound, churn: UserMinus }
const tones = {
  conversion: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  revenue: 'bg-slate-950 text-white dark:bg-white dark:text-slate-950',
  groups: 'bg-primary/10 text-primary',
  churn: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
}

export function ManagerScorecards({ items }: { items: ManagerScorecard[] }) {
  return (
    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
      {items.map((item) => {
        const Icon = icons[item.icon]
        const isDown = item.trendDirection === 'down'
        return (
          <Card key={item.label} className='group overflow-hidden rounded-2xl border-border/70 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg'>
            <CardContent className='relative p-5'>
              <div className='absolute inset-x-0 top-0 h-0.5 bg-primary/0 transition-colors group-hover:bg-primary/70' />
              <div className='flex items-start justify-between gap-4'>
                <div className='min-w-0'>
                  <p className='truncate text-xs font-semibold text-muted-foreground'>{item.label}</p>
                  <p className='mt-2 text-2xl font-black tracking-tight tabular-nums'>{item.value}</p>
                </div>
                <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', tones[item.icon])}>
                  <Icon className='size-5' aria-hidden='true' />
                </span>
              </div>
              <div className='mt-4 flex items-center gap-2 text-[11px]'>
                {item.trend && (
                  <span className={cn('inline-flex items-center gap-1 font-bold', isDown ? 'text-rose-600 dark:text-rose-300' : 'text-emerald-600 dark:text-emerald-300')}>
                    {isDown ? <ArrowDownRight className='size-3' /> : <ArrowUpRight className='size-3' />}{item.trend}
                  </span>
                )}
                <span className='truncate text-muted-foreground'>{item.detail}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
