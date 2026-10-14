import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Columns3, Moon, PanelLeft, Sun, Type } from 'lucide-react'
import { toast } from 'sonner'
import { fonts } from '@/config/fonts'
import { useFont } from '@/context/font-provider'
import { useTheme } from '@/context/theme-provider'
import { useLayout, type Variant } from '@/context/layout-provider'
import { useLanguage } from '@/context/language-provider'
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
import { cn } from '@/lib/utils'

const appearanceFormSchema = z.object({
  theme: z.enum(['light', 'dark']),
  font: z.enum(fonts),
  sidebarVariant: z.enum(['sidebar', 'floating', 'inset']),
  density: z.enum(['default', 'compact']),
})

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>

export function AppearanceForm() {
  const { language } = useLanguage()
  const english = language === 'en'
  const { font, setFont } = useFont()
  const { theme, setTheme } = useTheme()
  const { variant, setVariant } = useLayout()
  const [isSaving, setIsSaving] = useState(false)

  const defaultValues: AppearanceFormValues = {
    theme: (theme === 'dark' ? 'dark' : 'light') as 'light' | 'dark',
    font: font || 'manrope',
    sidebarVariant: (variant as 'sidebar' | 'floating' | 'inset') || 'inset',
    density: 'default',
  }

  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues,
  })

  function onSubmit(data: AppearanceFormValues) {
    setIsSaving(true)
    if (data.font !== font) setFont(data.font)
    if (data.theme !== theme) setTheme(data.theme)
    if (data.sidebarVariant !== variant) setVariant(data.sidebarVariant as Variant)

    setTimeout(() => {
      setIsSaving(false)
      toast.success(
        english
          ? 'Appearance preferences applied successfully.'
          : 'Ko‘rinish parametrlari muvaffaqiyatli yangilandi.'
      )
    }, 250)
  }

  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(
    () => (theme === 'dark' ? 'dark' : 'light')
  )
  const [currentVariant, setCurrentVariant] = useState<'sidebar' | 'floating' | 'inset'>(
    () => (variant as 'sidebar' | 'floating' | 'inset') || 'inset'
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        {/* Mavzu rejimi */}
        <div className='rounded-xl border bg-card/50 p-5 space-y-4'>
          <div>
            <h3 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
              {english ? 'Theme Mode' : 'Rang mavzusi'}
            </h3>
            <p className='mt-1 text-xs text-muted-foreground'>
              {english
                ? 'Select a comfortable visual mode for day or night workspace.'
                : 'Kunduzgi yoki tungi ish jarayoni uchun ko‘zingizga qulay rejimni tanlang.'}
            </p>
          </div>

          <FormField
            control={form.control}
            name='theme'
            render={({ field }) => (
              <FormItem>
                <div className='grid gap-4 sm:grid-cols-2'>
                  {/* Yorug' rejim kartasi */}
                  <div
                    role='button'
                    tabIndex={0}
                    onClick={() => {
                      field.onChange('light')
                      setCurrentTheme('light')
                      setTheme('light')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        field.onChange('light')
                        setCurrentTheme('light')
                        setTheme('light')
                      }
                    }}
                    className={cn(
                      'group relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:border-primary/50',
                      currentTheme === 'light'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border/70 bg-background'
                    )}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500'>
                          <Sun className='size-5' />
                        </div>
                        <div>
                          <p className='font-semibold'>{english ? 'Light theme' : 'Yorug‘ mavzu'}</p>
                          <p className='text-xs text-muted-foreground'>
                            {english ? 'Clean daylight contrast' : 'Kunduzgi ochiq ranglar'}
                          </p>
                        </div>
                      </div>
                      {currentTheme === 'light' && (
                        <div className='flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground'>
                          <Check className='size-3.5' />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Qorong'i rejim kartasi */}
                  <div
                    role='button'
                    tabIndex={0}
                    onClick={() => {
                      field.onChange('dark')
                      setCurrentTheme('dark')
                      setTheme('dark')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        field.onChange('dark')
                        setCurrentTheme('dark')
                        setTheme('dark')
                      }
                    }}
                    className={cn(
                      'group relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:border-primary/50',
                      currentTheme === 'dark'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border/70 bg-background'
                    )}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='flex size-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400'>
                          <Moon className='size-5' />
                        </div>
                        <div>
                          <p className='font-semibold'>{english ? 'Dark theme' : 'Qorong‘i mavzu'}</p>
                          <p className='text-xs text-muted-foreground'>
                            {english ? 'Deep night workspace' : 'Ko‘z charchashini kamaytiradi'}
                          </p>
                        </div>
                      </div>
                      {currentTheme === 'dark' && (
                        <div className='flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground'>
                          <Check className='size-3.5' />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Shrift va matn ko'rinishi */}
        <div className='rounded-xl border bg-card/50 p-5 space-y-4'>
          <div>
            <h3 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
              {english ? 'Typography & Fonts' : 'Shrift va matn sozlamalari'}
            </h3>
            <p className='mt-1 text-xs text-muted-foreground'>
              {english
                ? 'Select a typography style that matches your workspace readability.'
                : 'Boshqaruv panelida ma’lumotlarni o‘qish oson va qulay bo‘lishi uchun shrift tanlang.'}
            </p>
          </div>

          <div className='grid gap-6 md:grid-cols-2'>
            <FormField
              control={form.control}
              name='font'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-1.5'>
                    <Type className='size-3.5 text-primary' />
                    {english ? 'Interface font' : 'Tizim shrifti'}
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val)
                      setFont(val as (typeof fonts)[number])
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fonts.map((f) => (
                        <SelectItem key={f} value={f} className='capitalize'>
                          {f} {f === 'manrope' ? (english ? '(Recommended)' : '(Tavsiya etiladi)') : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {english
                      ? 'Manrope is optimized for clean numeric and dashboard reading.'
                      : 'Manrope shrifti raqamlar, jadvallar va CRM modullari uchun eng qulay hisoblanadi.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='density'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-1.5'>
                    <Columns3 className='size-3.5 text-primary' />
                    {english ? 'Interface density' : 'Interfeys zichligi'}
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='default'>
                        {english ? 'Standard (Comfortable spacing)' : 'Standart (Qulay kenglik)'}
                      </SelectItem>
                      <SelectItem value='compact'>
                        {english ? 'Compact (More data on screen)' : 'Ixcham (Ko‘proq ma’lumot)'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {english
                      ? 'Controls padding and row height across CRM screens.'
                      : 'Sahifalardagi bo‘shliqlar va jadvallar qator balandligini belgilaydi.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Yon panel joylashuvi */}
        <div className='rounded-xl border bg-card/50 p-5 space-y-4'>
          <div>
            <h3 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
              {english ? 'Sidebar Layout' : 'Yon panel tuzilishi'}
            </h3>
            <p className='mt-1 text-xs text-muted-foreground'>
              {english
                ? 'Choose how the main navigation sidebar attaches to the workspace.'
                : 'Asosiy menyu panelining ekranda joylashuv uslubini tanlang.'}
            </p>
          </div>

          <FormField
            control={form.control}
            name='sidebarVariant'
            render={({ field }) => (
              <FormItem>
                <div className='grid gap-4 sm:grid-cols-3'>
                  {[
                    {
                      id: 'inset',
                      title: english ? 'Inset' : 'Ichki (Inset)',
                      desc: english ? 'Embedded into workspace' : 'Kontent bilan uyg‘un',
                    },
                    {
                      id: 'floating',
                      title: english ? 'Floating' : 'Suzuvchi (Floating)',
                      desc: english ? 'Rounded floating island' : 'Zamonaviy orolcha',
                    },
                    {
                      id: 'sidebar',
                      title: english ? 'Standard' : 'Klassik (Standard)',
                      desc: english ? 'Full height edge-to-edge' : 'To‘liq balandlikda',
                    },
                  ].map((item) => (
                    <div
                      key={item.id}
                      role='button'
                      tabIndex={0}
                      onClick={() => {
                        field.onChange(item.id)
                        setCurrentVariant(item.id as 'sidebar' | 'floating' | 'inset')
                        setVariant(item.id as Variant)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          field.onChange(item.id)
                          setCurrentVariant(item.id as 'sidebar' | 'floating' | 'inset')
                          setVariant(item.id as Variant)
                        }
                      }}
                      className={cn(
                        'cursor-pointer rounded-xl border-2 p-3.5 transition-all hover:border-primary/50',
                        currentVariant === item.id
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border/70 bg-background'
                      )}
                    >
                      <div className='flex items-center gap-2'>
                        <PanelLeft className='size-4 text-primary' />
                        <span className='font-semibold text-sm'>{item.title}</span>
                      </div>
                      <p className='mt-1 text-xs text-muted-foreground'>{item.desc}</p>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='flex justify-end'>
          <Button type='submit' disabled={isSaving} className='min-w-36'>
            {isSaving
              ? english
                ? 'Applying...'
                : 'Qo‘llanilmoqda...'
              : english
                ? 'Save appearance'
                : 'Ko‘rinishni saqlash'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
