import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  BarChart3,
  CalendarDays,
  FileSpreadsheet,
  LayoutGrid,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/context/language-provider'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

const displayFormSchema = z.object({
  defaultRoute: z.string().min(1),
  pageSize: z.string().min(1),
  compactTables: z.boolean(),
  showKpiCards: z.boolean(),
  showRevenueChart: z.boolean(),
  showRecentLeads: z.boolean(),
  showTodayLessons: z.boolean(),
  showAtRiskStudents: z.boolean(),
})

type DisplayFormValues = z.infer<typeof displayFormSchema>

export function DisplayForm() {
  const { language } = useLanguage()
  const english = language === 'en'
  const [isSaving, setIsSaving] = useState(false)

  const defaultValues: DisplayFormValues = {
    defaultRoute: '/dashboard',
    pageSize: '25',
    compactTables: false,
    showKpiCards: true,
    showRevenueChart: true,
    showRecentLeads: true,
    showTodayLessons: true,
    showAtRiskStudents: true,
  }

  const form = useForm<DisplayFormValues>({
    resolver: zodResolver(displayFormSchema),
    defaultValues,
  })

  function onSubmit(_data: DisplayFormValues) {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      toast.success(
        english
          ? 'Display preferences updated successfully.'
          : 'Displey va ekran sozlamalari muvaffaqiyatli yangilandi.'
      )
    }, 250)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        {/* Boshlang'ich sahifa va jadvallar */}
        <div className='rounded-xl border bg-card/50 p-5 space-y-4'>
          <div>
            <h3 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
              {english ? 'Default Landing & Data Tables' : 'Boshlang‘ich sahifa va jadvallar'}
            </h3>
            <p className='mt-1 text-xs text-muted-foreground'>
              {english
                ? 'Choose your landing screen upon login and default table density.'
                : 'Tizimga kirganda avtomatik ochiladigan sahifa va jadvallar ko‘rinishini tanlang.'}
            </p>
          </div>

          <div className='grid gap-6 md:grid-cols-2'>
            <FormField
              control={form.control}
              name='defaultRoute'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-1.5'>
                    <LayoutGrid className='size-3.5 text-primary' />
                    {english ? 'Default start page' : 'Boshlang‘ich sahifa'}
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='/dashboard'>
                        {english ? 'Main Dashboard' : 'Asosiy Boshqaruv Paneli'}
                      </SelectItem>
                      <SelectItem value='/students'>
                        {english ? 'Students directory' : 'O‘quvchilar ro‘yxati'}
                      </SelectItem>
                      <SelectItem value='/courses'>
                        {english ? 'Courses & Groups' : 'Kurslar va guruhlar'}
                      </SelectItem>
                      <SelectItem value='/finance'>
                        {english ? 'Finance & Payments' : 'Moliya va to‘lovlar'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {english
                      ? 'The page loaded immediately after signing in.'
                      : 'Tizimga kirganingizda birinchi bo‘lib ochiladigan modul.'}
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='pageSize'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-1.5'>
                    <FileSpreadsheet className='size-3.5 text-primary' />
                    {english ? 'Default rows per page' : 'Jadvalda qatorlar soni'}
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='10'>{english ? '10 rows' : '10 ta qator'}</SelectItem>
                      <SelectItem value='25'>{english ? '25 rows (Recommended)' : '25 ta qator (Tavsiya etiladi)'}</SelectItem>
                      <SelectItem value='50'>{english ? '50 rows' : '50 ta qator'}</SelectItem>
                      <SelectItem value='100'>{english ? '100 rows' : '100 ta qator'}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {english
                      ? 'Applies to student, course and financial records.'
                      : 'O‘quvchilar, to‘lovlar va arizalar jadvallarida standart sahifalash.'}
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name='compactTables'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between pt-2'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-sm font-medium'>
                    {english ? 'Compact table row height' : 'Ixcham jadval qatorlari'}
                  </FormLabel>
                  <FormDescription>
                    {english
                      ? 'Reduces vertical row spacing to show more records without scrolling.'
                      : 'Ko‘proq ma’lumotni bir ekranda ko‘rish uchun qatorlar oraliq masofasini qisqartirish.'}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Boshqaruv paneli (Dashboard) modullari */}
        <div className='rounded-xl border bg-card/50 p-5 space-y-4'>
          <div>
            <h3 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
              {english ? 'Dashboard Modules & Widgets' : 'Boshqaruv paneli vidjetlari'}
            </h3>
            <p className='mt-1 text-xs text-muted-foreground'>
              {english
                ? 'Enable or disable sections displayed on your academy overview dashboard.'
                : 'Boshqaruv panelida ko‘rinadigan statistik bloklar va tahliliy jadvallarni sozlang.'}
            </p>
          </div>

          <div className='grid gap-3 sm:grid-cols-2'>
            <FormField
              control={form.control}
              name='showKpiCards'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-3.5'>
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel className='text-sm font-medium flex items-center gap-1.5'>
                      <Users className='size-3.5 text-primary' />
                      {english ? 'KPI statistic cards' : 'Asosiy ko‘rsatkich kartalari'}
                    </FormLabel>
                    <FormDescription className='text-xs'>
                      {english ? 'Students, courses, groups and debt counters.' : 'O‘quvchilar, kurslar, guruhlar va qarzdorlik soni.'}
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='showRevenueChart'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-3.5'>
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel className='text-sm font-medium flex items-center gap-1.5'>
                      <TrendingUp className='size-3.5 text-emerald-500' />
                      {english ? 'Revenue dynamic chart' : 'Tushumlar dinamikasi grafigi'}
                    </FormLabel>
                    <FormDescription className='text-xs'>
                      {english ? 'Monthly cash, card and online payments trend.' : 'Oylik to‘lovlar va daromadlar o‘sish grafigi.'}
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='showTodayLessons'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-3.5'>
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel className='text-sm font-medium flex items-center gap-1.5'>
                      <CalendarDays className='size-3.5 text-sky-500' />
                      {english ? 'Today’s scheduled lessons' : 'Bugungi darslar jadvali'}
                    </FormLabel>
                    <FormDescription className='text-xs'>
                      {english ? 'Real-time daily schedule and room attendance.' : 'Bugungi darslar va xonalar bo‘yicha jadval.'}
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='showRecentLeads'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-3.5'>
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel className='text-sm font-medium flex items-center gap-1.5'>
                      <UserCheck className='size-3.5 text-amber-500' />
                      {english ? 'Recent leads and applications' : 'Yangi tushgan arizalar'}
                    </FormLabel>
                    <FormDescription className='text-xs'>
                      {english ? 'Latest incoming student inquiries and trials.' : 'So‘nggi qoldirilgan arizalar va sinov darsi ro‘yxati.'}
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='showAtRiskStudents'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-3.5'>
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel className='text-sm font-medium flex items-center gap-1.5'>
                      <BarChart3 className='size-3.5 text-rose-500' />
                      {english ? 'Students requiring attention' : 'E’tibor talab qiladigan o‘quvchilar'}
                    </FormLabel>
                    <FormDescription className='text-xs'>
                      {english ? 'Identified by low attendance or overdue balance.' : 'Qoldirilgan darslar yoki qarzdorlik bo‘yicha ro‘yxat.'}
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className='flex justify-end'>
          <Button type='submit' disabled={isSaving} className='min-w-36'>
            {isSaving
              ? english
                ? 'Saving...'
                : 'Saqlanmoqda...'
              : english
                ? 'Save display layout'
                : 'Displeyni saqlash'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
