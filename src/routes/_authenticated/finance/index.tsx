import { lazy, Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { RouteLoading } from '@/components/route-loading'
import { requirePermission } from '@/lib/route-guard'

const FinanceDashboard = lazy(() =>
  import('@/features/finance').then((m) => ({ default: m.FinanceDashboard }))
)

export const Route = createFileRoute('/_authenticated/finance/')({
  beforeLoad: () => requirePermission('finance.workspace'),
  component: () => (
    <Suspense fallback={<RouteLoading />}>
      <FinanceDashboard />
    </Suspense>
  ),
})

