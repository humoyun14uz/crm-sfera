import { AxiosError } from 'axios'
import { toast } from 'sonner'

export function handleServerError(error: unknown) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(error)
  }

  let errMsg = 'Something went wrong!'

  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number(error.status) === 204
  ) {
    errMsg = 'No content.'
  }

  if (error instanceof AxiosError) {
    const payload = error.response?.data as { title?: unknown; message?: unknown; error?: { message?: unknown } } | undefined
    const message = payload?.message ?? payload?.error?.message ?? payload?.title
    if (typeof message === 'string' && message.length > 0) errMsg = message
  }

  toast.error(errMsg)
}
