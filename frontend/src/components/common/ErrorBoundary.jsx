import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-container-low flex items-center justify-center p-md">
          <div className="text-center max-w-md">
            <span className="material-symbols-outlined text-[64px] text-error">error</span>
            <h2 className="text-headline-md font-semibold text-on-surface mt-sm">Terjadi Kesalahan</h2>
            <p className="text-body-md text-on-surface-variant mt-xs">
              {this.state.error?.message || 'Terjadi kesalahan yang tidak terduga.'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/kasir' }}
              className="mt-md px-md py-sm bg-primary text-on-primary rounded-lg text-label-md font-semibold hover:bg-surface-tint transition-colors cursor-pointer"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
