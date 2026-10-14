import { ContentSection } from '../components/content-section'
import { DisplayForm } from './display-form'
import { useLanguage } from '@/context/language-provider'

export function SettingsDisplay() {
  const { language } = useLanguage()
  const english = language === 'en'
  return (
    <ContentSection
      title={english ? 'Display & Dashboard' : 'Displey va boshqaruv paneli'}
      desc={
        english
          ? 'Choose default landing page, table row count and dashboard summary widgets.'
          : 'Boshlang‘ich modul, jadvallar sahifalanishi va boshqaruv panelidagi asosiy tahlil vidjetlarini belgilang.'
      }
    >
      <DisplayForm />
    </ContentSection>
  )
}
