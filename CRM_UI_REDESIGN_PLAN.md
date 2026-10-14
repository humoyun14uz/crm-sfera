# Sfera Academy CRM — zamonaviy SaaS dashboard redesign rejasi

**Tahlil qilingan loyiha:** `sfera-academy-crm-production(2).zip`  
**Stack:** React 19 + Vite + TypeScript + Tailwind v4 + shadcn/Radix UI + Recharts + TanStack Table; backend NestJS + Drizzle ORM + PostgreSQL.  
**Scope:** Manager dashboard, Finance workspace, Leads pipeline/Kanban va Attendance responsive jadvali.

> **Refero holati:** Refero connector konfiguratsiyada `enabled: true`, ammo uchta semantik qidiruvning barchasi `NO_SUBSCRIPTION` xatosi bilan tugadi. Shu sababli bu hujjat Refero’dan olingan aniq screen UUID yoki screenshot’larni da’vo qilmaydi. Dizayn yo‘nalishi loyihadagi mavjud komponentlar va Stripe/Lemon Squeezy uslubidagi umumiy SaaS UX tamoyillari asosida tayyorlandi. Refero obunasi tiklangach, `reference-lock` bo‘limida berilgan qidiruvlar bilan screen-level tekshiruvni qayta bajarish kerak.

---

## 1. Kod bazasi auditi

### 1.1. Frontend joylashuvi

Arxivda `apps/web` yo‘q; frontend `src/` katalogida, backend esa `apps/api/` ichida. Shuning uchun komponentlarni quyidagi joylarga qo‘shish mantiqiy:

```text
src/features/dashboard/index.tsx
src/features/finance/index.tsx
src/features/academy-module/leads-panel.tsx
src/features/academy-module/index.tsx
src/components/data-table/*
src/lib/api-client.ts
src/lib/crm-store.ts
src/styles/theme.css
```

### 1.2. Mavjud kuchli tomonlar

- `src/features/dashboard/index.tsx` allaqachon Manager va Admin rollarini ajratadi.
- `src/features/finance/index.tsx` ichida `AreaChart`, summary KPI’lar, payment rows va filterga o‘xshash UI mavjud.
- `src/features/academy-module/leads-panel.tsx` table/Kanban toggle, search, stage select, detail dialog va convert flow’ni beradi.
- `src/components/data-table/toolbar.tsx` va `faceted-filter.tsx` TanStack Table bilan qayta foydalaniladigan filter qatlamiga ega.
- `src/components/attendance-checkbox.tsx` davomat statuslarini checkbox sifatida qayd qilishga tayyor.
- `theme.css` Sfera brand green (`#29A956`) va dark mode tokenlarini markazlashtirgan.
- Backenddagi barcha asosiy controller’lar Clerk auth + RBAC/scope guard bilan himoyalangan.

### 1.3. Eng muhim nomuvofiqliklar va xavflar

