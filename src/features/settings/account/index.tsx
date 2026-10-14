import { ContentSection } from '../components/content-section'
import { AccountForm } from './account-form'
import { useLanguage } from '@/context/language-provider'

export function SettingsAccount() {
  const { language } = useLanguage()
  const english = language === 'en'
  return (
    <ContentSection
      title={english ? 'Account Settings' : 'Hisob va mintaqa sozlamalari'}
      desc={
        english
          ? 'Manage primary language, timezone, date formatting and session policies.'
          : 'Asosiy tizim tili, vaqt mintaqasi, sana-vaqt formatlari va xavfsiz sessiya parametrlarini sozlang.'
      }
    >
      <AccountForm />
    </ContentSection>
  )
}
