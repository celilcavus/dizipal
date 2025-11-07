import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchHomepage, fetchSeriesList, fetchVideosList } from '../api/mediaService'

function SectionTitle({ title, linkLabel, linkHref }) {
  return (
    <div className="section-title">
      <h5>{title}</h5>
      {linkLabel && (
        <a href={linkHref} className="section-link">
          {linkLabel}
        </a>
      )}
    </div>
  )
}

function TrendGrid({ items = [], onSelect }) {
  if (!items.length) {
    return <div className="loading-state">Trend verisi bulunamadı.</div>
  }

  return (
    <ul className="trend-grid">
      {items.map((item) => (
        <li key={item.detailId ?? item.title}>
          <a
            href="#detay"
            onClick={(event) => {
              event.preventDefault()
              onSelect(item)
            }}
          >
            <img src={item.image} alt={item.title} loading="lazy" />
            {item.rank && <span className="trend-number">{item.rank}</span>}
          </a>
        </li>
      ))}
    </ul>
  )
}

function PosterGrid({ items = [], onSelect }) {
  if (!items.length) {
    return <div className="loading-state">İçerik henüz eklenmedi.</div>
  }

  return (
    <ul className="poster-grid">
      {items.map((item) => (
        <li key={item.detailId ?? item.title}>
          <a
            href="#detay"
            onClick={(event) => {
              event.preventDefault()
              onSelect(item)
            }}
          >
            <img src={item.image} alt={item.title} loading="lazy" />
            {item.rating !== undefined && (
              <span className="poster-overlay">
                <span className="play-icon" />
                <span className="vote-badge" aria-hidden>
                  <span className="vote-score">{item.rating}</span>
                  <span className="vote-meta">{item.votes}</span>
                  <span className="vote-bar">
                    <span style={{ width: `${Math.min(item.rating * 10, 100)}%` }} />
                  </span>
                </span>
              </span>
            )}
          </a>
        </li>
      ))}
    </ul>
  )
}

function EpisodeGrid({ items = [], onSelect }) {
  if (!items.length) {
    return <div className="loading-state">Henüz bölüm bulunmuyor.</div>
  }

  return (
    <div className="episode-grid">
      {items.map((episode) => (
        <a
          href="#detay"
          key={`${episode.title}-${episode.episode}`}
          className="episode-card"
          onClick={(event) => {
            event.preventDefault()
            onSelect(episode)
          }}
        >
          <img src={episode.image} alt={episode.title} loading="lazy" />
          <div>
            <span className="episode-title">{episode.title}</span>
            <span className="episode-meta">{episode.episode}</span>
            <span className="episode-time">{episode.time}</span>
          </div>
        </a>
      ))}
    </div>
  )
}

