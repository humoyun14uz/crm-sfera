import { lazy, Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { RouteLoading } from '@/components/route-loading'
import { requirePermission } from '@/lib/route-guard'

const Tasks = lazy(() =>
  import('@/features/tasks').then((m) => ({ default: m.Tasks }))
)

export const Route = createFileRoute('/_authenticated/tasks/')({
  beforeLoad: () => requirePermission('tasks.read'),
  component: () => (
    <Suspense fallback={<RouteLoading />}>
      <Tasks />
    </Suspense>
  ),
})