| Joy | Topilma | Dizayn/implementatsiya ta’siri | Tavsiya |
|---|---|---|---|
| Manager API | `GET /manager/dashboard` faqat 7 ta scalar KPI qaytaradi | Grafiklar hozir frontend seed/static data bilan chiziladi | `series` va `breakdown` qo‘shilgan endpoint yoki `?range=30d` contract yarating |
| Manager API | `getFinancialOverview()` `totalExpenses: 0`, `netProfit: totalRevenue` qaytaradi | “Profit”ni real xarajatlar bo‘lmasa ko‘rsatish noto‘g‘ri | Hozircha `net collection` deb nomlang yoki expenses ledger qo‘shilmaguncha yashiring |
| Finance API | `GET /payments`da search/status/method/date pagination yo‘q | Stripe uslubidagi server-side filter va table pagination ishlamaydi | Query DTO: `q`, `status`, `method`, `from`, `to`, `page`, `pageSize` |
| Finance API | `GET /summary` aniq date range qabul qiladi | Bu finance KPI va chart uchun yaxshi asos | UI date range’ni URL query bilan saqlang |
| Leads | DB statuslari `NEW`, `CONTACTED`, `TRIAL LESSON`, `APPROVED`, `CONVERTED`, `REJECTED` | UI’dagi `Interested`, `Enrolled`, `Lost` backend bilan 1:1 emas | Bitta canonical enum va label map ishlating; UI label’ni DB value’ga aralashtirmang |
| Leads | `GET /leads` filter/pagination qaytarmaydi | Katta pipeline’da barcha lead’ni browserga yuklash qimmat | `status`, `courseId`, `q`, `page`, `pageSize` qo‘shing |
| Attendance | `GET /groups/:groupId` faqat history beradi | Responsive schedule uchun group/date bo‘yicha agregat yo‘q | `GET /attendance/sessions?groupId&from&to` summary endpoint qo‘shing |
| Attendance | POST bulk/session mavjud va atomic | “Save all” UX uchun tayyor | UI’da dirty state, optimistic emas, save status va retry ko‘rsating |
| Finance schema | Payments `paidAt`, `paymentMethod`, `source`, `status`, `referenceNumber` bilan boy | Audit-friendly table qilish mumkin | Row actions’da invoice/payment/refund detail drawer ishlating |
| Dashboard schema | `roleDashboardConfigs` va `dashboardWidgets` bor | Widget personalization uchun backend foundation tayyor | 1-bosqichda fixed layout, 2-bosqichda drag/drop config |

---

## 2. Reference-lock: tavsiya etiladigan vizual yo‘nalish

Refero qayta ishlaganda quyidagi qidiruvlar bilan reference’larni qayta tanlang:

```text
modern SaaS education admin dashboard student analytics revenue groups
Stripe payments dashboard table filters date range
Lemon Squeezy revenue transactions dashboard
CRM lead pipeline Kanban responsive
attendance schedule management table responsive
```

### Qabul qilinadigan dizayn qoidalari

1. **Primary surface:** oq/dark card, juda yengil border, radius 16–20px; katta gradient va ortiqcha shadow emas.
2. **Accent:** Sfera green `#29A956`; statuslar uchun faqat semantik ranglar: success, warning, danger, neutral. Har bir card rang-barang bo‘lmasin.
3. **Information density:** dashboard’da 4 KPI + 2 asosiy chart + 2 operational list. Birinchi viewport’da qaror qabul qilish uchun kerakli signal bo‘lsin.
4. **Tables:** sticky header, tabular numbers, right-aligned money, status badge, row hover, keyboard focus, mobile’da horizontal scroll yoki card transformation.
5. **Filters:** filterlar table’dan alohida toolbar bo‘lmasin; query, date range va active filter chips bitta command row’da bo‘lsin.
6. **Kanban:** horizontal scroll, column count + total value, card ichida faqat qaror uchun kerakli ma’lumot; drag/drop keyinroq, avval keyboard/select fallback.
7. **Responsive:** 1280px — 4-column KPI; 768px — 2-column; 640px dan past — 1-column. Kanban esa vertical stack emas, intentional horizontal scroll.
8. **Accessibility:** status rangiga faqat tayanmang; text label + `aria-label`, focus ring, `prefers-reduced-motion`.

### Tokenlar

```ts
export const crmUiTokens = {
  brand: '#29A956',
  ink: '#0C0D12',
  surface: 'var(--card)',
  border: 'var(--border)',
  muted: 'var(--muted)',
  radius: '1rem',
  chartRevenue: '#29A956',
  chartAttendance: '#0C0D12',
  chartDebt: '#7A847C',
} as const
```

---

## 3. Tavsiya etiladigan sahifa arxitekturasi

### Manager dashboard

```text
Header: academy switcher | date range | notifications | profile
Hero: “Bugun akademiyani boshqaring” + quick actions
KPI row: Active students | Monthly collected | Outstanding debt | Attendance
Main row: Revenue & attendance trend | Today’s focus
Second row: Group capacity/health | Lead pipeline conversion
Third row: Today schedule | Recent activity
```

### Finance workspace

