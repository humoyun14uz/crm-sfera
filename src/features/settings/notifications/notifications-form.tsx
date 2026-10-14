import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Bell,
  CalendarCheck,
  CreditCard,
  Mail,
  Send,
  UserPlus,
  Volume2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/context/language-provider'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'

const notificationsFormSchema = z.object({
  newLeads: z.boolean(),
  studentEnrollment: z.boolean(),
  paymentReceived: z.boolean(),
  debtOverdue: z.boolean(),
  lessonReminders: z.boolean(),
  attendanceAlerts: z.boolean(),
  telegramBotAlerts: z.boolean(),
  emailNotifications: z.boolean(),
  soundAlerts: z.boolean(),
})

type NotificationsFormValues = z.infer<typeof notificationsFormSchema>

export function NotificationsForm() {
  const { language } = useLanguage()
  const english = language === 'en'
  const [isSaving, setIsSaving] = useState(false)

  const defaultValues: NotificationsFormValues = {
    newLeads: true,
    studentEnrollment: true,
    paymentReceived: true,
    debtOverdue: true,
    lessonReminders: true,
    attendanceAlerts: true,
    telegramBotAlerts: true,
    emailNotifications: false,
    soundAlerts: true,
  }

  const form = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues,
  })

  function onSubmit(_data: NotificationsFormValues) {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      toast.success(
        english
          ? 'Notification preferences updated successfully.'
          : 'Bildirishnoma sozlamalari muvaffaqiyatli saqlandi.'
      )
    }, 250)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        {/* Arizalar va o'quvchilar */}
        <div className='rounded-xl border bg-card/50 p-5 space-y-4'>
          <div>
            <h3 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
              {english ? 'Admissions & Students' : 'Qabul va o‘quvchilar oqimi'}
            </h3>
            <p className='mt-1 text-xs text-muted-foreground'>
              {english
                ? 'Get notified when potential leads submit inquiries or join courses.'
                : 'Yangi arizalar tushganda yoki o‘quvchilar kurslarga qabul qilinganda xabarlar.'}
            </p>
          </div>

          <div className='divide-y divide-border/60'>
            <FormField
              control={form.control}
              name='newLeads'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between py-3'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-sm font-medium flex items-center gap-2'>
                      <UserPlus className='size-4 text-primary' />
                      {english ? 'New leads and inquiries' : 'Yangi arizalar va murojaatlar'}
                    </FormLabel>
                    <FormDescription>
                      {english
                        ? 'Immediate alert when a prospective student signs up or calls.'
                        : 'Yangi murojaat yoki sinov darsiga yozilganlar bo‘yicha tezkor ogohlantirish.'}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='studentEnrollment'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between py-3'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-sm font-medium flex items-center gap-2'>
                      <UserPlus className='size-4 text-emerald-500' />
                      {english ? 'Group assignments' : 'Guruhga biriktirish xabarlari'}
                    </FormLabel>
                    <FormDescription>
                      {english
                        ? 'When a student is formally assigned or transferred to a new group.'
                        : 'O‘quvchi yangi guruhga qo‘shilganda yoki boshqa guruhga ko‘chirilganda.'}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Moliya va to'lovlar */}
        <div className='rounded-xl border bg-card/50 p-5 space-y-4'>
          <div>
            <h3 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
              {english ? 'Finance & Payments' : 'Moliya va to‘lovlar nazorati'}
            </h3>
            <p className='mt-1 text-xs text-muted-foreground'>
              {english
                ? 'Stay informed about student transactions and overdue balances.'
                : 'Muvaffaqiyatli to‘lovlar va qarzdorliklar to‘g‘risida eslatmalar.'}
            </p>
          </div>

          <div className='divide-y divide-border/60'>
            <FormField
              control={form.control}
              name='paymentReceived'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between py-3'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-sm font-medium flex items-center gap-2'>
                      <CreditCard className='size-4 text-emerald-500' />
                      {english ? 'Payment confirmations' : 'Qabul qilingan to‘lovlar'}
                    </FormLabel>
                    <FormDescription>
                      {english
                        ? 'Notice whenever a cash, card, Payme or Click payment is registered.'
                        : 'Kassa, karta yoki elektron to‘lov tizimlari orqali to‘lov qilinganda.'}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='debtOverdue'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between py-3'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-sm font-medium flex items-center gap-2'>
                      <CreditCard className='size-4 text-amber-500' />
                      {english ? 'Overdue payment reminders' : 'Qarzdorlik eslatmalari'}
                    </FormLabel>
                    <FormDescription>
                      {english
                        ? 'Automated notification before and after a student’s payment deadline passes.'
                        : 'O‘quvchining oylik to‘lov muddati yaqinlashganda yoki kechikkanida.'}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Dars jadvali va davomat */}
        <div className='rounded-xl border bg-card/50 p-5 space-y-4'>
          <div>
            <h3 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
              {english ? 'Lessons & Attendance' : 'Darslar va davomat'}
            </h3>
            <p className='mt-1 text-xs text-muted-foreground'>
              {english
                ? 'Alerts for schedule shifts and unrecorded lesson attendance.'
                : 'Darslar boshlanishi va kiritilmagan davomat jurnallari haqida ogohlantirish.'}
            </p>
          </div>

          <div className='divide-y divide-border/60'>
            <FormField
              control={form.control}
              name='lessonReminders'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between py-3'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-sm font-medium flex items-center gap-2'>
                      <CalendarCheck className='size-4 text-primary' />
                      {english ? 'Lesson start reminder (15 min prior)' : 'Dars boshlanishi haqida eslatma'}
                    </FormLabel>
                    <FormDescription>
                      {english
                        ? 'Receive a heads-up 15 minutes before scheduled group lessons begin.'
                        : 'Guruh darslari boshlanishiga 15 daqiqa qolganda eslatish.'}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='attendanceAlerts'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between py-3'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-sm font-medium flex items-center gap-2'>
                      <Bell className='size-4 text-rose-500' />
                      {english ? 'Missing attendance warning' : 'Kiritilmagan davomat ogohlantirishi'}
                    </FormLabel>
                    <FormDescription>
                      {english
                        ? 'Flag when a completed lesson has not had attendance registered.'
                        : 'Tugallangan dars bo‘yicha davomat belgilanmay qolganda eslatish.'}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Yetkazish kanallari */}
        <div className='rounded-xl border bg-card/50 p-5 space-y-4'>
          <div>
            <h3 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
              {english ? 'Delivery Channels' : 'Xabarlarni yetkazish kanallari'}
            </h3>
            <p className='mt-1 text-xs text-muted-foreground'>
              {english
                ? 'Configure where and how system notifications reach you.'
                : 'Bildirishnomalar qaysi kanallar orqali yetkazilishini belgilang.'}
            </p>
          </div>

          <div className='divide-y divide-border/60'>
            <FormField
              control={form.control}
              name='telegramBotAlerts'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between py-3'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-sm font-medium flex items-center gap-2'>
                      <Send className='size-4 text-sky-500' />
                      {english ? 'Telegram Bot instant alerts' : 'Telegram Bot orqali tezkor bildirishnomalar'}
                    </FormLabel>
                    <FormDescription>
                      {english
                        ? 'Send critical CRM alerts directly to your linked Telegram account.'
                        : 'Muhim xabarlarni shaxsiy yoki xodimlar Telegram botiga yuborish.'}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='emailNotifications'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between py-3'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-sm font-medium flex items-center gap-2'>
                      <Mail className='size-4 text-primary' />
                      {english ? 'Email daily digest' : 'Elektron pochta orqali kunlik hisobot'}
                    </FormLabel>
                    <FormDescription>
                      {english
                        ? 'Receive summary of day’s activities and finances to your email.'
                        : 'Kun yakuni bo‘yicha umumiy hisobot va statistikani pochtaga olish.'}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='soundAlerts'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between py-3'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-sm font-medium flex items-center gap-2'>
                      <Volume2 className='size-4 text-muted-foreground' />
                      {english ? 'Desktop audio chimes' : 'Ovozli bildirishnomalar'}
                    </FormLabel>
                    <FormDescription>
                      {english
                        ? 'Play a gentle sound notification when a new lead or message arrives.'
                        : 'Yangi xabar yoki ariza tushganida qisqa ovozli signal berish.'}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
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
                ? 'Save notification rules'
                : 'Bildirishnomalarni saqlash'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
