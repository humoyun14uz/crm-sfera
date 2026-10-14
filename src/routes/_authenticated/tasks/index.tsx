import { createFileRoute } from '@tanstack/react-router'
import { requirePermission } from '@/lib/route-guard'
import { Tasks } from '@/features/tasks'

export const Route = createFileRoute('/_authenticated/tasks/')({
  beforeLoad: () => requirePermission('tasks.read'),
  component: Tasks,
})
