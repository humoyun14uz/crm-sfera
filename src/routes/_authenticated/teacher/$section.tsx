import { lazy, Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { RouteLoading } from '@/components/route-loading'
import { requirePermission } from '@/lib/route-guard'

const TeacherDashboard = lazy(() =>
  import('@/features/teacher').then((m) => ({ default: m.TeacherDashboard }))
)

export const Route = createFileRoute('/_authenticated/teacher/$section')({
  beforeLoad: () => requirePermission('teacher.workspace'),
  component: TeacherSection,
})

function TeacherSection() {
  const { section } = Route.useParams()
  return (
    <Suspense fallback={<RouteLoading />}>
      <TeacherDashboard section={section} />
    </Suspense>
  )
}

