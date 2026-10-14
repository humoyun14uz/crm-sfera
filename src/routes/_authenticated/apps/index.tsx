import { lazy, Suspense } from 'react'
import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { RouteLoading } from '@/components/route-loading'
import { requirePermission } from '@/lib/route-guard'

const Courses = lazy(() =>
  import('@/features/courses').then((m) => ({ default: m.Courses }))
)

const appsSearchSchema = z.object({
  type: z
    .enum(['all', 'connected', 'notConnected'])
    .optional()
    .catch(undefined),
  filter: z.string().optional().catch(''),
  sort: z.enum(['asc', 'desc']).optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/apps/')({
  beforeLoad: () => requirePermission('courses.read'),
  validateSearch: appsSearchSchema,
  component: () => (
    <Suspense fallback={<RouteLoading />}>
      <Courses />
    </Suspense>
  ),
})