```text
Header: Finance | Export | Record payment
KPI row: Collected | Invoiced | Outstanding | Net after refunds
Filter row: Search | date range | status | method | group | Reset | active chips
Chart: monthly collections vs refunds
Tabs: Payments | Invoices | Debtors | Refunds
Table: student, invoice, amount, method, paidAt, status, actions
```

### Leads + attendance

- Leads’da `Table / Kanban` view switch saqlanadi.
- Kanban columns backend status enum’iga mos keladi: `NEW`, `CONTACTED`, `TRIAL LESSON`, `APPROVED`, `CONVERTED`, `REJECTED`.
- Attendance’da yuqorida `group`, `week`, `session` filter; body’da desktop matrix, mobile’da session cards.
- “Save attendance” faqat o‘zgargan studentlarni yuboradi; full-group bulk endpoint saqlanadi.

---

## 4. React/TSX code samples

Quyidagi kodlar loyiha stack’iga mos: `lucide-react`, `recharts`, shadcn `Card/Button/Badge/Input`, Tailwind classlari. Ularni to‘g‘ridan-to‘g‘ri `src/features/...` ichidagi mavjud komponentlarga bo‘lib qo‘shish mumkin.

### 4.1. Manager KPI + trend chart

```tsx
import { ArrowDownRight, ArrowUpRight, CheckCircle2, GraduationCap, WalletCards } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatApiCurrency, type ManagerDashboardApi } from '@/lib/api-client'

type TrendPoint = { label: string; revenue: number; attendance: number }

type ManagerOverviewProps = {
  stats: ManagerDashboardApi
  trend: TrendPoint[]
  locale?: 'uz-UZ' | 'en-US'
}

const kpiMeta = [
  { key: 'totalStudents', label: 'Faol o‘quvchilar', icon: GraduationCap, tone: 'bg-emerald-500/10 text-emerald-700' },
  { key: 'monthlyRevenue', label: 'Bu oy tushumi', icon: WalletCards, tone: 'bg-slate-900/5 text-slate-900 dark:bg-white/10 dark:text-white' },
  { key: 'pendingDebts', label: 'Ochiq qarzdorlik', icon: ArrowDownRight, tone: 'bg-amber-500/10 text-amber-700' },
  { key: 'averageAttendance', label: 'O‘rtacha davomat', icon: CheckCircle2, tone: 'bg-sky-500/10 text-sky-700' },
] as const

export function ManagerOverview({ stats, trend }: ManagerOverviewProps) {
  return (
    <div className='space-y-6'>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {kpiMeta.map(({ key, label, icon: Icon, tone }) => {
          const raw = stats[key]
          const value = key === 'monthlyRevenue' || key === 'pendingDebts'
            ? formatApiCurrency(Number(raw))
            : key === 'averageAttendance' ? `${raw}%` : raw
          return (
            <Card key={key} className='rounded-2xl border shadow-sm transition-shadow hover:shadow-md'>
              <CardContent className='p-5'>
                <div className='flex items-start justify-between gap-4'>
                  <div className='min-w-0'>
                    <p className='text-xs font-medium text-muted-foreground'>{label}</p>
                    <p className='mt-2 truncate text-2xl font-black tracking-tight'>{value}</p>
                  </div>
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                    <Icon className='size-5' aria-hidden='true' />
                  </span>
                </div>
                <div className='mt-4 flex items-center gap-2 text-xs'>
                  <Badge variant='secondary' className='gap-1 rounded-md text-emerald-700'>
                    <ArrowUpRight className='size-3' aria-hidden='true' /> +12.5%
                  </Badge>
                  <span className='text-muted-foreground'>o‘tgan oyga nisbatan</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className='rounded-2xl'>
        <CardHeader className='flex-row items-center justify-between space-y-0'>
          <div>
            <CardTitle className='text-base'>Tushum va davomat</CardTitle>
            <p className='mt-1 text-xs text-muted-foreground'>Oxirgi 30 kun, serverdan agregatsiya qilingan</p>
          </div>
          <Badge variant='outline' className='rounded-md'>UZS</Badge>
        </CardHeader>
        <CardContent>
          <div className='h-[280px] w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={trend} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id='managerRevenueFill' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='0%' stopColor='#29A956' stopOpacity={0.28} />
                    <stop offset='100%' stopColor='#29A956' stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray='3 3' opacity={0.12} />
                <XAxis dataKey='label' axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(value) => `${value / 1_000_000}m`} />
                <Tooltip formatter={(value, name) => [name === 'revenue' ? formatApiCurrency(Number(value)) : `${value}%`, name === 'revenue' ? 'Tushum' : 'Davomat']} />
                <Area type='monotone' dataKey='revenue' stroke='#29A956' strokeWidth={2.5} fill='url(#managerRevenueFill)' />
                <Area type='monotone' dataKey='attendance' stroke='#0C0D12' strokeWidth={2} fill='none' yAxisId={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

> **Backend contract:** `GET /manager/dashboard?range=30d` quyidagiga kengaytirilishi tavsiya qilinadi: `{ ...scalarStats, trend: [{ label, revenue, attendance }], groups: [{ id, name, students, capacity, attendance }] }`.

### 4.2. Finance filter bar + table

```tsx
import { Download, RotateCcw, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type FinanceFilters = {
  q: string
  status: 'all' | 'paid' | 'refunded' | 'pending'
  method: 'all' | 'cash' | 'card' | 'click' | 'payme' | 'other'
  from: string
  to: string
}

export function FinanceFilterBar({ filters, onChange, onReset, onExport }: {
  filters: FinanceFilters
  onChange: (next: FinanceFilters) => void
  onReset: () => void
  onExport: () => void
}) {
  const set = <K extends keyof FinanceFilters>(key: K, value: FinanceFilters[K]) => onChange({ ...filters, [key]: value })
  const activeCount = Object.entries(filters).filter(([key, value]) => key !== 'q' && value !== 'all' && value !== '').length
  return (
    <div className='space-y-3'>
      <div className='flex flex-col gap-2 lg:flex-row lg:items-center'>
        <div className='relative min-w-0 flex-1 lg:max-w-sm'>
          <Search className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input value={filters.q} onChange={(event) => set('q', event.target.value)} placeholder='O‘quvchi, invoice yoki reference…' className='h-10 rounded-xl ps-9' />
        </div>
        <Input type='date' value={filters.from} onChange={(event) => set('from', event.target.value)} className='h-10 w-full rounded-xl sm:w-auto' aria-label='Boshlanish sanasi' />
        <Input type='date' value={filters.to} onChange={(event) => set('to', event.target.value)} className='h-10 w-full rounded-xl sm:w-auto' aria-label='Tugash sanasi' />
        <Select value={filters.status} onValueChange={(value) => set('status', value as FinanceFilters['status'])}>
          <SelectTrigger className='h-10 w-full rounded-xl sm:w-[150px]'><SelectValue placeholder='Holat' /></SelectTrigger>
          <SelectContent><SelectItem value='all'>Barcha holatlar</SelectItem><SelectItem value='paid'>Paid</SelectItem><SelectItem value='refunded'>Refunded</SelectItem><SelectItem value='pending'>Pending</SelectItem></SelectContent>
        </Select>
        <Select value={filters.method} onValueChange={(value) => set('method', value as FinanceFilters['method'])}>
          <SelectTrigger className='h-10 w-full rounded-xl sm:w-[150px]'><SelectValue placeholder='Usul' /></SelectTrigger>
          <SelectContent><SelectItem value='all'>Barcha usullar</SelectItem><SelectItem value='cash'>Naqd</SelectItem><SelectItem value='card'>Karta</SelectItem><SelectItem value='click'>Click</SelectItem><SelectItem value='payme'>Payme</SelectItem></SelectContent>
        </Select>
      </div>
      <div className='flex flex-wrap items-center gap-2'>
        {activeCount > 0 && <Badge variant='secondary' className='rounded-md'>{activeCount} ta filter faol</Badge>}
        <Button variant='ghost' size='sm' onClick={onReset} className='gap-2'><RotateCcw className='size-3.5' /> Tozalash</Button>
        <Button variant='outline' size='sm' onClick={onExport} className='ms-auto gap-2'><Download className='size-3.5' /> CSV export</Button>
      </div>
    </div>
  )
}
```

```tsx
type PaymentRow = {
  id: string
  invoiceId: string
  studentFirstName: string
  studentLastName: string
  amount: number
  paymentMethod: string
  status: string
  referenceNumber?: string | null
  paidAt: string
}

export function PaymentTable({ rows, onOpen }: { rows: PaymentRow[]; onOpen: (row: PaymentRow) => void }) {
  return (
    <div className='overflow-x-auto rounded-2xl border'>
      <table className='w-full min-w-[900px] text-sm'>
        <thead className='sticky top-0 z-10 bg-muted/80 backdrop-blur'>
          <tr className='border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground'>
            <th className='px-4 py-3 font-semibold'>O‘quvchi</th><th className='px-4 py-3 font-semibold'>Invoice</th><th className='px-4 py-3 font-semibold'>Usul</th><th className='px-4 py-3 text-right font-semibold'>Summa</th><th className='px-4 py-3 font-semibold'>Sana</th><th className='px-4 py-3 font-semibold'>Status</th><th className='px-4 py-3' />
          </tr>
        </thead>
        <tbody className='divide-y'>
          {rows.map((row) => (
            <tr key={row.id} className='group transition-colors hover:bg-muted/40'>
              <td className='px-4 py-3.5'><button className='text-left font-semibold hover:underline' onClick={() => onOpen(row)}>{row.studentFirstName} {row.studentLastName}<span className='block text-xs font-normal text-muted-foreground'>{row.referenceNumber || 'Reference yo‘q'}</span></button></td>
              <td className='px-4 py-3.5 font-mono text-xs'>{row.invoiceId.slice(0, 8)}…</td>
              <td className='px-4 py-3.5 capitalize'>{row.paymentMethod}</td>
              <td className='px-4 py-3.5 text-right font-mono font-semibold tabular-nums'>{new Intl.NumberFormat('uz-UZ').format(row.amount)} UZS</td>
              <td className='px-4 py-3.5 whitespace-nowrap text-muted-foreground'>{new Date(row.paidAt).toLocaleDateString('uz-UZ')}</td>
              <td className='px-4 py-3.5'><Badge variant={row.status === 'paid' ? 'secondary' : 'outline'} className='rounded-md'>{row.status}</Badge></td>
              <td className='px-4 py-3.5 text-right'><Button variant='ghost' size='sm' onClick={() => onOpen(row)}>Ko‘rish</Button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

**Server-side request shakli:**

```ts
const params = new URLSearchParams({
  q: filters.q,
  status: filters.status === 'all' ? '' : filters.status,
  method: filters.method === 'all' ? '' : filters.method,
  from: filters.from,
  to: filters.to,
  page: String(page),
  pageSize: '25',
})
const payments = await getApiData<{ items: PaymentRow[]; total: number }>(`/api/v1/finance/payments?${params}`)
```

### 4.3. Responsive lead Kanban

```tsx
import { MoreHorizontal, Phone, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type LeadStage = 'NEW' | 'CONTACTED' | 'TRIAL LESSON' | 'APPROVED' | 'CONVERTED' | 'REJECTED'
type Lead = { id: string; name: string; phone: string; status: LeadStage; courseName?: string; createdAt: string; notes?: string | null }

const stageMeta: Record<LeadStage, { label: string; accent: string }> = {
  NEW: { label: 'Yangi', accent: 'bg-sky-500' }, CONTACTED: { label: 'Aloqada', accent: 'bg-violet-500' }, 'TRIAL LESSON': { label: 'Sinov darsi', accent: 'bg-amber-500' }, APPROVED: { label: 'Tasdiqlangan', accent: 'bg-emerald-500' }, CONVERTED: { label: 'Qabul qilingan', accent: 'bg-slate-700' }, REJECTED: { label: 'Rad etilgan', accent: 'bg-muted-foreground' },
}

export function LeadKanban({ leads, onStageChange, onOpen }: { leads: Lead[]; onStageChange: (id: string, status: LeadStage) => void; onOpen: (lead: Lead) => void }) {
  const stages = Object.keys(stageMeta) as LeadStage[]
  return (
    <div className='-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-3'>
      {stages.map((stage) => {
        const items = leads.filter((lead) => lead.status === stage)
        const meta = stageMeta[stage]
        return (
          <section key={stage} className='w-[300px] min-w-[300px] snap-start rounded-2xl bg-muted/45 p-3 sm:w-[320px] sm:min-w-[320px]' aria-label={`${meta.label}: ${items.length} ta lead`}>
            <div className='mb-3 flex items-center justify-between'>
              <div className='flex items-center gap-2'><span className={`size-2 rounded-full ${meta.accent}`} /><h3 className='text-sm font-bold'>{meta.label}</h3><Badge variant='secondary' className='rounded-md'>{items.length}</Badge></div>
              <Button variant='ghost' size='icon' className='size-8'><MoreHorizontal className='size-4' /></Button>
            </div>
            <div className='space-y-2'>
              {items.map((lead) => (
                <article key={lead.id} className='rounded-xl border bg-card p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md'>
                  <button className='w-full text-left' onClick={() => onOpen(lead)}><p className='font-semibold'>{lead.name}</p><p className='mt-1 text-xs text-muted-foreground'>{lead.courseName ?? 'Kurs tanlanmagan'}</p></button>
                  <div className='mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground'><span className='flex min-w-0 items-center gap-1 truncate'><Phone className='size-3.5' />{lead.phone}</span><span>{new Date(lead.createdAt).toLocaleDateString('uz-UZ')}</span></div>
                  <div className='mt-3 flex items-center justify-between border-t pt-2'><button className='flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground' onClick={() => onOpen(lead)}><UserRound className='size-3.5' /> Profil</button><select aria-label={`${lead.name} statusini o‘zgartirish`} className='rounded-md border bg-background px-2 py-1 text-xs' value={lead.status} onChange={(event) => onStageChange(lead.id, event.target.value as LeadStage)}><option value={lead.status}>{meta.label}</option>{stages.filter((value) => value !== lead.status).map((value) => <option key={value} value={value}>{stageMeta[value].label}</option>)}</select></div>
                </article>
              ))}
              {items.length === 0 && <div className='rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground'>Bu bosqichda lead yo‘q</div>}
            </div>
          </section>
        )
      })}
    </div>
  )
}
```

### 4.4. Attendance responsive matrix/card fallback

```tsx
type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused'
type AttendanceStudent = { id: string; name: string; avatarUrl?: string | null }
type AttendanceSession = { id: string; label: string; date: string }

type AttendanceGridProps = {
  students: AttendanceStudent[]
  sessions: AttendanceSession[]
  values: Record<string, AttendanceStatus>
  onChange: (studentId: string, sessionId: string, value: AttendanceStatus) => void
}

const attendanceTone: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-500 text-white', late: 'bg-amber-500 text-white', absent: 'bg-slate-900 text-white', excused: 'bg-slate-200 text-slate-700',
}

export function AttendanceGrid({ students, sessions, values, onChange }: AttendanceGridProps) {
  return (
    <div className='overflow-x-auto rounded-2xl border'>
      <table className='w-full min-w-[720px] text-sm'>
        <thead className='bg-muted/70'><tr className='border-b text-left text-xs text-muted-foreground'><th className='sticky start-0 z-10 bg-muted/90 px-4 py-3'>O‘quvchi</th>{sessions.map((session) => <th key={session.id} className='px-3 py-3 text-center'><span className='block font-semibold'>{session.label}</span><span className='text-[11px] font-normal'>{session.date}</span></th>)}</tr></thead>
        <tbody className='divide-y'>
          {students.map((student) => <tr key={student.id} className='hover:bg-muted/35'><td className='sticky start-0 bg-card px-4 py-3 font-medium'>{student.name}</td>{sessions.map((session) => { const key = `${student.id}:${session.id}`; const value = values[key] ?? 'absent'; return <td key={session.id} className='px-3 py-3 text-center'><button type='button' aria-label={`${student.name}, ${session.label}: ${value}`} onClick={() => onChange(student.id, session.id, value === 'present' ? 'late' : value === 'late' ? 'absent' : value === 'absent' ? 'excused' : 'present')} className={`inline-flex size-8 items-center justify-center rounded-lg text-xs font-bold transition ${attendanceTone[value]}`}>{value === 'present' ? 'P' : value === 'late' ? 'L' : value === 'excused' ? 'E' : 'A'}</button></td> })}</tr>)}
        </tbody>
      </table>
    </div>
  )
}
```

> Mobile’da `min-w` table horizontal scroll bo‘lib qoladi. Agar mobilga yanada qulayroq ko‘rinish kerak bo‘lsa, `md:` breakpoint’da table, undan pastda har bir student’ni `Card` va sessions’ni stacked buttons sifatida render qiling. Muhimi, “responsive”ni column’larni maydalash bilan emas, interaction model’ni almashtirish bilan bajaring.

---

## 5. Backend contract va Drizzle ishlari

### 5.1. Manager trend query

`ManagerService.getDashboardStats()` scalar KPI’larni saqlab qoladi. Alohida private method qo‘shib, PostgreSQL’da kunlik aggregate qaytaring:

```ts
// Pseudocode: actual column aliases and date truncation should be tested in PostgreSQL.
const trend = await this.db.execute(sql`
  select
    to_char(date_series.day, 'DD Mon') as label,
    coalesce(sum(p.amount) filter (where p.status = 'paid'), 0) as revenue,
    coalesce(avg(case
      when ar.status = 'present' then 100
      when ar.status = 'late' then 50
      else 0
    end), 0) as attendance
  from generate_series(
    current_date - interval '29 days', current_date, interval '1 day'
  ) as date_series(day)
  left join ${payments} p on date(p.paid_at) = date_series.day
  left join ${attendanceSessions} s on s.session_date = date_series.day
  left join ${attendanceRecords} ar on ar.session_id = s.id
  where p.academy_id = ${academyId} or s.academy_id = ${academyId}
  group by date_series.day
  order by date_series.day
`)
```

Productionda `OR` bilan bog‘liq aggregate double counting’ni oldini olish uchun revenue va attendance’ni ikkita queryda alohida hisoblab, date label bo‘yicha merge qilish xavfsizroq.

### 5.2. Finance list query

Controller’da query DTO yoki zod schema ishlating:

```ts
export const financePaymentQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(['paid', 'refunded', 'pending']).optional(),
  method: paymentMethodEnum.optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(10).max(100).default(25),
})
```

`FinanceService.listPayments()`da `and(...)`, `ilike`, `gte`, `lte`, `limit`, `offset` ishlatib `{ items, total, page, pageSize }` qaytaring. UI’da filterlar URL query state bilan sinxron bo‘lsin.

### 5.3. Lead status canonicalization

```ts
export const LEAD_STAGES = [
  'NEW', 'CONTACTED', 'TRIAL LESSON', 'APPROVED', 'CONVERTED', 'REJECTED',
] as const
export type LeadStage = typeof LEAD_STAGES[number]

export const leadStageLabel: Record<LeadStage, string> = {
  NEW: 'Yangi', CONTACTED: 'Aloqada', 'TRIAL LESSON': 'Sinov darsi',
  APPROVED: 'Tasdiqlangan', CONVERTED: 'Qabul qilingan', REJECTED: 'Rad etilgan',
}
```

`Interested`, `Enrolled`, `Lost` kabi presentation label’lar storage value sifatida ishlatilmasin.

### 5.4. Attendance session endpoint

Qo‘shish tavsiya qilinadi:

```text
GET /api/v1/attendance/sessions?groupId=<uuid>&from=2026-09-01&to=2026-09-30
```

Response:

```ts
{
  items: [{
    id: string,
    groupId: string,
    sessionDate: string,
    present: number,
    late: number,
    absent: number,
    excused: number,
    attendanceRate: number
  }],
  total: number
}
```

---

## 6. Bosqichma-bosqich delivery plan

### Phase 0 — foundation (0.5–1 kun)

- `LEAD_STAGES`, money/date format va status badge map’larini bitta shared `src/lib/crm-ui.ts`ga ko‘chirish.
- Dashboard/finance/leads/attendance’da static seed va API response orasidagi mappingni alohida hooklarga ajratish.
- Filter state’ni URL query bilan saqlash.
- Loading, empty, error state’larni standartlashtirish.

### Phase 1 — Manager dashboard (1–2 kun)

- KPI cards va trend chart’ni yuqoridagi `ManagerOverview` strukturasiga o‘tkazish.
- `/manager/dashboard` response’iga `trend`, `groups`, `updatedAt` qo‘shish.
- “Today’s focus”ni real lead count, overdue invoice count va low attendance count bilan bog‘lash.
- Mock data’dan kelayotgan `+12.5%` kabi qiymatlarni server comparison yoki `N/A` bilan almashtirish.

### Phase 2 — Finance (2–3 kun)

- `FinanceFilterBar`ni mavjud `FinanceDashboard` ichiga joylashtirish.
- Server-side pagination/filtering.
- `Payments`, `Invoices`, `Debtors`, `Refunds` tablari uchun yagona table shell.
- Payment detail drawer, refund confirmation va idempotency key’ni UI submit flow’da saqlash.
- `GET /summary`dan kelgan real `netRevenue`, `overdueBalance`, `collectionRate`ni KPI’larda ko‘rsatish.

### Phase 3 — Leads + attendance (2–3 kun)

- Leads table va Kanban’ni bir xil query datasetidan render qilish.
- Status change’ni backend mutationga ulash; local-only update qilmaslik.
- Attendance desktop matrix + mobile card fallback.
- Bulk save’da faqat dirty cells yuborish, success/error toast va retry.

### Phase 4 — quality pass (1 kun)

- 375px, 768px, 1280px, 1440px viewport test.
- Keyboard-only navigation va visible focus ring.
- `prefers-reduced-motion` tekshiruvi.
- API enabled/disabled holatlari, 401/403, empty academy va zero-state testlari.
- `pnpm lint`, `pnpm build`, mavjud Vitest testlari.

---

## 7. Definition of done

- Manager birinchi viewport’da **o‘quvchilar, tushum, qarz, davomat**ni ko‘radi.
- Chartlar static seed emas, API aggregate bilan ishlaydi yoki “demo data” ekanini aniq bildiradi.
- Finance table’da qidirish, date range, status, payment method va reset ishlaydi.
- Money qiymatlari `UZS` bilan, right-aligned va tabular numerals’da ko‘rsatiladi.
- Lead Kanban backend enum’lariga mos, mobile’da horizontal scroll, table view bilan bir xil datasetdan ishlaydi.
- Attendance’da desktop matrix va mobile-friendly fallback mavjud.
- Har bir muhim action auth/RBAC va permission guard bilan himoyalangan.
- Refero obunasi tiklangach, final visual review aynan Refero screen reference’lari bilan qayta tekshiriladi; hozirgi dizayn Refero’dan nusxa olingan deb taqdim etilmaydi.

## Yakuniy tavsiya

Eng katta UX foyda ranglarni almashtirishdan emas, **server-side filter contract’larini to‘g‘rilash, canonical statuslar, real trend aggregatsiyasi va bir xil table/kanban dataset**ni joriy qilishdan keladi. Visual qatlam esa mavjud Sfera green tokenlari, sokin surface/border, zich lekin o‘qiladigan table va intentional responsive behavior bilan yangilanishi kerak.
