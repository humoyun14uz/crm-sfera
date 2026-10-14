import { createFileRoute } from '@tanstack/react-router'
import { requireRole } from '@/lib/route-guard'
import { MyTasksPage } from '@/features/my-tasks'

export const Route = createFileRoute('/_authenticated/student/my-tasks/')({
  beforeLoad: () => requireRole('Student'),
  component: MyTasksPage,
})
