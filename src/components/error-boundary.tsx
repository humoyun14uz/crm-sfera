import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[300px] w-full flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center animate-in fade-in duration-200">
          <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive mb-3">
            <AlertTriangle className="size-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {this.props.fallbackTitle || 'Ushbu bo‘limda kutilmagan xatolik yuz berdi'}
          </h3>
          <p className="mt-1.5 max-w-md text-xs text-muted-foreground">
            {this.state.error?.message || 'Iltimos, qayta urinib ko‘ring yoki sahifani yangilang.'}
          </p>
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={this.handleRetry}
              className="gap-2 rounded-lg border-border"
            >
              <RotateCcw className="size-3.5" />
              Qayta urinish
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={() => window.location.reload()}
              className="rounded-lg"
            >
              Sahifani yangilash
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
