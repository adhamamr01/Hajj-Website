const stats = [
  { value: 'Over 2 Million', label: 'Pilgrims perform Hajj annually from around the world' },
  { value: '5-6 Days', label: 'The duration of the Hajj pilgrimage rituals' },
  { value: '1,400+ Years', label: 'Of continuous pilgrimage tradition since Prophet Muhammad \u0633' },
]

export default function InfoSection() {
  return (
    <section className="bg-gradient-to-br from-primary to-primary-light py-16 my-16 rounded-2xl mx-4 md:mx-8">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
          {stats.map((stat, index) => (
            <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.2}s` }}>
              <h4 className="text-4xl font-bold mb-3 text-secondary">{stat.value}</h4>
              <p className="text-lg text-white/95">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
