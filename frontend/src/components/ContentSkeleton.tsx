interface Props {
  /** Number of skeleton rows to show (default 5) */
  rows?: number
}

/** Inline shimmer for data that is still loading inside a page. */
export default function ContentSkeleton({ rows = 5 }: Props) {
  return (
    <div className="space-y-6 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-xl p-6 space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
      ))}
    </div>
  )
}
