import { lazy, Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { RouteLoading } from '@/components/route-loading'
import { academyModulePermission } from '@/features/academy-module'
import { requirePermission } from '@/lib/route-guard'

const AcademyModule = lazy(() =>
  import('@/features/academy-module').then((m) => ({ default: m.AcademyModule }))
)

export const Route = createFileRoute('/_authenticated/academy/$moduleId')({
  beforeLoad: ({ params }) => requirePermission(academyModulePermission(params.moduleId)),
  component: RouteComponent,
})

function RouteComponent() {
  const { moduleId } = Route.useParams()
  return (
    <Suspense fallback={<RouteLoading />}>
      <AcademyModule moduleId={moduleId} />
    </Suspense>
  )
}

