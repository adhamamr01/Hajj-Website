export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-16">
      <div className="container-custom text-center">
        <p className="text-gray-400">
          &copy; {new Date().getFullYear()} Journey to Hajj. Created with reverence and respect.
        </p>
      </div>
    </footer>
  )
}
