import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { crashed: boolean; message: string }

/**
 * Catches runtime errors thrown by Leaflet or map child components and
 * renders a friendly fallback instead of a blank page.
 */
export default class MapErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false, message: '' }

  static getDerivedStateFromError(err: unknown): State {
    return {
      crashed: true,
      message: err instanceof Error ? err.message : 'An unexpected error occurred.',
    }
  }

  handleReset = () => this.setState({ crashed: false, message: '' })

  render() {
    if (this.state.crashed) {
      return (
        <div className="rounded-xl bg-red-50 border border-red-200 p-8 text-center space-y-4">
          <p className="text-red-700 font-medium">The map encountered an error and could not render.</p>
          <p className="text-red-500 text-sm font-mono">{this.state.message}</p>
          <button onClick={this.handleReset} className="btn-primary text-sm py-2 px-5">
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
