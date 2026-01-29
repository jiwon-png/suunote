interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fullScreen?: boolean
  inline?: boolean
}

const sizeClasses = {
  sm: 'h-4 w-4 border-b',
  md: 'h-8 w-8 border-b-2',
  lg: 'h-12 w-12 border-b-2',
  xl: 'h-16 w-16 border-b-2',
}

export default function LoadingSpinner({
  size = 'md',
  className = '',
  fullScreen = false,
  inline = false,
}: LoadingSpinnerProps = {}) {
  const spinner = (
    <div
      className={`animate-spin rounded-full border-primary ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="로딩 중"
    >
      <span className="sr-only">로딩 중...</span>
    </div>
  )

  if (inline) {
    return spinner
  }

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinner}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-12">
      {spinner}
    </div>
  )
}
