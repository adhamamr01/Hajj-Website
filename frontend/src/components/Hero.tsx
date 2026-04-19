import { archSvgUrl } from '../assets/silhouettes'

// 8-point Islamic star tessellation (khatam) — Sanctuary Green motif
const STAR_PATTERN = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'>
    <g fill='none' stroke='white' stroke-width='1.2' opacity='0.08'>
      <path d='M40 8 L48 24 L64 24 L52 36 L56 52 L40 44 L24 52 L28 36 L16 24 L32 24 Z'/>
      <path d='M40 8 L32 24 L16 24 L28 36 L24 52 L40 44 L56 52 L52 36 L64 24 L48 24 Z'/>
      <rect x='8' y='8' width='64' height='64'/>
    </g>
  </svg>`
)

export default function Hero() {
  return (
    <section
      className="relative h-[60vh] overflow-hidden"
      style={{ background: 'var(--bg-hero)' }}
    >
      {/* Islamic star tessellation */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: `url("data:image/svg+xml,${STAR_PATTERN}")`, backgroundSize: '80px 80px' }}
      />

      {/* Subtle dark overlay for text contrast */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Centred content */}
      <div className="relative h-full flex items-center justify-center text-center px-4">
        <div className="max-w-4xl animate-fade-in">
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-lg display-font"
            style={{ lineHeight: 1.05 }}
          >
            The Sacred Journey of Hajj
          </h1>
          <p className="text-xl md:text-2xl text-white/95 font-light">
            Explore the spiritual pilgrimage that millions undertake each year
          </p>
        </div>
      </div>

      {/* Minaret / arch silhouette at bottom */}
      <img
        src={archSvgUrl('white', 0.55)}
        aria-hidden="true"
        className="absolute bottom-0 left-0 w-full"
        style={{ height: 80, objectFit: 'cover', objectPosition: 'bottom' }}
      />
    </section>
  )
}
