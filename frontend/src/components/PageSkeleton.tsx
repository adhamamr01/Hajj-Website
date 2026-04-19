/** Full-page shimmer shown while a lazy route chunk is downloading. */
export default function PageSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      {/* Hero shimmer */}
      <div className="h-64 bg-primary/20 rounded-b-lg" />

      {/* Content shimmer */}
      <div className="container-custom py-16 space-y-6">
        <div className="h-8 bg-gray-200 rounded-lg w-1/3 mx-auto" />
        <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-48" />
          ))}
        </div>
      </div>
    </div>
  )
}
