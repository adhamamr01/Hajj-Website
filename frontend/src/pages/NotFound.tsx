import { Link } from 'react-router-dom'
import { useMeta } from '../hooks/useMeta'

export default function NotFound() {
  useMeta({ title: 'Page Not Found — Journey to Hajj' })

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <p className="text-8xl">🕋</p>
        <h1 className="text-4xl font-semibold text-primary display-font">Page Not Found</h1>
        <p className="text-stone-500 text-lg">
          The page you're looking for doesn't exist.
        </p>
        <Link to="/" className="btn-primary inline-block py-3 px-8">
          Return Home
        </Link>
      </div>
    </div>
  )
}
