import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChevronRight,
  Clock3,
  Database,
  LayoutDashboard,
  ListTodo,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  Sparkles,
  Target,
  UserCog,
  UserRound,
  UsersRound,
  XCircle,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuthStore } from '@/stores/auth-store'
import {
  formatApiCurrency,
  getApiData,
  isBackendEnabled,
  type ManagerDashboardApi,
} from '@/lib/api-client'
import { useCrmStore } from '@/lib/crm-store'
import { getPrimaryRole } from '@/lib/rbac'
import { useLanguage } from '@/context/language-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ManagerScorecards } from '@/features/crm-ui/manager-scorecards'

const revenue = [
  { day: 'Dush', value: 1.2 },
  { day: 'Sesh', value: 1.8 },
  { day: 'Chor', value: 1.4 },
  { day: 'Pay', value: 2.4 },
  { day: 'Jum', value: 2.1 },
  { day: 'Shan', value: 3.2 },
  { day: 'Yak', value: 2.8 },
]
const revenueByRange: Record<string, { day: string; value: number }[]> = {
  Kun: [
    { day: '09:00', value: 0.4 },
    { day: '12:00', value: 0.7 },
    { day: '15:00', value: 0.5 },
    { day: '18:00', value: 1.1 },
    { day: '21:00', value: 0.8 },
  ],
  Hafta: revenue,
  Oy: [
    { day: '1-hafta', value: 8.4 },
    { day: '2-hafta', value: 11.2 },
    { day: '3-hafta', value: 9.8 },
    { day: '4-hafta', value: 14.6 },
  ],
}
// English key aliases map to the same data
revenueByRange['Day'] = revenueByRange['Kun']
revenueByRange['Week'] = revenueByRange['Hafta']
revenueByRange['Month'] = revenueByRange['Oy']

// Maps for period label display
const periodLabelUz: Record<string, string> = { Kun: 'Kun', Hafta: 'Hafta', Oy: 'Oy', Day: 'Kun', Week: 'Hafta', Month: 'Oy' }
const periodKeyEn: Record<string, string> = { Kun: 'day', Hafta: 'week', Oy: 'month', Day: 'day', Week: 'week', Month: 'month' }
const stages = [
  { key: 'NEW', label: 'Yangi', tone: 'bg-sky-500' },
  { key: 'CONTACTED', label: 'Aloqada', tone: 'bg-violet-500' },
  { key: 'TRIAL LESSON', label: 'Sinov darsi', tone: 'bg-amber-500' },
  { key: 'APPROVED', label: 'Tasdiqlangan', tone: 'bg-emerald-500' },
  { key: 'ENROLLED', label: 'Qabul qilingan', tone: 'bg-teal-500' },
] as const
const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
const focusTone: Record<string, string> = {
  amber: 'bg-amber-500/10 hover:bg-amber-500/15 text-amber-600',
  rose: 'bg-rose-500/10 hover:bg-rose-500/15 text-rose-600',
  emerald: 'bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-600',
}

export function Dashboard() {
  const role = getPrimaryRole(useAuthStore((state) => state.auth.user?.role))
  return role === 'Super Admin' || role === 'Admin' ? (
    <AdminDashboard role={role} />
  ) : (
    <ManagerDashboard />
  )
}

