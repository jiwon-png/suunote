interface EmptyStateProps {
  title?: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({
  title = 'No items found',
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="text-sm text-gray-600 mt-2">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
