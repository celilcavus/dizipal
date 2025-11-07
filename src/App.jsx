import { Link, Routes, Route } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import HomePage from './pages/HomePage'
import SeriesDetailPage from './pages/SeriesDetailPage'
import { fetchCategories } from './api/mediaService'
import './App.css'

const fallbackPrimaryNav = [
  { slug: 'filmler', name: 'Filmler' },
  { slug: 'diziler', name: 'Diziler' },
  { slug: 'animeler', name: 'Animeler' },
]

const fallbackPlatformCategories = [
  { slug: 'netflix', name: 'Netflix' },
  { slug: 'exxen', name: 'Exxen' },
  { slug: 'blutv', name: 'BluTV' },
  { slug: 'disney-plus', name: 'Disney+' },
  { slug: 'amazon', name: 'Amazon' },
  { slug: 'tod', name: 'TOD' },
  { slug: 'gain', name: 'Gain' },
  { slug: 'mubi', name: 'Mubi' },
]

const getCategoryName = (category) => {
  if (!category) {
    return ''
  }
  if (typeof category === 'string') {
    return category
  }
  return (
    category.name ??
    category.Name ??
    category.title ??
    category.Title ??
    category.label ??
    ''
  )
}

const getCategorySlug = (category) => {
  if (!category) {
    return ''
  }
  if (typeof category === 'string') {
    return category.toLowerCase()
  }
  const value =
    category.slug ??
    category.Slug ??
    category.identifier ??
    category.code ??
    ''
  if (value) {
    return String(value).toLowerCase()
  }
  const name = getCategoryName(category)
  return name ? name.toLowerCase().replace(/\s+/g, '-') : ''
}

const iconSvgs = {
  filmler: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
      <path d="M7 5v14M17 5v14M3 9h4M17 9h4M3 15h4M17 15h4" />
    </svg>
  ),
  diziler: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="13" rx="2" ry="2" />
      <path d="M7 7L12 3l5 4" />
      <path d="M12 20v1.5" />
    </svg>
  ),
  animeler: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="10" r="3" />
      <path d="M4 20c0-3 2.5-5 5-5s5 2 5 5" />
      <path d="M13.5 20c0-2.5 2-4 4.5-4 1 0 1.8.2 2.5.6" />
    </svg>
  ),
}

const renderNavIcon = (slug) => {
  const normalized = slug?.toLowerCase()
  if (normalized && iconSvgs[normalized]) {
    return iconSvgs[normalized]
  }
  return <span className="nav-icon__dot" />
}

