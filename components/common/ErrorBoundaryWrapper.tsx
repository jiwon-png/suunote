'use client'

import ErrorBoundary from './ErrorBoundary'

interface ErrorBoundaryWrapperProps {
  children: React.ReactNode
}

export default function ErrorBoundaryWrapper({
  children,
}: ErrorBoundaryWrapperProps) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}
