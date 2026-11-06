import { Component, type ReactNode } from 'react'
import { I18nContext } from '../i18n/I18nProvider'

interface Props { children: ReactNode }
interface State { crashed: boolean; message: string }

/**
 * Catches runtime errors thrown by Leaflet or map child components and
 * renders a friendly fallback instead of a blank page.
 *
 * Must be a class component — React only supports error boundaries via
 * getDerivedStateFromError / componentDidCatch, which have no function-
 * component equivalent. There is no hook alternative.
 */
export default class MapErrorBoundary extends Component<Props, State> {
  static contextType = I18nContext
  declare context: React.ContextType<typeof I18nContext>

  state: State = { crashed: false, message: '' }

  static getDerivedStateFromError(err: unknown): State {
    return {
      crashed: true,
      message: err instanceof Error ? err.message : '',
    }
  }

  handleReset = () => this.setState({ crashed: false, message: '' })

  render() {
    if (this.state.crashed) {
      const { t } = this.context
      return (
        <div className="rounded-xl bg-red-50 border border-red-200 p-8 text-center space-y-4">
          <p className="text-red-700 font-medium">{t('error.map.text')}</p>
          <p className="text-red-500 text-sm font-mono">{this.state.message || t('error.map.fallbackMessage')}</p>
          <button onClick={this.handleReset} className="btn-primary text-sm py-2 px-5">
            {t('common.tryAgain')}
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
