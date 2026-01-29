'use client'

import { Component, ReactNode } from 'react'
import ErrorDisplay from './ErrorDisplay'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 개발 환경에서만 오류를 콘솔에 기록
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorDisplay
          title="오류가 발생했습니다"
          message={
            this.state.error?.message ||
            '예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
          }
          onReset={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}
