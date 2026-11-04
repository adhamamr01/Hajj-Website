import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useTranslation } from '../i18n/I18nProvider'
import LanguageSwitch from './LanguageSwitch'
import type { TranslationKey } from '../i18n/translations'

const navLinks: { href: string; label: TranslationKey }[] = [
  { href: '/', label: 'nav.home' },
  { href: '/journey', label: 'nav.journey' },
  { href: '/map-sites', label: 'nav.boundaries' },
  { href: '/map-route', label: 'nav.meeqat' },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { pathname } = useLocation()
  const { t } = useTranslation()

  return (
    <nav className="fixed top-0 inset-x-0 bg-white shadow-md z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          <Link
            to="/"
            className="text-primary hover:text-primary-light transition-colors display-font font-semibold text-2xl"
          >
            {t('site.name')}
          </Link>

          <ul className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className={`font-medium transition-colors ${
                    pathname === link.href
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-700 hover:text-primary'
                  }`}
                >
                  {t(link.label)}
                </Link>
              </li>
            ))}
            <li>
              <LanguageSwitch />
            </li>
          </ul>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-3 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={t('nav.toggleMenu')}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 border-t animate-fade-in">
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`block py-2 px-4 rounded-lg transition-colors ${
                      pathname === link.href
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {t(link.label)}
                  </Link>
                </li>
              ))}
              <li className="px-4 pt-2">
                <LanguageSwitch />
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  )
}
