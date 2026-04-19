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

// Minaret / arch silhouette — decorative bottom edge of hero
const ARCH_SILHOUETTE = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 120' preserveAspectRatio='xMidYMax slice'>
    <g fill='white' opacity='0.55'>
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

export default function Hero() {
  return (
    <section
      className="relative h-[60vh] overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f3d27 0%, #1a5f3f 55%, #2a7f5f 100%)' }}
    >
      {/* Islamic star tessellation */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,${STAR_PATTERN}")`,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Subtle dark overlay for text contrast */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Centred content */}
      <div className="relative h-full flex items-center justify-center text-center px-4">
        <div className="max-w-4xl animate-fade-in">
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-lg"
            style={{
              fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
              fontStyle: 'italic',
              letterSpacing: '-0.01em',
              lineHeight: 1.05,
            }}
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
        src={`data:image/svg+xml,${ARCH_SILHOUETTE}`}
        aria-hidden="true"
        className="absolute bottom-0 left-0 w-full"
        style={{ height: 80, objectFit: 'cover', objectPosition: 'bottom' }}
      />
    </section>
  )
}
