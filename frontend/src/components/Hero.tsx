export default function Hero() {
  return (
    <section className="relative h-[60vh] bg-gradient-to-br from-primary to-primary-light overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 10 L90 90 L10 90 Z' fill='white'/%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px',
          }}
        />
      </div>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative h-full flex items-center justify-center text-center px-4">
        <div className="max-w-4xl animate-fade-in">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-lg">
            The Sacred Journey of Hajj
          </h1>
          <p className="text-xl md:text-2xl text-white/95 font-light">
            Explore the spiritual pilgrimage that millions undertake each year
          </p>
        </div>
      </div>
    </section>
  )
}
