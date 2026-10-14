import { ContentSection } from '../components/content-section'
import { NotificationsForm } from './notifications-form'
import { useLanguage } from '@/context/language-provider'

export function SettingsNotifications() {
  const { language } = useLanguage()
  const english = language === 'en'
  return (
    <ContentSection
      title={english ? 'Notifications & Alerts' : 'Bildirishnomalar va ogohlantirishlar'}
      desc={
        english
          ? 'Manage notifications for admissions, payments, lesson schedules and delivery channels.'
          : 'Qabul arizalari, to‘lovlar, dars jadvallari va xabarlarni yetkazish kanallarini boshqaring.'
      }
    >
      <NotificationsForm />
    </ContentSection>
  )
}
