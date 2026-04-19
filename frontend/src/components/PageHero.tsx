interface Props {
  title: string
  subtitle: string
}

export default function PageHero({ title, subtitle }: Props) {
  return (
    <section className="py-16 text-white" style={{ background: 'var(--bg-hero)' }}>
      <div className="container-custom text-center">
        <h1 className="mb-4 text-white hero-title">{title}</h1>
        <p className="text-xl text-white/90 max-w-3xl mx-auto">{subtitle}</p>
      </div>
    </section>
  )
}
