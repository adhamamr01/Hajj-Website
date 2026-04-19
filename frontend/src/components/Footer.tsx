import { archSvgUrl } from '../assets/silhouettes'

export default function Footer() {
  return (
    <footer className="mt-16" style={{ background: '#111827' }}>
      {/* Arch silhouette transition from page to footer */}
      <img
        src={archSvgUrl('#111827', 0.9)}
        aria-hidden="true"
        className="w-full block"
        style={{ height: 64, marginBottom: -2 }}
      />

      <div className="bg-gray-900 py-8">
        <div className="container-custom text-center">
          <p className="text-secondary mb-1 display-font text-lg">Journey to Hajj</p>
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Created with reverence and respect.
          </p>
        </div>
      </div>
    </footer>
  )
}
