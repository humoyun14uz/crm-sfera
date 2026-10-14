import { useState } from 'react'
import {
  type LucideIcon,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  LogOut,
  MonitorSmartphone,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/context/language-provider'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ContentSection } from '../components/content-section'

export function SettingsSecurity() {
  const { language } = useLanguage()
  const english = language === 'en'
  const [twoStep, setTwoStep] = useState(true)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const handlePasswordChange = () => {
    if (!currentPassword) {
      toast.error(
        english
          ? 'Please enter your current password.'
          : 'Joriy parolingizni kiriting.'
      )
      return
    }
    if (newPassword.length < 8) {
      toast.error(
        english
          ? 'New password must contain at least 8 characters.'
          : 'Yangi parol kamida 8 ta belgidan iborat bo‘lishi kerak.'
      )
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error(
        english
          ? 'New passwords do not match.'
          : 'Yangi parollar bir-biriga mos kelmadi.'
      )
      return
    }

    setIsUpdating(true)
    setTimeout(() => {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setIsUpdating(false)
      toast.success(
        english
          ? 'Password updated successfully.'
          : 'Parol muvaffaqiyatli o‘zgartirildi.'
      )
    }, 300)
  }

  const handleTerminateOtherSessions = () => {
    toast.success(
      english
        ? 'All other active sessions have been safely logged out.'
        : 'Boshqa barcha qurilmalardagi faol sessiyalar yopildi.'
    )
  }

  // Parol kuchliligini hisoblash
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: '', color: '' }
    if (pwd.length < 6)
      return {
        label: english ? 'Too short' : 'Juda qisqa',
        color: 'text-rose-500',
      }
    if (pwd.length < 8)
      return {
        label: english ? 'Weak' : 'Kuchsiz',
        color: 'text-amber-500',
      }
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && pwd.length >= 8)
      return {
        label: english ? 'Strong' : 'Kuchli',
        color: 'text-emerald-500',
      }
    return {
      label: english ? 'Medium' : 'O‘rtacha',
      color: 'text-sky-500',
    }
  }

  const strength = getPasswordStrength(newPassword)

  return (
    <ContentSection
      title={english ? 'Security & Access' : 'Xavfsizlik va kirish nazorati'}
      desc={
        english
          ? 'Protect your CRM account, control active sessions and update authentication credentials.'
          : 'CRM hisobingiz xavfsizligi, faol sessiyalar va autentifikatsiya parametrlarini boshqaring.'
      }
    >
      <div className='space-y-6'>
        {/* Asosiy xavfsizlik kartalari */}
        <div className='grid gap-4 sm:grid-cols-3'>
          <SecurityStat
            icon={ShieldCheck}
            title={english ? 'Account Protection' : 'Hisob himoyasi'}
            value={english ? 'Active' : 'Faol'}
            hint={english ? '2FA & RBAC secured' : '2FA va ruxsatlar nazoratda'}
            color='text-emerald-500'
          />
          <SecurityStat
            icon={MonitorSmartphone}
            title={english ? 'Active Devices' : 'Faol qurilmalar'}
            value='1'
            hint={english ? 'This current workspace' : 'Ushbu ishchi brauzer'}
            color='text-primary'
          />
          <SecurityStat
            icon={CheckCircle2}
            title={english ? 'Login Alerts' : 'Xavfsizlik nazorati'}
            value={english ? 'Enabled' : 'Yoqilgan'}
            hint={english ? 'Instant alerts on logins' : 'Kirishlar auditi yoqilgan'}
            color='text-emerald-500'
          />
        </div>

        {/* Parolni o'zgartirish */}
        <Card className='border-border/70 shadow-xs'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <KeyRound className='size-4 text-primary' />
              {english ? 'Change Password' : 'Parolni yangilash'}
            </CardTitle>
            <CardDescription>
              {english
                ? 'Choose a unique and secure password that is at least 8 characters long.'
                : 'Hisobingiz himoyasi uchun kamida 8 ta belgili, harf va raqamlardan iborat parol tanlang.'}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-3'>
              <div className='space-y-2'>
                <Label>{english ? 'Current password' : 'Joriy parol'}</Label>
                <Input
                  type='password'
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder='••••••••'
                />
              </div>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <Label>{english ? 'New password' : 'Yangi parol'}</Label>
                  {strength.label && (
                    <span className={`text-xs font-semibold ${strength.color}`}>
                      {strength.label}
                    </span>
                  )}
                </div>
                <Input
                  type='password'
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder='••••••••'
                />
              </div>
              <div className='space-y-2'>
                <Label>{english ? 'Confirm new password' : 'Yangi parolni tasdiqlang'}</Label>
                <Input
                  type='password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder='••••••••'
                />
              </div>
            </div>
            <div className='flex justify-end pt-2'>
              <Button
                onClick={handlePasswordChange}
                disabled={isUpdating}
                className='min-w-36'
              >
                {isUpdating
                  ? english
                    ? 'Updating...'
                    : 'Yangilanmoqda...'
                  : english
                    ? 'Update password'
                    : 'Parolni yangilash'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ikki bosqichli autentifikatsiya (2FA) */}
        <Card className='border-border/70 shadow-xs'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <LockKeyhole className='size-4 text-primary' />
              {english ? 'Two-Factor Authentication (2FA)' : 'Ikki bosqichli tasdiqlash (2FA)'}
            </CardTitle>
            <CardDescription>
              {english
                ? 'Adds an additional layer of security by requiring a confirmation code on new devices.'
                : 'Yangi qurilmadan kirilganda qo‘shimcha xavfsizlik uchun tasdiqlash kodini talab qiladi.'}
            </CardDescription>
          </CardHeader>
          <CardContent className='flex items-center justify-between gap-4 rounded-xl border bg-muted/30 p-4'>
            <div>
              <p className='font-semibold text-sm'>
                {twoStep
                  ? english
                    ? 'Protection enabled'
                    : 'Ikki bosqichli himoya yoqilgan'
                  : english
                    ? 'Protection disabled'
                    : 'Ikki bosqichli himoya o‘chirilgan'}
              </p>
              <p className='mt-0.5 text-xs text-muted-foreground'>
                {english
                  ? 'Recommended for administrator and finance roles.'
                  : 'Administrator va moliya xodimlari uchun yoqish qat’iy tavsiya etiladi.'}
              </p>
            </div>
            <Switch
              checked={twoStep}
              onCheckedChange={(checked) => {
                setTwoStep(checked)
                toast.success(
                  checked
                    ? english
                      ? 'Two-step verification enabled.'
                      : 'Ikki bosqichli himoya yoqildi.'
                    : english
                      ? 'Two-step verification disabled.'
                      : 'Ikki bosqichli himoya o‘chirildi.'
                )
              }}
            />
          </CardContent>
        </Card>

        {/* Faol qurilmalar va sessiyalar */}
        <Card className='border-border/70 shadow-xs'>
          <CardHeader className='flex flex-row items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2 text-base'>
                <Smartphone className='size-4 text-primary' />
                {english ? 'Active Sessions & Devices' : 'Faol qurilmalar va sessiyalar'}
              </CardTitle>
              <CardDescription>
                {english
                  ? 'Manage devices that are currently logged into your CRM account.'
                  : 'Hozir hisobingizga kirib turgan qurilmalar va brauzerlarni ko‘rib chiqing.'}
              </CardDescription>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={handleTerminateOtherSessions}
              className='text-xs'
            >
              <LogOut className='mr-1.5 size-3.5' />
              {english ? 'Sign out other devices' : 'Boshqa qurilmalardan chiqish'}
            </Button>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='flex items-center justify-between rounded-xl border p-4 bg-card/60'>
              <div className='flex items-center gap-3'>
                <div className='flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                  <MonitorSmartphone className='size-5' />
                </div>
                <div>
                  <div className='flex items-center gap-2'>
                    <p className='font-semibold text-sm'>
                      {english ? 'Windows PC · Google Chrome' : 'Windows Kompyuter · Google Chrome'}
                    </p>
                    <span className='rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400'>
                      {english ? 'This device' : 'Ushbu qurilma'}
                    </span>
                  </div>
                  <p className='text-xs text-muted-foreground mt-0.5'>
                    Toshkent, O‘zbekiston · {english ? 'Active now' : 'Hozir faol'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ContentSection>
  )
}

function SecurityStat({
  icon: Icon,
  title,
  value,
  hint,
  color,
}: {
  icon: LucideIcon
  title: string
  value: string
  hint: string
  color: string
}) {
  return (
    <Card className='border-border/70 shadow-xs'>
      <CardContent className='p-4'>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <p className='text-xs font-medium text-muted-foreground'>{title}</p>
            <p className='mt-1 text-xl font-bold tracking-tight'>{value}</p>
            <p className='mt-0.5 text-xs text-muted-foreground'>{hint}</p>
          </div>
          <span className={`flex size-9 items-center justify-center rounded-xl bg-primary/10 ${color}`}>
            <Icon className='size-4' />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