function HomePage() {
  const navigate = useNavigate()
  const [homepage, setHomepage] = useState(null)
  const [homepageLoading, setHomepageLoading] = useState(true)

  const [seriesList, setSeriesList] = useState([])
  const [seriesLoading, setSeriesLoading] = useState(false)
  const [videosList, setVideosList] = useState([])
  const [videosLoading, setVideosLoading] = useState(false)

  useEffect(() => {
    let ignore = false

    async function loadHomepage() {
      try {
        setHomepageLoading(true)
        const data = await fetchHomepage()
        if (!ignore) {
          setHomepage(data)
        }
      } catch (error) {
        console.error('Homepage yüklenirken hata oluştu', error)
      } finally {
        if (!ignore) {
          setHomepageLoading(false)
        }
      }
    }

    loadHomepage()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    let ignore = false

    async function loadSeries() {
      try {
        setSeriesLoading(true)
        const data = await fetchSeriesList({ limit: 20, offset: 0 })
        if (ignore) {
          return
        }
        const mapped = (data.series ?? []).map((item) => ({
          id: item.ID,
          slug: item.Slug,
          title: item.Title,
          image: item.PosterURL,
          detailId: item.ID ? String(item.ID) : item.Slug,
          releaseYear: item.ReleaseYear,
          description: item.Description,
          raw: item,
          type: 'series',
        }))
        setSeriesList(mapped)
      } catch (error) {
        console.error('Dizi listesi yüklenirken hata oluştu', error)
      } finally {
        if (!ignore) {
          setSeriesLoading(false)
        }
      }
    }

    loadSeries()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    let ignore = false

    async function loadVideos() {
      try {
        setVideosLoading(true)
        const data = await fetchVideosList({ page: 1, limit: 10 })
        if (ignore) {
          return
        }
        const mapped = (data.videos ?? []).map((item) => ({
          id: item.id,
          slug: item.slug,
          title: item.title,
          image: item.thumbnail_url,
          detailId: item.id,
          description: item.description,
          videoUrl: item.r2_url,
          raw: item,
          type: 'video',
        }))
        setVideosList(mapped)
      } catch (error) {
        console.error('Video listesi yüklenirken hata oluştu', error)
      } finally {
        if (!ignore) {
          setVideosLoading(false)
        }
      }
    }

    loadVideos()

    return () => {
      ignore = true
    }
  }, [])

  const handleNavigate = (item) => {
    if (!item) {
      return
    }
    const numericId = item.id ?? item.raw?.ID
    const slug = item.slug ?? item.detailId
    const target = numericId != null ? numericId : slug
    if (!target) {
      return
    }
    const fallback = item.raw ?? null
    const type = item.type ?? item.raw?.type ?? item.raw?.Type ?? 'series'
    if (type === 'video') {
      const videoTarget = item.id ?? item.detailId ?? slug
      navigate(`/videos/${videoTarget}`, { state: { fallback, slug } })
      return
    }
    navigate(`/series/${target}`, { state: { fallback, slug } })
  }

  const hero = homepage?.hero
  const heroStyle = {
    '--hero-bg': hero ? `url(${hero.backdrop})` : 'none',
  }

  const displaySeries = seriesList.length ? seriesList : homepage?.newSeries ?? []
  const displayMovies = videosList.length ? videosList : homepage?.newMovies ?? []

  return (
    <>
      <div className="hero" style={heroStyle}>
        <div className="container">
          <div className="search-input" role="search">
            <input type="text" placeholder="ara..." aria-label="Arama" />
            <button type="button" aria-label="Aramayı kapat">
              ×
            </button>
          </div>
          <div className="movie-on-cover">
            Görseldeki Film:{' '}
            {hero ? (
              <a
                href="#detay"
                onClick={(event) => {
                  event.preventDefault()
                  handleNavigate({ detailId: hero.detailId })
                }}
              >
                {hero.title}
              </a>
            ) : (
              'Yükleniyor...'
            )}
          </div>
        </div>
      </div>

      <main className="container main">
        {homepageLoading ? (
          <div className="loading-state">İçerik yükleniyor...</div>
        ) : (
          <>
            <section className="module">
              <SectionTitle title="Trendlerde bugün" linkLabel="Tümü" linkHref="#trendler" />
              <TrendGrid items={homepage?.trends ?? []} onSelect={handleNavigate} />
            </section>

            <section className="module">
              <SectionTitle title="Yeni diziler" linkLabel="Tümü" linkHref="#diziler" />
              {seriesLoading && !seriesList.length ? (
                <div className="loading-state">Diziler yükleniyor...</div>
              ) : (
                <PosterGrid items={displaySeries} onSelect={handleNavigate} />
              )}
            </section>

            <section className="module">
              <SectionTitle title="Yeni filmler" linkLabel="Tümü" linkHref="#filmler" />
              {videosLoading && !videosList.length ? (
                <div className="loading-state">Filmler yükleniyor...</div>
              ) : (
                <PosterGrid items={displayMovies} onSelect={handleNavigate} />
              )}
            </section>

            <section className="module">
              <SectionTitle title="Yeni bölümler" linkLabel="Tümü" linkHref="#bolumler" />
              <EpisodeGrid items={homepage?.newEpisodes ?? []} onSelect={handleNavigate} />
            </section>

            <section className="module">
              <SectionTitle title="Gizemli mini diziler" />
              <PosterGrid items={homepage?.mysterySeries ?? []} onSelect={handleNavigate} />
            </section>

            <section className="module">
              <SectionTitle title="Editörün seçtikleri" linkLabel="Tümü" linkHref="#editor" />
              <PosterGrid items={homepage?.editorPicks ?? []} onSelect={handleNavigate} />
            </section>
          </>
        )}
      </main>
    </>
  )
}

export default HomePage
