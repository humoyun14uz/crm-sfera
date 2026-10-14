import { lazy, Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { RouteLoading } from '@/components/route-loading'
import { requirePermission } from '@/lib/route-guard'

const CourseDetails = lazy(() =>
  import('@/features/courses/details').then((m) => ({ default: m.CourseDetails }))
)

export const Route = createFileRoute('/_authenticated/apps/$courseId')({
  beforeLoad: () => requirePermission('courses.read'),
  component: () => (
    <Suspense fallback={<RouteLoading />}>
      <CourseDetails />
    </Suspense>
  ),
})

