import { lazy, Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { RouteLoading } from '@/components/route-loading'
import { requirePermission } from '@/lib/route-guard'

const Chats = lazy(() =>
  import('@/features/chats').then((m) => ({ default: m.Chats }))
)

export const Route = createFileRoute('/_authenticated/chats/')({
  beforeLoad: () => requirePermission('messages.read'),
  component: () => (
    <Suspense fallback={<RouteLoading />}>
      <Chats />
    </Suspense>
  ),
})

