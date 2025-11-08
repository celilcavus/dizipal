import { Link, Routes, Route } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import HomePage from './pages/HomePage'
import SeriesDetailPage from './pages/SeriesDetailPage'
import VideoDetailPage from './pages/VideoDetailPage'
import AuthModal from './components/AuthModal'
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

function Header({ categories, activeCategory, activePrimaryNav, onOpenAuth, onSelectCategory, onPrimaryNavSelect }) {
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

  const normalizedCategories = useMemo(() => {
    if (!Array.isArray(categories) || !categories.length) {
      return []
    }
    const unique = new Map()
    categories.forEach((category, index) => {
      const name = getCategoryName(category)
      if (!name) {
        return
      }
      const slug = getCategorySlug(category) || `category-${index}`
      const id =
        category.id ??
        category.ID ??
        category.category_id ??
        category.CategoryID ??
        category.Id ??
        category.uuid ??
        null
      if (!unique.has(slug)) {
        unique.set(slug, { id, slug, name, raw: category })
      }
    })
    return Array.from(unique.values())
  }, [categories])

  const platformCategories = useMemo(() => {
    if (!normalizedCategories.length) {
      return fallbackPlatformCategories.map((item, index) => ({
        id: null,
        slug: item.slug || `platform-${index}`,
        name: item.name,
        raw: null,
      }))
    }
    return normalizedCategories.slice(0, 12)
  }, [normalizedCategories])

  const isActiveCategory = (category) => Boolean(category?.id) && activeCategory?.id === category.id

  const handleCategoryActivate = (category, event) => {
    if (event) {
      event.preventDefault()
    }
    closeMobileMenu()
    if (!onSelectCategory) {
      return
    }
    if (!category?.id) {
      onSelectCategory(null)
      return
    }
    if (activeCategory?.id === category.id) {
      onSelectCategory(null)
    } else {
      onSelectCategory(category)
    }
  }

  const handlePrimaryNavClick = (item, event) => {
    handleCategoryActivate(null, event)
    onPrimaryNavSelect?.(item.slug)
  }

  const handleLoginClick = (event) => {
    event.preventDefault()
    closeMobileMenu()
    onOpenAuth?.('login')
  }

  const handleLogoClick = () => {
    closeMobileMenu()
    onSelectCategory?.(null)
    onPrimaryNavSelect?.('/')
  }

  return (
    <header className={`header ${mobileMenuOpen ? 'header--open' : ''}`}>
      <div className="container header__bar">
        <h1 className="logo" data-request="">
          <Link to="/" onClick={handleLogoClick}>
            <span className="icon icon--badge" aria-hidden>
              D
            </span>
            <span>dizipal</span>
          </Link>
        </h1>

        <nav className="menu">
          <ul>
            {fallbackPrimaryNav.map((item) => (
              <li key={item.slug}>
                <a
                  href={`#${item.slug}`}
                  onClick={(event) => handlePrimaryNavClick(item, event)}
                  className={activePrimaryNav === item.slug ? 'is-active' : ''}
                >
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
                      <a
                        href={`#${platform.slug}`}
                        key={platform.slug}
                        onClick={(event) => handleCategoryActivate(platform, event)}
                        className={isActiveCategory(platform) ? 'is-active' : ''}
                      >
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
          <a href="#login" className="header__login" onClick={handleLoginClick}>
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
                  <a
                    href={`#${item.slug}`}
                    onClick={(event) => handlePrimaryNavClick(item, event)}
                    className={activePrimaryNav === item.slug ? 'is-active' : ''}
                  >
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
                  <a
                    href={`#${slug}`}
                    key={`mobile-platform-${slug}`}
                    onClick={(event) => handleCategoryActivate(platform, event)}
                    className={isActiveCategory(platform) ? 'is-active' : ''}
                  >
                    {platform.name}
                  </a>
                )
              })}
            </div>
          </div>

          <div className="mobile-nav__section mobile-nav__footer">
            <a href="#login" className="mobile-nav__login" onClick={handleLoginClick}>
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
  const [activeCategory, setActiveCategory] = useState(null)
  const [authMode, setAuthMode] = useState(null)
  const [primaryNavSelection, setPrimaryNavSelection] = useState({ slug: 'filmler', version: 0 })
  const [animeCategory, setAnimeCategory] = useState(null)

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
        const animeItem = incoming.find((item) => {
          const name = getCategoryName(item).toLowerCase()
          const slug = getCategorySlug(item)
          return name.includes('anime') || slug.includes('anime')
        })
        if (animeItem) {
          setAnimeCategory({
            id:
              animeItem.id ??
              animeItem.ID ??
              animeItem.category_id ??
              animeItem.CategoryID ??
              animeItem.Id ??
              animeItem.uuid ??
              null,
            slug: getCategorySlug(animeItem),
            name: getCategoryName(animeItem) || 'Animeler',
          })
        }
      } catch (error) {
        console.error('Kategoriler yüklenirken hata oluştu', error)
      }
    }

    loadCategories()

    return () => {
      ignore = true
    }
  }, [])

  const handlePrimaryNavSelect = (slug) => {
    setPrimaryNavSelection((prev) => ({
      slug,
      version: slug === prev.slug ? prev.version + 1 : 0,
    }))
  if (slug === 'filmler' || slug === 'diziler' || slug === 'animeler') {
      setActiveCategory(null)
    }
  }

  return (
    <div className="page">
      <Header
        categories={categories}
        activeCategory={activeCategory}
        activePrimaryNav={primaryNavSelection.slug}
        onOpenAuth={setAuthMode}
        onSelectCategory={setActiveCategory}
        onPrimaryNavSelect={handlePrimaryNavSelect}
      />
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              selectedCategory={activeCategory}
              primaryNavSelection={primaryNavSelection}
              animeCategory={animeCategory}
            />
          }
        />
        <Route path="/series/:seriesId" element={<SeriesDetailPage />} />
        <Route path="/videos/:videoId" element={<VideoDetailPage />} />
      </Routes>
      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSwitchMode={(nextMode) => setAuthMode(nextMode)}
        />
      )}
      <Footer />
    </div>
  )
}

export default App