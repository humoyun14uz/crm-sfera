import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Mail, Phone, Send, Shield, User } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/context/language-provider'
import { useAuthStore } from '@/stores/auth-store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const profileFormSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Kamida 2 ta belgi kiriting')
    .max(50, 'Maksimal 50 ta belgi'),
  email: z.string().email('To‘g‘ri elektron pochta manzilini kiriting'),
  phone: z
    .string()
    .min(9, 'Telefon raqamini to‘liq kiriting')
    .max(20, 'Telefon raqami noto‘g‘ri'),
  branch: z.string().min(1, 'Filialni tanlang'),
  telegram: z.string().optional(),
  bio: z.string().max(250, 'Maksimal 250 ta belgi').optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileForm() {
  const { language } = useLanguage()
  const english = language === 'en'
  const { auth } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultValues: ProfileFormValues = {
    fullName: auth.user?.name || 'Administrator',
    email: auth.user?.email || 'admin@sfera.uz',
    phone: '+998 90 123 45 67',
    branch: 'Bosh bino (Chilonzor)',
    telegram: '@sfera_admin',
    bio: english
      ? 'CRM administrator and academic operations coordinator.'
      : 'CRM boshqaruvchisi va o‘quv jarayonlari koordinatori.',
  }

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: 'onChange',
  })

  function onSubmit(data: ProfileFormValues) {
    setIsSubmitting(true)
    setTimeout(() => {
      if (auth.user) {
        auth.setUser({
          ...auth.user,
          name: data.fullName,
          email: data.email,
        })
      }
      setIsSubmitting(false)
      toast.success(
        english
          ? 'Profile information successfully saved.'
          : 'Profil ma’lumotlari muvaffaqiyatli saqlandi.'
      )
    }, 300)
  }

  const initials = (auth.user?.name || 'S')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className='space-y-6'>
      {/* Profil bosh qismi - Avatar va asosiy ko'rsatkichlar */}
      <div className='flex flex-col gap-4 rounded-xl border bg-card/60 p-5 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-4'>
          <Avatar className='size-16 border-2 border-primary/20 shadow-sm'>
            <AvatarFallback className='bg-primary/10 text-lg font-bold text-primary'>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className='text-lg font-semibold'>{auth.user?.name || 'Sfera Xodimi'}</h3>
            <p className='text-xs text-muted-foreground'>{auth.user?.email || 'xodim@sfera.uz'}</p>
            <div className='mt-2 flex items-center gap-2'>
              <span className='inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'>
                <Shield className='size-3' />
                {Array.isArray(auth.user?.role)
                  ? auth.user.role.join(', ').toUpperCase()
                  : String(auth.user?.role || (english ? 'ADMIN' : 'ADMINISTRATOR')).toUpperCase()}
              </span>
              <span className='inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400'>
                ● {english ? 'Active account' : 'Faol hisob'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <div className='grid gap-6 md:grid-cols-2'>
            <FormField
              control={form.control}
              name='fullName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-1.5'>
                    <User className='size-3.5 text-muted-foreground' />
                    {english ? 'Full name' : 'To‘liq ism-sharif (F.I.SH)'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={english ? 'e.g. John Doe' : 'Masalan: Alisher Qodirov'}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {english
                      ? 'Used for display across system modules and logs.'
                      : 'Tizim modullari va hujjatlarda ko‘rinadigan rasmiy ismingiz.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-1.5'>
                    <Mail className='size-3.5 text-muted-foreground' />
                    {english ? 'Work email' : 'Ishchi elektron pochta'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='admin@sfera.uz'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {english
                      ? 'Used for login and important system notifications.'
                      : 'Tizimga kirish va bildirishnomalar yuboriladigan rasmiy pochta.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='phone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-1.5'>
                    <Phone className='size-3.5 text-muted-foreground' />
                    {english ? 'Phone number' : 'Aloqa telefoni'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder='+998 90 123 45 67'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {english
                      ? 'Direct contact number for urgent workspace matters.'
                      : 'Ish faoliyati va tezkor aloqa uchun telefon raqami.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='branch'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-1.5'>
                    <Building2 className='size-3.5 text-muted-foreground' />
                    {english ? 'Branch / Location' : 'Mas’ul filial / O‘quv binosi'}
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={english ? 'Select branch' : 'Filialni tanlang'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='Bosh bino (Chilonzor)'>
                        {english ? 'Main campus (Chilonzor)' : 'Bosh bino (Chilonzor)'}
                      </SelectItem>
                      <SelectItem value='Yunusobod filiali'>
                        {english ? 'Yunusobod branch' : 'Yunusobod filiali'}
                      </SelectItem>
                      <SelectItem value='Mirzo Ulug‘bek filiali'>
                        {english ? 'Mirzo Ulugbek branch' : 'Mirzo Ulug‘bek filiali'}
                      </SelectItem>
                      <SelectItem value='Onlayn bo‘lim'>
                        {english ? 'Online education department' : 'Onlayn bo‘lim'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {english
                      ? 'The primary branch you are assigned to.'
                      : 'Siz faoliyat olib boradigan asosiy o‘quv markazi filiali.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='telegram'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-1.5'>
                    <Send className='size-3.5 text-muted-foreground' />
                    {english ? 'Telegram username' : 'Telegram foydalanuvchi nomi'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder='@username'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {english
                      ? 'For team messaging and CRM bot alerts.'
                      : 'Jamoa bilan ichki aloqa va bot ogohlantirishlari uchun.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name='bio'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{english ? 'Short notes / Position description' : 'Qisqacha izoh / Lavozim vazifasi'}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={
                      english
                        ? 'Brief information about your responsibilities or working hours...'
                        : 'Lavozim vazifangiz, qabul vaqtlari yoki mas’uliyat doirangiz haqida...'
                    }
                    className='resize-none'
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {english
                    ? 'Internal note visible to other administrative team members.'
                    : 'Boshqa administratorlar va xodimlar ko‘rishi mumkin bo‘lgan ma’lumot.'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='flex justify-end'>
            <Button type='submit' disabled={isSubmitting} className='min-w-36'>
              {isSubmitting
                ? english
                  ? 'Saving...'
                  : 'Saqlanmoqda...'
                : english
                  ? 'Save profile'
                  : 'Profilni saqlash'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
