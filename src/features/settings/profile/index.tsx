import { ContentSection } from '../components/content-section'
import { ProfileForm } from './profile-form'
import { useLanguage } from '@/context/language-provider'

export function SettingsProfile() {
  const { language } = useLanguage()
  const english = language === 'en'
  return (
    <ContentSection
      title={english ? 'User Profile' : 'Foydalanuvchi profili'}
      desc={
        english
          ? 'Manage your personal details, contact information, branch and role.'
          : 'Shaxsiy ma’lumotlaringiz, aloqa raqami, biriktirilgan filial va CRM dagi rolingizni boshqaring.'
      }
    >
      <ProfileForm />
    </ContentSection>
  )
}
