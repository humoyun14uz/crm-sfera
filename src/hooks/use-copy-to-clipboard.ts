import { useCallback, useState } from 'react'
import { toast } from 'sonner'

/**
 * Custom hook to easily copy text (IDs, phone numbers, codes) with automatic toast feedback.
 */
export function useCopyToClipboard() {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copy = useCallback(async (text: string, successMessage = 'Nusxa olindi!') => {
    if (!navigator?.clipboard) {
      toast.error("Brauzer clipboard'ni qo'llab-quvvatlamaydi")
      return false
    }

    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(text)
      toast.success(successMessage)
      return true
    } catch {
      toast.error('Nusxa olishda xatolik yuz berdi')
      setCopiedText(null)
      return false
    }
  }, [])

  return { copiedText, copy }
}
