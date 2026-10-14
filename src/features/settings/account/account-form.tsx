import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Calendar, Clock, Coins, Globe, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage, type Language } from '@/context/language-provider'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const accountFormSchema = z.object({
  language: z.enum(['uz', 'en']),
  timezone: z.string().min(1),
  dateFormat: z.string().min(1),
  timeFormat: z.string().min(1),
  currency: z.string().min(1),
  sessionTimeout: z.string().min(1),
})

type AccountFormValues = z.infer<typeof accountFormSchema>

export function AccountForm() {
  const { language, setLanguage } = useLanguage()
  const english = language === 'en'
  const [isSaving, setIsSaving] = useState(false)

  const defaultValues: AccountFormValues = {
    language: language || 'uz',
    timezone: 'Asia/Tashkent',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    currency: 'UZS',
    sessionTimeout: '8h',
  }

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues,
  })

  function onSubmit(data: AccountFormValues) {
    setIsSaving(true)
    setLanguage(data.language as Language)

    setTimeout(() => {
      setIsSaving(false)
      toast.success(
        english
          ? 'Account preferences saved successfully.'
          : 'Hisob sozlamalari muvaffaqiyatli saqlandi.'
      )
    }, 250)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        {/* Til va mintaqa bloki */}
        <div className='rounded-xl border bg-card/50 p-5 space-y-5'>
          <h3 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
            {english ? 'Localization & Language' : 'Til va hududiy parametrlar'}
          </h3>

          <div className='grid gap-6 md:grid-cols-2'>
            <FormField
              control={form.control}
              name='language'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-1.5'>
                    <Globe className='size-3.5 text-primary' />
                    {english ? 'Primary language' : 'Asosiy tizim tili'}
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val)
                      setLanguage(val as Language)
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='uz'>
                        O‘zbekcha (Asosiy til)
                      </SelectItem>
                      <SelectItem value='en'>
                        English (Inglizcha)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {english
                      ? 'System default is set to Uzbek. You can switch to English anytime.'
                      : 'CRM uchun asosiy til O‘zbek tili etib sozlangan. Xohlasangiz inglizchaga o‘tkazishingiz mumkin.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='timezone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-1.5'>
                    <Clock className='size-3.5 text-primary' />
                    {english ? 'Timezone' : 'Vaqt mintaqasi'}
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='Asia/Tashkent'>
                        Toshkent, O‘zbekiston (UTC+05:00)
                      </SelectItem>
                      <SelectItem value='Asia/Samarkand'>
                        Samarqand, O‘zbekiston (UTC+05:00)
                      </SelectItem>
                      <SelectItem value='UTC'>
                        UTC (Universal Time)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {english
                      ? 'Used for lesson scheduling, attendance tracking and timestamps.'
                      : 'Dars jadvallari, davomat va operatsiyalar vaqtini aniqlash uchun.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Formatlar va valyuta */}
        <div className='rounded-xl border bg-card/50 p-5 space-y-5'>
          <h3 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
            {english ? 'Date, Time & Currency' : 'Sana, vaqt va valyuta formatlari'}
          </h3>

          <div className='grid gap-6 md:grid-cols-3'>
            <FormField
              control={form.control}
              name='dateFormat'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-1.5'>
                    <Calendar className='size-3.5 text-muted-foreground' />
                    {english ? 'Date format' : 'Sana formati'}
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='DD.MM.YYYY'>DD.MM.YYYY (14.10.2026)</SelectItem>
                      <SelectItem value='YYYY-MM-DD'>YYYY-MM-DD (2026-10-14)</SelectItem>
                      <SelectItem value='DD/MM/YYYY'>DD/MM/YYYY (14/10/2026)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {english ? 'Display format for dates' : 'Sanalar ko‘rinishi'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='timeFormat'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-1.5'>
                    <Clock className='size-3.5 text-muted-foreground' />
                    {english ? 'Time format' : 'Vaqt formati'}
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='24h'>{english ? '24-hour (14:30)' : '24-soatlik (14:30)'}</SelectItem>
                      <SelectItem value='12h'>{english ? '12-hour (02:30 PM)' : '12-soatlik (02:30 PM)'}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {english ? 'Display format for class hours' : 'Dars vaqtlarini ko‘rsatish'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='currency'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-1.5'>
                    <Coins className='size-3.5 text-muted-foreground' />
                    {english ? 'System currency' : 'Asosiy valyuta'}
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='UZS'>UZS (O‘zbek so‘mi)</SelectItem>
                      <SelectItem value='USD'>USD (AQSH dollari)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {english ? 'Primary currency in finance' : 'Moliya bo‘limidagi standart valyuta'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Xavfsizlik va sessiya boshqaruvi */}
        <div className='rounded-xl border bg-card/50 p-5 space-y-5'>
          <h3 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
            {english ? 'Session Management' : 'Sessiya va xavfsizlik vaqti'}
          </h3>

          <FormField
            control={form.control}
            name='sessionTimeout'
            render={({ field }) => (
              <FormItem className='max-w-md'>
                <FormLabel className='flex items-center gap-1.5'>
                  <ShieldAlert className='size-3.5 text-muted-foreground' />
                  {english ? 'Inactivity timeout' : 'Harakatsizlikda sessiyani yopish'}
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='30m'>{english ? 'After 30 minutes' : '30 daqiqadan so‘ng'}</SelectItem>
                    <SelectItem value='1h'>{english ? 'After 1 hour' : '1 soatdan so‘ng'}</SelectItem>
                    <SelectItem value='8h'>{english ? 'After 8 hours (Standard working day)' : '8 soatdan so‘ng (Ish kuni yakunida)'}</SelectItem>
                    <SelectItem value='never'>{english ? 'Never (Keep signed in)' : 'Yopilmasin (Doim faol qolsin)'}</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  {english
                    ? 'Automatically sign out when CRM workspace remains untouched.'
                    : 'Uzoq vaqt harakat bo‘lmaganda hisob xavfsizligi uchun tizimdan avtomatik chiqish.'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='flex justify-end'>
          <Button type='submit' disabled={isSaving} className='min-w-36'>
            {isSaving
              ? english
                ? 'Saving...'
                : 'Saqlanmoqda...'
              : english
                ? 'Save account settings'
                : 'Hisobni saqlash'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
