import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/use-online-status'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-all duration-300">
      <WifiOff className="size-3.5 animate-pulse" />
      <span>Internet aloqasi uzildi. Ba’zi o‘zgarishlar saqlanmasligi mumkin.</span>
    </div>
  )
}
