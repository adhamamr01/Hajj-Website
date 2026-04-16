import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Journey from './pages/Journey'
import MapRoute from './pages/MapRoute'
import MapSites from './pages/MapSites'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/journey" element={<Journey />} />
            <Route path="/map-route" element={<MapRoute />} />
            <Route path="/map-sites" element={<MapSites />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