function AdminDashboard({ role }: { role: 'Super Admin' | 'Admin' }) {
  const { language } = useLanguage()
  const uz = language !== 'en'
  const crm = useCrmStore()
  const activeStudents = crm.students.filter(
    (student) => student.status === 'active'
  )
  const totalCapacity = crm.groups.reduce(
    (sum, group) => sum + group.capacity,
    0
  )
  const usedCapacity = crm.groups.reduce(
    (sum, group) => sum + group.studentIds.length,
    0
  )
  const attendance = Math.round(
    activeStudents.reduce((sum, student) => sum + student.attendance, 0) /
      Math.max(activeStudents.length, 1)
  )
  const taskSnapshot = { all: 12, completed: 7, progress: 3, overdue: 2 }
  const adminStats = [
    {
      label: uz ? 'Jami foydalanuvchilar' : 'Total users',
      value: crm.students.length + 11,
      note: uz ? '+12% bu oy' : '+12% this month',
      icon: UsersRound,
      tone: 'text-indigo-600 bg-indigo-500/10',
    },
    {
      label: uz ? 'Faol o‘quvchilar' : 'Active learners',
      value: activeStudents.length,
      note: uz
        ? `${attendance}% o‘rtacha davomat`
        : `${attendance}% avg attendance`,
      icon: UserRound,
      tone: 'text-emerald-600 bg-emerald-500/10',
    },
    {
      label: uz ? 'Faol guruhlar' : 'Active groups',
      value: crm.groups.length,
      note: uz
        ? `${Math.round((usedCapacity / Math.max(totalCapacity, 1)) * 100)}% band`
        : `${Math.round((usedCapacity / Math.max(totalCapacity, 1)) * 100)}% capacity`,
      icon: Database,
      tone: 'text-cyan-600 bg-cyan-500/10',
    },
    {
      label: uz ? 'Tizim holati' : 'System health',
      value: '99.9%',
      note: uz ? 'Barcha xizmatlar faol' : 'All services operational',
      icon: Activity,
      tone: 'text-violet-600 bg-violet-500/10',
    },
  ]
  const roleData = [
    { name: uz ? 'O‘quvchilar' : 'Learners', value: 46, color: '#6366f1' },
    { name: uz ? 'O‘qituvchilar' : 'Teachers', value: 24, color: '#10b981' },
    { name: uz ? 'Menejerlar' : 'Managers', value: 18, color: '#06b6d4' },
    { name: uz ? 'Adminlar' : 'Admins', value: 12, color: '#a855f7' },
  ]
  const activityData = [
    { name: uz ? 'Apr' : 'Apr', users: 22, sessions: 68 },
    { name: 'May', users: 31, sessions: 76 },
    { name: 'Iyun', users: 38, sessions: 82 },
    { name: 'Iyul', users: 44, sessions: 91 },
    { name: 'Avg', users: 51, sessions: 98 },
    { name: 'Sen', users: 64, sessions: 112 },
  ]
  const performanceData = [
    { name: 'Dush', attendance: 88, completion: 74 },
    { name: 'Sesh', attendance: 91, completion: 81 },
    { name: 'Chor', attendance: 86, completion: 78 },
    { name: 'Pay', attendance: 94, completion: 87 },
    { name: 'Jum', attendance: 92, completion: 90 },
    { name: 'Shan', attendance: 96, completion: 93 },
  ]
  const controlItems = [
    {
      href: '/users',
      icon: UsersRound,
      title: uz ? 'Foydalanuvchilar' : 'Users',
      text: uz
        ? 'Accountlar va rollarni boshqaring'
        : 'Manage accounts and roles',
      tone: 'text-indigo-600 bg-indigo-500/10',
    },
    {
      href: '/users/manage',
      icon: ShieldCheck,
      title: uz ? 'Rollar va huquqlar' : 'Roles & permissions',
      text: uz ? 'Kirish darajalarini sozlang' : 'Configure access levels',
      tone: 'text-violet-600 bg-violet-500/10',
    },
    {
      href: '/tasks',
      icon: ListTodo,
      title: uz ? 'Vazifalar markazi' : 'Task center',
      text: uz ? 'Jamoaga vazifa bering' : 'Assign work to the team',
      tone: 'text-cyan-600 bg-cyan-500/10',
    },
    {
      href: '/settings/security',
      icon: ShieldCheck,
      title: uz ? 'Xavfsizlik' : 'Security',
      text: uz ? 'Sessiyalar va himoya' : 'Sessions and protection',
      tone: 'text-emerald-600 bg-emerald-500/10',
    },
  ]
  return (
    <div className='min-h-screen bg-[#f5f7fb] dark:bg-[#080d18]'>
      <Header className='border-0 bg-[#f5f7fb]/90 dark:bg-[#080d18]/90'>
        <div className='flex items-center gap-3'>
          <div className='flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25'>
            <ShieldCheck className='size-5' />
          </div>
          <div className='hidden sm:block'>
            <p className='text-[10px] font-black tracking-[0.22em] text-indigo-600 uppercase'>
              SFERA / ADMIN
            </p>
            <p className='text-sm font-semibold'>
              {uz ? 'Boshqaruv markazi' : 'Administration center'}
            </p>
          </div>
        </div>
        <div className='ms-auto flex items-center gap-2'>
          <Button
            variant='ghost'
            size='icon'
            className='panel-icon-button rounded-xl'
          >
            <Bell className='size-4' />
          </Button>
          <ThemeSwitch />
          <div className='flex size-9 items-center justify-center rounded-xl bg-indigo-100 text-xs font-black text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'>
            <UserCog className='size-4' />
          </div>
          <span className='hidden text-xs font-semibold sm:block'>{role}</span>
        </div>
      </Header>
      <Main
        fluid
        className='mx-auto max-w-[1540px] px-4 pt-5 pb-14 sm:px-6 lg:px-10'
      >
        <section className='admin-control-surface relative overflow-hidden rounded-[2rem] border border-indigo-100/80 bg-gradient-to-br from-white via-indigo-50/70 to-violet-50/80 px-6 py-8 shadow-sm sm:px-9 sm:py-9 dark:border-indigo-400/10 dark:from-slate-900 dark:via-indigo-950/35 dark:to-violet-950/25'>
          <div className='admin-grid-pattern pointer-events-none absolute inset-0 opacity-60' />
          <div className='relative z-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-end'>
            <div>
              <div className='mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-3 py-1.5 text-[11px] font-black tracking-[0.16em] text-indigo-700 uppercase dark:border-indigo-400/20 dark:bg-white/5 dark:text-indigo-300'>
                <span className='size-1.5 animate-pulse rounded-full bg-emerald-500' />{' '}
                {uz ? 'Jonli nazorat' : 'Live control'}
              </div>
              <p className='admin-eyebrow'>
                {uz
                  ? role === 'Super Admin'
                    ? 'Bosh administrator'
                    : 'Administrator'
                  : 'Administrator workspace'}
              </p>
              <h1 className='mt-2 max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-5xl dark:text-white'>
                {uz
                  ? 'Akademiya tizimini bir joydan boshqaring.'
                  : 'Run every academy operation from one place.'}
              </h1>
              <p className='mt-3 max-w-2xl text-sm leading-6 text-muted-foreground'>
                {uz
                  ? 'Foydalanuvchilar, xavfsizlik, vazifalar va faoliyat ko‘rsatkichlari bo‘yicha to‘liq, jonli ko‘rinish.'
                  : 'A complete live view of users, security, tasks and platform performance.'}
              </p>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button
                asChild
                className='rounded-xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500'
              >
                <a href='/tasks'>
                  <ListTodo className='me-2 size-4' />
                  {uz ? 'Vazifa berish' : 'Assign task'}
                </a>
              </Button>
              <Button
                variant='outline'
                asChild
                className='rounded-xl border-indigo-200 bg-white/70 font-bold dark:bg-white/5'
              >
                <a href='/users'>
                  <UserCog className='me-2 size-4' />
                  {uz ? 'Jamoani ko‘rish' : 'View team'}
                </a>
              </Button>
            </div>
          </div>
          <div className='relative z-10 mt-8 grid gap-3 border-t border-indigo-200/70 pt-5 text-xs sm:grid-cols-3 dark:border-white/10'>
            <div className='flex items-center gap-2 text-muted-foreground'>
              <CalendarDays className='size-4 text-indigo-500' /> 1-oktabr, 2026
            </div>
            <div className='flex items-center gap-2 text-muted-foreground'>
              <Clock3 className='size-4 text-cyan-500' />{' '}
              {uz ? 'Oxirgi yangilanish: hozir' : 'Last updated: now'}
            </div>
            <div className='flex items-center gap-2 text-muted-foreground'>
              <Sparkles className='size-4 text-violet-500' />{' '}
              {uz ? '12 ta faol jarayon' : '12 active workflows'}
            </div>
          </div>
        </section>
        <div className='mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {adminStats.map((card) => {
            const Icon = card.icon
            return (
              <Card
                key={card.label}
                className='admin-stat-card rounded-2xl border-0 shadow-sm'
              >
                <CardContent className='flex items-center justify-between p-5'>
                  <div>
                    <p className='text-xs font-semibold text-muted-foreground'>
                      {card.label}
                    </p>
                    <p className='mt-2 text-3xl font-black'>{card.value}</p>
                    <p className='mt-1 text-[11px] font-semibold text-emerald-600'>
                      {card.note}
                    </p>
                  </div>
                  <span
                    className={`admin-stat-icon flex size-12 items-center justify-center rounded-2xl ${card.tone}`}
                  >
                    <Icon className='size-5' />
                  </span>
                </CardContent>
              </Card>
            )
          })}
        </div>
        <div className='mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]'>
          <Card className='rounded-2xl border-0 shadow-sm'>
            <CardHeader>
              <CardTitle className='text-base'>
                {uz ? 'Platforma faolligi' : 'Platform activity'}
              </CardTitle>
              <p className='text-xs text-muted-foreground'>
                {uz
                  ? 'Foydalanuvchilar va sessiyalar dinamikasi'
                  : 'User growth and sessions over time'}
              </p>
            </CardHeader>
            <CardContent>
              <div className='h-[270px]'>
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart data={activityData}>
                    <CartesianGrid
                      strokeDasharray='3 3'
                      vertical={false}
                      opacity={0.12}
                    />
                    <XAxis dataKey='name' axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 14,
                        border: '1px solid var(--border)',
                        background: 'var(--card)',
                      }}
                    />
                    <Line
                      type='monotone'
                      dataKey='users'
                      name={uz ? 'Foydalanuvchilar' : 'Users'}
                      stroke='#6366f1'
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type='monotone'
                      dataKey='sessions'
                      name={uz ? 'Sessiyalar' : 'Sessions'}
                      stroke='#06b6d4'
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card className='rounded-2xl border-0 shadow-sm'>
            <CardHeader>
              <CardTitle className='text-base'>
                {uz ? 'Rollar taqsimoti' : 'Role distribution'}
              </CardTitle>
              <p className='text-xs text-muted-foreground'>
                {uz
                  ? 'Platformadagi foydalanuvchilar tarkibi'
                  : 'People across the platform'}
              </p>
            </CardHeader>
            <CardContent>
              <div className='relative h-[205px]'>
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={roleData}
                      dataKey='value'
                      nameKey='name'
                      innerRadius={57}
                      outerRadius={82}
                      paddingAngle={4}
                    >
                      {roleData.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
                  <span className='text-3xl font-black'>100%</span>
                  <span className='text-[10px] font-semibold text-muted-foreground'>
                    {uz ? 'tarkib' : 'mix'}
                  </span>
                </div>
              </div>
              <div className='grid grid-cols-2 gap-2'>
                {roleData.map((item) => (
                  <div
                    key={item.name}
                    className='flex items-center gap-2 text-[11px]'
                  >
                    <span
                      className='size-2 rounded-full'
                      style={{ backgroundColor: item.color }}
                    />
                    <span className='text-muted-foreground'>{item.name}</span>
                    <b className='ms-auto'>{item.value}%</b>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className='mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]'>
          <Card className='rounded-2xl border-0 shadow-sm'>
            <CardHeader>
              <CardTitle className='text-base'>
                {uz
                  ? 'Ta’lim sifati ko‘rsatkichlari'
                  : 'Learning quality metrics'}
              </CardTitle>
              <p className='text-xs text-muted-foreground'>
                {uz
                  ? 'Davomat va topshiriqlar bajarilishi'
                  : 'Attendance and completion performance'}
              </p>
            </CardHeader>
            <CardContent>
              <div className='h-[245px]'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={performanceData} barGap={7}>
                    <CartesianGrid
                      strokeDasharray='3 3'
                      vertical={false}
                      opacity={0.12}
                    />
                    <XAxis dataKey='name' axisLine={false} tickLine={false} />
                    <YAxis
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip formatter={(v) => [`${v}%`, '']} />
                    <Bar
                      dataKey='attendance'
                      name={uz ? 'Davomat' : 'Attendance'}
                      fill='#10b981'
                      radius={[7, 7, 0, 0]}
                    />
                    <Bar
                      dataKey='completion'
                      name={uz ? 'Bajarilish' : 'Completion'}
                      fill='#6366f1'
                      radius={[7, 7, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card className='rounded-2xl border-0 shadow-sm'>
            <CardHeader>
              <CardTitle className='text-base'>
                {uz ? 'Vazifalar holati' : 'Task health'}
              </CardTitle>
              <p className='text-xs text-muted-foreground'>
                {uz
                  ? 'Jamoa ishlarining umumiy holati'
                  : 'Overall team workload'}
              </p>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-end justify-between'>
                <div>
                  <p className='text-4xl font-black'>{taskSnapshot.all}</p>
                  <p className='text-xs text-muted-foreground'>
                    {uz ? 'jami vazifa' : 'total tasks'}
                  </p>
                </div>
                <Badge className='rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10'>
                  {Math.round(
                    (taskSnapshot.completed / taskSnapshot.all) * 100
                  )}
                  % {uz ? 'bajarildi' : 'complete'}
                </Badge>
              </div>
              {[
                {
                  label: uz ? 'Bajarilgan' : 'Completed',
                  value: taskSnapshot.completed,
                  tone: 'bg-emerald-500',
                },
                {
                  label: uz ? 'Jarayonda' : 'In progress',
                  value: taskSnapshot.progress,
                  tone: 'bg-indigo-500',
                },
                {
                  label: uz ? 'Muddati o‘tgan' : 'Overdue',
                  value: taskSnapshot.overdue,
                  tone: 'bg-rose-500',
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className='mb-1 flex justify-between text-xs'>
                    <span className='font-semibold'>{item.label}</span>
                    <b>{item.value}</b>
                  </div>
                  <div className='h-2 overflow-hidden rounded-full bg-muted'>
                    <div
                      className={`h-full rounded-full ${item.tone}`}
                      style={{
                        width: `${(item.value / taskSnapshot.all) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
              <Button
                asChild
                variant='outline'
                className='mt-1 w-full rounded-xl'
              >
                <a href='/tasks'>
                  {uz ? 'Barcha vazifalarni ochish' : 'Open task center'}
                  <ChevronRight className='ms-2 size-4' />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className='mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
          <Card className='rounded-2xl border-0 shadow-sm'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base'>
                <ShieldCheck className='size-4 text-indigo-600' />
                {uz ? 'Tezkor boshqaruv' : 'Quick control'}
              </CardTitle>
              <p className='text-xs text-muted-foreground'>
                {uz
                  ? 'Eng ko‘p ishlatiladigan administrator amallari'
                  : 'Most used administrator actions'}
              </p>
            </CardHeader>
            <CardContent className='grid gap-3 sm:grid-cols-2'>
              {controlItems.map((item) => {
                const Icon = item.icon
                return (
                  <a
                    className='admin-action-tile'
                    href={item.href}
                    key={item.title}
                  >
                    <span
                      className={`flex size-10 items-center justify-center rounded-xl ${item.tone}`}
                    >
                      <Icon className='size-5' />
                    </span>
                    <span>
                      <b>{item.title}</b>
                      <small>{item.text}</small>
                    </span>
                    <ChevronRight className='ms-auto size-4 text-muted-foreground' />
                  </a>
                )
              })}
            </CardContent>
          </Card>
          <Card className='rounded-2xl border-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 text-white shadow-xl shadow-indigo-500/15'>
            <CardContent className='flex h-full flex-col justify-between p-6'>
              <div>
                <div className='mb-5 flex size-11 items-center justify-center rounded-2xl bg-white/10'>
                  <Database className='size-5 text-indigo-300' />
                </div>
                <p className='text-xs font-bold tracking-[0.18em] text-indigo-300 uppercase'>
                  {uz ? 'Tizim ishonchliligi' : 'System reliability'}
                </p>
                <p className='mt-2 text-4xl font-black'>99.9%</p>
                <p className='mt-2 text-sm leading-6 text-slate-300'>
                  {uz
                    ? 'API, PostgreSQL, autentifikatsiya va permission qatlamlari barqaror ishlayapti.'
                    : 'API, PostgreSQL, authentication and permission layers are operating normally.'}
                </p>
              </div>
              <div className='mt-6 grid grid-cols-2 gap-3 text-xs'>
                <div className='rounded-xl bg-white/10 p-3'>
                  <b className='block text-lg'>24/7</b>
                  <span className='text-slate-300'>
                    {uz ? 'monitoring' : 'monitoring'}
                  </span>
                </div>
                <div className='rounded-xl bg-white/10 p-3'>
                  <b className='block text-lg'>0</b>
                  <span className='text-slate-300'>
                    {uz ? 'kritik xato' : 'critical errors'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </div>
  )
}
function ManagerDashboard() {
  const { language } = useLanguage()
  const uz = language !== 'en'
  const crm = useCrmStore()
  const currentRole = useAuthStore(
    (state) => state.auth.user?.role?.[0] || 'Manager'
  )
  const [range, setRange] = useState(() => uz ? 'Hafta' : 'Week')
  const [apiStats, setApiStats] = useState<ManagerDashboardApi | null>(null)
  useEffect(() => {
    if (!isBackendEnabled()) return
    let mounted = true
    const load = () =>
      void Promise.all([
        getApiData<ManagerDashboardApi>('/manager/dashboard'),
        getApiData<Array<{ label: string; revenue: number }>>(
          '/manager/dashboard/revenue-trend'
        ),
      ])
        .then(([data, revenueTrend]) => {
          if (mounted) setApiStats({ ...data, revenueTrend })
        })
        .catch(() => {
          if (mounted) setApiStats(null)
        })
    load()
    const timer = window.setInterval(load, 30000)
    return () => {
      mounted = false
      window.clearInterval(timer)
    }
  }, [])
  const active = crm.students.filter((s) => s.status === 'active')
  const collected = crm.payments.reduce((sum, p) => sum + p.amount, 0)
  const attendance = Math.round(
    active.reduce((sum, s) => sum + s.attendance, 0) /
      Math.max(active.length, 1)
  )
  const newLeads = crm.applications.filter((a) => a.status === 'NEW').length
  const liveStudents = apiStats?.totalStudents ?? active.length
  const liveRevenue = apiStats?.monthlyRevenue ?? collected
  const liveLeads = apiStats?.pendingApplications ?? newLeads
  const risks = [...active]
    .sort((a, b) => a.attendance - b.attendance)
    .slice(0, 3)
  const pipeline = stages.map((s) => ({
    ...s,
    count: crm.applications.filter((a) => a.status === s.key).length,
  }))
  const total = pipeline.reduce((sum, s) => sum + s.count, 0)
  const visibleRevenue = apiStats?.revenueTrend?.length
    ? apiStats.revenueTrend.map((item) => ({
        day: item.label,
        value: item.revenue / 1000000,
      }))
    : revenueByRange[range as keyof typeof revenueByRange] || revenue
  const enrolledLeads = crm.applications.filter(
    (application) => application.status === 'ENROLLED'
  ).length
  const conversionRate = total ? Math.round((enrolledLeads / total) * 100) : 0
  const churnRate = active.length
    ? Math.round(
        (crm.students.filter((student) => student.status !== 'active').length /
          Math.max(crm.students.length, 1)) *
          100
      )
    : 0
  const scorecards = [
    {
      label: uz ? 'Lead konversiyasi' : 'Lead conversion',
      value: `${conversionRate}%`,
      trend: '+8.4%',
      detail: uz ? 'qabul qilingan leadlar' : 'enrolled leads',
      trendDirection: 'up' as const,
      icon: 'conversion' as const,
    },
    {
      label: uz ? 'Oylik tushum' : 'Monthly revenue',
      value: formatApiCurrency(liveRevenue),
      trend: '+18.2%',
      detail: uz ? 'backend ma’lumoti' : 'from API',
      trendDirection: 'up' as const,
      icon: 'revenue' as const,
    },
    {
      label: uz ? 'Faol guruhlar' : 'Active groups',
      value: crm.groups.length,
      trend: `${liveStudents} ${uz ? 'o‘quvchi' : 'learners'}`,
      detail: uz ? 'joriy akademiya' : 'current academy',
      trendDirection: 'neutral' as const,
      icon: 'groups' as const,
    },
    {
      label: uz ? 'Tark etish darajasi' : 'Churn rate',
      value: `${churnRate}%`,
      trend: '-2.1%',
      detail: uz ? 'o‘tgan davrga nisbatan' : 'vs previous period',
      trendDirection: 'down' as const,
      icon: 'churn' as const,
    },
  ]
  return (
    <div className='min-h-screen bg-[#f6f8fb] dark:bg-[#0b1120]'>
      <Header className='border-0 bg-[#f6f8fb]/90 dark:bg-[#0b1120]/90'>
        <div className='flex min-w-0 items-center gap-3'>
          <div className='flex size-9 items-center justify-center rounded-xl bg-[#0d1b2a] text-white shadow-lg'>
            <LayoutDashboard className='size-4' />
          </div>
          <div className='hidden sm:block'>
            <p className='text-[10px] font-black tracking-[0.22em] text-cyan-600 uppercase'>
              SFERA / CRM
            </p>
            <p className='text-sm font-semibold'>Command Center</p>
          </div>
        </div>
        <div className='ms-auto flex items-center gap-2'>
          <Button
            variant='ghost'
            size='icon'
            className='panel-icon-button rounded-xl'
          >
            <Bell className='size-4' />
          </Button>
          <ThemeSwitch />
          <div className='hidden h-8 w-px bg-border sm:block' />
          <div className='flex items-center gap-2 rounded-xl bg-white px-2 py-1.5 shadow-sm dark:bg-slate-900'>
            <div className='flex size-7 items-center justify-center rounded-lg bg-cyan-100 text-xs font-bold text-cyan-700'>
              SA
            </div>
            <span className='hidden text-xs font-semibold sm:block'>
              {currentRole}
            </span>
          </div>
        </div>
      </Header>
      <Main
        fluid
        className='mx-auto max-w-[1500px] px-4 pt-4 pb-12 sm:px-6 lg:px-10'
      >
        <section className='manager-hero relative overflow-hidden rounded-[2rem] bg-[#0d1b2a] px-6 py-7 text-white shadow-2xl sm:px-9 sm:py-9'>
          <div className='pointer-events-none absolute -top-32 -right-24 size-96 rounded-full bg-cyan-400/20 blur-3xl' />
          <div className='pointer-events-none absolute bottom-[-100px] left-1/3 size-72 rounded-full bg-violet-500/15 blur-3xl' />
          <div className='relative z-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-end'>
            <div>
              <div className='mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-bold tracking-[0.16em] text-cyan-200 uppercase'>
                <span className='size-1.5 animate-pulse rounded-full bg-emerald-400' />{' '}
                Live operations
              </div>
              <h1 className='max-w-2xl text-3xl font-black tracking-tight sm:text-5xl'>
                {uz
                  ? 'Bugun akademiyani boshqaring.'
                  : 'Run your academy with clarity.'}
              </h1>
              <p className='mt-3 max-w-xl text-sm leading-6 text-slate-300'>
                {uz
                  ? 'SFERA’dagi muhim ko‘rsatkichlar, leadlar va jamoa harakatlari bir joyda. Bugungi qarorlar uchun tayyor holat.'
                  : 'All the numbers, leads and team actions you need are in one focused view.'}
              </p>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button
                asChild
                className='rounded-xl bg-cyan-400 font-bold text-slate-950 hover:bg-cyan-300'
              >
                <a href='/academy/leads'>
                  <Plus className='me-2 size-4' />
                  {uz ? 'Yangi lead' : 'New lead'}
                </a>
              </Button>
              <Button
                variant='outline'
                asChild
                className='rounded-xl border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white'
              >
                <a href='/academy/reports'>
                  <ArrowUpRight className='me-2 size-4' />
                  {uz ? 'Hisobotlar' : 'Reports'}
                </a>
              </Button>
            </div>
          </div>
          <div className='relative z-10 mt-8 flex flex-wrap gap-6 border-t border-white/10 pt-5 text-xs text-slate-300'>
            <span className='flex items-center gap-2'>
              <CalendarDays className='size-4 text-cyan-300' /> 26 Sentabr, 2026
            </span>
            <span className='flex items-center gap-2'>
              <Clock3 className='size-4 text-cyan-300' /> Oxirgi yangilanish:
              hozir
            </span>
            <span className='flex items-center gap-2'>
              <Sparkles className='size-4 text-amber-300' /> {liveLeads} ta
              yangi imkoniyat
            </span>
          </div>
        </section>
        <div className='mt-6'>
          <ManagerScorecards items={scorecards} />
        </div>
        <div className='mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]'>
          <Card className='manager-chart-card rounded-2xl border-0 shadow-sm'>
            <CardHeader className='px-6 pt-6 pb-2'>
              <div className='min-w-0'>
                <CardTitle className='text-base font-bold'>
                  {uz ? 'Tushum dinamikasi' : 'Revenue performance'}
                </CardTitle>
                <p className='mt-1 text-xs text-muted-foreground'>
                  {uz
                    ? `${periodLabelUz[range]} kesimida tushum, mln so‘mda`
                    : `Revenue by ${periodKeyEn[range]}`}
                </p>
              </div>
              <CardAction className='flex shrink-0 items-center gap-0.5'>
                {(uz ? ['Kun', 'Hafta', 'Oy'] : ['Day', 'Week', 'Month']).map((item) => (
                  <button
                    key={item}
                    onClick={() => setRange(item)}
                    className={`rounded-md px-3 py-1.5 text-[11px] font-bold transition ${range === item ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}
                  >
                    {item}
                  </button>
                ))}
              </CardAction>
            </CardHeader>
            <CardContent className='px-4 pt-3 pb-5'>
              <div className='h-[245px]'>
                <ResponsiveContainer width='100%' height='100%'>
                  <AreaChart
                    data={visibleRevenue}
                    margin={{ top: 10, right: 12, left: -18, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id='sferaRevenue'
                        x1='0'
                        y1='0'
                        x2='0'
                        y2='1'
                      >
                        <stop
                          offset='0%'
                          stopColor='#06b6d4'
                          stopOpacity={0.35}
                        />
                        <stop
                          offset='100%'
                          stopColor='#06b6d4'
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray='3 3'
                      vertical={false}
                      opacity={0.08}
                    />
                    <XAxis
                      dataKey='day'
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `${v}M`}
                    />
                    <Tooltip
                      formatter={(v) => [`${v} mln`, 'Tushum']}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid var(--border)',
                        background: 'var(--card)',
                      }}
                    />
                    <Area
                      type='monotone'
                      dataKey='value'
                      stroke='#06b6d4'
                      strokeWidth={3}
                      fill='url(#sferaRevenue)'
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card className='rounded-2xl border-0 shadow-sm'>
            <CardHeader className='px-6 pt-6 pb-2'>
              <div className='flex items-start justify-between'>
                <div>
                  <CardTitle className='text-base font-bold'>
                    {uz ? 'Bugungi fokus' : 'Today’s focus'}
                  </CardTitle>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    {uz
                      ? 'E’tibor talab qilayotganlar'
                      : 'Items that need attention'}
                  </p>
                </div>
                <Target className='size-5 text-amber-500' />
              </div>
            </CardHeader>
            <CardContent className='space-y-3 px-6 pt-3 pb-6'>
              {[
                {
                  href: '/academy/leads',
                  icon: Target,
                  title: `${liveLeads} ta yangi lead`,
                  note: 'Qayta aloqa kutilmoqda',
                  tone: 'amber',
                },
                {
                  href: '/academy/attendance',
                  icon: XCircle,
                  title: `${risks.length} ta riskli o‘quvchi`,
                  note: 'Davomatni tekshiring',
                  tone: 'rose',
                },
                {
                  href: '/academy/groups',
                  icon: UsersRound,
                  title: `${crm.groups.length} ta faol guruh`,
                  note: 'Bugungi darslar rejalashtirilgan',
                  tone: 'emerald',
                },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <a
                    href={item.href}
                    key={item.title}
                    className={`manager-focus-row flex items-center gap-3 rounded-xl p-3 transition ${focusTone[item.tone]}`}
                  >
                    <span
                      className={`flex size-9 items-center justify-center rounded-lg bg-white/50 ${focusTone[item.tone].split(' ')[2]}`}
                    >
                      <Icon className='size-4' />
                    </span>
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm font-bold'>{item.title}</p>
                      <p className='text-[11px] text-muted-foreground'>
                        {item.note}
                      </p>
                    </div>
                    <ChevronRight className='size-4 text-muted-foreground' />
                  </a>
                )
              })}
            </CardContent>
          </Card>
        </div>
        <div className='mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
          <Card className='rounded-2xl border-0 shadow-sm'>
            <CardHeader className='flex-row items-center justify-between space-y-0 px-6 pt-6 pb-4'>
              <div>
                <CardTitle className='text-base font-bold'>
                  {uz ? 'Leadlar oqimi' : 'Lead pipeline'}
                </CardTitle>
                <p className='mt-1 text-xs text-muted-foreground'>
                  {total} ta aktiv ariza bosqichlar bo‘yicha
                </p>
              </div>
              <Button
                variant='ghost'
                size='sm'
                asChild
                className='text-xs text-cyan-600'
              >
                <a href='/academy/leads'>
                  Barchasini ko‘rish <ChevronRight className='ms-1 size-3' />
                </a>
              </Button>
            </CardHeader>
            <CardContent className='space-y-4 px-6 pb-6'>
              {pipeline.map((stage) => (
                <a
                  href={`/academy/leads?status=${stage.key}`}
                  key={stage.key}
                  className='group block'
                >
                  <div className='mb-1.5 flex items-center justify-between text-xs'>
                    <span className='font-semibold'>{stage.label}</span>
                    <span className='font-black'>{stage.count}</span>
                  </div>
                  <div className='h-2 overflow-hidden rounded-full bg-muted'>
                    <div
                      className={`manager-pipeline-bar h-full rounded-full ${stage.tone} transition-all group-hover:brightness-110`}
                      style={{
                        width: `${Math.max((stage.count / Math.max(total, 1)) * 100, stage.count ? 8 : 0)}%`,
                      }}
                    />
                  </div>
                </a>
              ))}
            </CardContent>
          </Card>
          <Card className='rounded-2xl border-0 shadow-sm'>
            <CardHeader className='flex-row items-center justify-between space-y-0 px-6 pt-6 pb-4'>
              <div>
                <CardTitle className='text-base font-bold'>
                  {uz ? 'Tezkor nazorat' : 'Quick monitor'}
                </CardTitle>
                <p className='mt-1 text-xs text-muted-foreground'>
                  {uz
                    ? 'Eng past davomat ko‘rsatkichlari'
                    : 'Lowest attendance rates'}
                </p>
              </div>
              <MoreHorizontal className='size-5 text-muted-foreground' />
            </CardHeader>
            <CardContent className='space-y-2 px-6 pb-6'>
              {risks.map((student) => (
                <a
                  href='/users'
                  key={student.id}
                  className='flex items-center gap-3 rounded-xl p-2 transition hover:bg-muted/60'
                >
                  <span className='flex size-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300'>
                    {initials(student.name)}
                  </span>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-semibold'>
                      {student.name}
                    </p>
                    <p className='truncate text-[11px] text-muted-foreground'>
                      {student.course}
                    </p>
                  </div>
                  <Badge
                    variant={
                      student.attendance < 70 ? 'destructive' : 'secondary'
                    }
                    className='rounded-md text-[10px]'
                  >
                    {student.attendance}%
                  </Badge>
                </a>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className='mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]'>
          <Card className='rounded-2xl border-0 shadow-sm'>
            <CardHeader className='px-6 pt-6 pb-3'>
              <CardTitle className='text-base font-bold'>
                {uz ? 'Bugungi jadval' : 'Today’s schedule'}
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-2 px-6 pb-6'>
              {crm.groups.map((group, i) => (
                <div
                  key={group.id}
                  className='manager-schedule-row flex items-center gap-3 rounded-xl bg-muted/35 p-3'
                >
                  <div
                    className={`manager-schedule-icon flex size-9 items-center justify-center rounded-lg ${i === 0 ? 'bg-violet-500/10 text-violet-600' : 'bg-cyan-500/10 text-cyan-600'}`}
                  >
                    <Clock3 className='size-4' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-bold'>
                      {group.name} · {group.course}
                    </p>
                    <p className='text-[11px] text-muted-foreground'>
                      {group.schedule} · xona {group.room}
                    </p>
                  </div>
                  <span className='text-xs font-black text-emerald-600'>
                    {group.studentIds.length}/{group.capacity}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className='rounded-2xl border-0 bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/15'>
            <CardContent className='flex h-full flex-col justify-between p-6 sm:p-7'>
              <div>
                <div className='mb-5 flex size-11 items-center justify-center rounded-2xl bg-white/15'>
                  <UserRound className='size-5' />
                </div>
                <p className='text-xs font-bold tracking-[0.18em] text-cyan-100 uppercase'>
                  {uz ? 'Jamoa samaradorligi' : 'Team performance'}
                </p>
                <p className='mt-2 text-3xl font-black'>{attendance + 3}%</p>
                <p className='mt-1 max-w-sm text-sm leading-6 text-cyan-100'>
                  {uz
                    ? 'O‘tgan oyga nisbatan jamoa ko‘rsatkichlari yuqorilamoqda. Shu tempni saqlang.'
                    : 'Your academy is improving month over month. Keep the momentum going.'}
                </p>
              </div>
              <a
                href='/academy/reports'
                className='mt-7 flex items-center justify-between rounded-xl bg-white/15 px-4 py-3 text-sm font-bold transition hover:bg-white/20'
              >
                {uz ? 'To‘liq tahlilni ochish' : 'Open full analytics'}
                <ArrowUpRight className='size-4' />
              </a>
            </CardContent>
          </Card>
        </div>
      </Main>
    </div>
  )
}
