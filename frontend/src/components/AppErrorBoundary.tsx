import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { crashed: boolean }

/**
 * Top-level error boundary. Catches any render error not handled by a
 * more specific boundary (e.g. MapErrorBoundary) and shows a full-page
 * fallback instead of a blank screen.
 *
 * Must be a class component — React only supports error boundaries via
 * getDerivedStateFromError / componentDidCatch.
 */
export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false }

  static getDerivedStateFromError(): State {
    return { crashed: true }
  }

  handleReset = () => this.setState({ crashed: false })

  render() {
    if (this.state.crashed) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-semibold text-stone-800">Something went wrong</h1>
            <p className="text-stone-500">An unexpected error occurred. Please try refreshing the page.</p>
            <button onClick={this.handleReset} className="btn-primary py-2 px-6">
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