function Header({ categories }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    if (!mobileMenuOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

  const platformCategories = useMemo(() => {
    if (!categories || !categories.length) {
      return fallbackPlatformCategories
    }
    const unique = new Map()
    categories.forEach((category, index) => {
      const name = getCategoryName(category)
      if (!name) {
        return
      }
      const slug = getCategorySlug(category) || `platform-${index}`
      if (!unique.has(slug)) {
        unique.set(slug, { slug, name })
      }
    })
    const normalized = Array.from(unique.values())
    return normalized.length ? normalized.slice(0, 12) : fallbackPlatformCategories
  }, [categories])

  return (
    <header className={`header ${mobileMenuOpen ? 'header--open' : ''}`}>
      <div className="container header__bar">
        <h1 className="logo" data-request="">
          <Link to="/">
            <span className="icon" aria-hidden>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512.3 573.5" role="img">
                <path d="M0,12.1C47.8,4.4,112.3,0,178.9,0c107.9,0,175.6,17.5,231.5,55.9,62,42.8,101.9,112.9,101.9,216.3,0,114.6-43.4,189.1-98.3,231.9-61.9,48.1-154.1,69.4-264.1,69.4C77.7,573.5,28.8,568.7,0,564.3V12.1ZM150.5,454.7c7.9,1.7,21.7,1.7,31.9,1.7,97.7,1.3,169.9-52.4,169.9-179.3,0-110-65.5-161.8-155.9-161.8-23.6,0-38.2,1.9-45.9,3.8V454.7Z" />
              </svg>
            </span>
            <span>dizipal</span>
          </Link>
        </h1>

        <nav className="menu">
          <ul>
            {fallbackPrimaryNav.map((item) => (
              <li key={item.slug}>
                <a href={`#${item.slug}`}>
                  <span className="nav-icon" aria-hidden>
                    {renderNavIcon(item.slug)}
                  </span>
                  {item.name}
                </a>
              </li>
            ))}
            {platformCategories.length > 0 && (
              <li className="drop-li">
                <span className="platform-button" tabIndex={0} role="button">
                  <span className="nav-icon" aria-hidden>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </span>
                  Platformlar
                  <div className="drop">
                    {platformCategories.map((platform) => (
                      <a href={`#${platform.slug}`} key={platform.slug}>
                        {platform.name}
                      </a>
                    ))}
                  </div>
                </span>
              </li>
            )}
          </ul>
        </nav>

        <div className="header__actions">
          <button className="header__action header__action--search" type="button" aria-label="Ara">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C8.01 14 6 11.99 6 9.5S8.01 5 10.5 5 15 7.01 15 9.5 12.99 14 10.5 14z"
              />
            </svg>
          </button>
          <button
            className={`header__action header__action--burger ${mobileMenuOpen ? 'is-open' : ''}`}
            type="button"
            onClick={toggleMobileMenu}
            aria-label={mobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            aria-expanded={mobileMenuOpen}
          >
            <span />
            <span />
            <span />
          </button>
          <a href="#login" className="header__login">
            Giriş yap
          </a>
        </div>
      </div>

      <div className={`mobile-nav ${mobileMenuOpen ? 'is-open' : ''}`}>
        <div className="mobile-nav__content">
          <div className="mobile-nav__section mobile-nav__search">
            <input type="search" placeholder="Ara..." aria-label="Ara" />
            <button type="button" aria-label="Menüyü kapat" onClick={closeMobileMenu}>
              ✕
            </button>
          </div>

          <div className="mobile-nav__section mobile-nav__links">
            <ul>
              {fallbackPrimaryNav.map((item) => (
                <li key={`mobile-${item.slug}`}>
                  <a href={`#${item.slug}`} onClick={closeMobileMenu}>
                    <span className="nav-icon" aria-hidden>
                      {renderNavIcon(item.slug)}
                    </span>
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="mobile-nav__section">
            <p className="mobile-nav__label">Platformlar</p>
            <div className="mobile-nav__grid">
              {platformCategories.map((platform, index) => {
                const slug = platform.slug || `platform-${index}`
                return (
                  <a href={`#${slug}`} key={`mobile-platform-${slug}`} onClick={closeMobileMenu}>
                    {platform.name}
                  </a>
                )
              })}
            </div>
          </div>

          <div className="mobile-nav__section mobile-nav__footer">
            <a href="#login" className="mobile-nav__login" onClick={closeMobileMenu}>
              Giriş yap
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <blockquote>
          “It’s only after we’ve lost everything that we’re free to do anything.”
          <a href="#fight-club">Fight Club</a>
        </blockquote>
        <p className="contact-mail">dizipal@yandex.com</p>
      </div>
    </footer>
  )
}

function App() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
  }, [])

  const [categories, setCategories] = useState([])

  useEffect(() => {
    let ignore = false

    async function loadCategories() {
      try {
        const data = await fetchCategories()
        if (ignore) {
          return
        }
        const incoming = Array.isArray(data?.categories)
          ? data.categories
          : Array.isArray(data)
            ? data
            : []
        setCategories(incoming)
      } catch (error) {
        console.error('Kategoriler yüklenirken hata oluştu', error)
      }
    }

    loadCategories()

    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="page">
      <Header categories={categories} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/series/:seriesId" element={<SeriesDetailPage />} />
      </Routes>
      <Footer />
    </div>
  )
}

export default App

