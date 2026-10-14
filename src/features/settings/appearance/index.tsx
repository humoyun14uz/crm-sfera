import { ContentSection } from '../components/content-section'
import { AppearanceForm } from './appearance-form'
import { useLanguage } from '@/context/language-provider'

export function SettingsAppearance() {
  const { language } = useLanguage()
  const english = language === 'en'
  return (
    <ContentSection
      title={english ? 'Appearance & Interface' : 'Ko‘rinish va interfeys'}
      desc={
        english
          ? 'Customize theme, system font, density and sidebar layout.'
          : 'Mavzu rejimi, tizim shrifti, qatorlar zichligi va yon panel tuzilishini sozlang.'
      }
    >
      <AppearanceForm />
    </ContentSection>
  )
}
