import { lazy, Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { RouteLoading } from '@/components/route-loading'
import { requirePermission } from '@/lib/route-guard'

const FinanceDashboard = lazy(() =>
  import('@/features/finance').then((m) => ({ default: m.FinanceDashboard }))
)

export const Route = createFileRoute('/_authenticated/finance/$section')({
  beforeLoad: () => requirePermission('finance.workspace'),
  component: FinanceSection,
})

function FinanceSection() {
  const { section } = Route.useParams()
  return (
    <Suspense fallback={<RouteLoading />}>
      <FinanceDashboard section={section} />
    </Suspense>
  )
}

