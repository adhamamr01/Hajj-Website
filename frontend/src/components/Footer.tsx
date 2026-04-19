// Minaret / arch silhouette — decorative top edge of footer
const ARCH_SILHOUETTE = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 120' preserveAspectRatio='xMidYMax slice'>
    <g fill='#111827' opacity='0.9'>
      <path d='M0 120 L0 90 L40 90 L40 60 Q40 50 50 50 L60 50 Q70 50 70 60 L70 90 L90 90 L90 70
               Q90 55 100 55 Q110 55 110 70 L110 90 L150 90 L150 70 Q150 40 180 40 Q210 40 210 70
               L210 90 L260 90 L260 55 Q260 30 290 30 Q320 30 320 55 L320 90 L370 90 L370 65
               Q370 45 400 45 Q430 45 430 65 L430 90 L470 90 L470 75 Q470 60 485 60 Q500 60 500 75
               L500 90 L540 90 L540 55 Q540 35 570 35 Q600 35 600 55 L600 120 Z'/>
      <circle cx='180' cy='30' r='6'/><path d='M180 10 L182 24 L178 24 Z'/>
      <circle cx='290' cy='20' r='7'/><path d='M290 0 L293 14 L287 14 Z'/>
      <circle cx='400' cy='35' r='5'/>
      <circle cx='570' cy='25' r='6'/><path d='M570 6 L572 20 L568 20 Z'/>
    </g>
  </svg>`
)

export default function Footer() {
  return (
    <footer className="mt-16" style={{ background: '#111827' }}>
      {/* Arch silhouette transition from page to footer */}
      <img
        src={`data:image/svg+xml,${ARCH_SILHOUETTE}`}
        aria-hidden="true"
        className="w-full block"
        style={{ height: 64, marginBottom: -2 }}
      />

      <div className="bg-gray-900 py-8">
        <div className="container-custom text-center">
          <p
            className="text-secondary mb-1"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: '1.125rem',
              letterSpacing: '0.01em',
            }}
          >
            Journey to Hajj
          </p>
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Created with reverence and respect.
          </p>
        </div>
      </div>
    </footer>
  )
}
