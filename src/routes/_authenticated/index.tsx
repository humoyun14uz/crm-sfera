import { lazy, Suspense } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { RouteLoading } from '@/components/route-loading'
import { getPrimaryRole } from '@/lib/rbac'
import { requireAuthenticated } from '@/lib/route-guard'
import { useAuthStore } from '@/stores/auth-store'

const Dashboard = lazy(() =>
  import('@/features/dashboard').then((m) => ({ default: m.Dashboard }))
)
const StudentDashboard = lazy(() =>
  import('@/features/student/student-dashboard').then((m) => ({ default: m.StudentDashboard }))
)

export const Route = createFileRoute('/_authenticated/')({
  beforeLoad: () => {
    requireAuthenticated()
    const role = getPrimaryRole(useAuthStore.getState().auth.user?.role)
    if (role === 'Teacher') throw redirect({ to: '/teacher' })
    if (role === 'Finance') throw redirect({ to: '/finance' })
    if (role === 'Student') throw redirect({ to: '/student/my-course' })
  },
  component: RoleDashboard,
})

function RoleDashboard() {
  const role = getPrimaryRole(useAuthStore((state) => state.auth.user?.role))
  return (
    <Suspense fallback={<RouteLoading />}>
      {role === 'Student' ? <StudentDashboard /> : <Dashboard />}
    </Suspense>
  )
}

