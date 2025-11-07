import { useEffect, useMemo, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { fetchDetail, fetchSeriesDetail, fetchSeriesList } from '../api/mediaService'
import VideoPlayer from '../components/VideoPlayer'

const normalizeImageUrl = (url) => {
  if (!url) {
    return url
  }
  if (url.includes('themoviedb.org/t/p')) {
    return url.replace('https://www.themoviedb.org/t/p/original', 'https://image.tmdb.org/t/p/original')
  }
  return url
}

const normalizeVideoUrl = (url) => {
  if (!url) {
    return url
  }
  if (url.startsWith('http')) {
    return url
  }
  return null
}

function SeasonTabs({ seasons = [], activeSeason, onChange }) {
  if (!seasons.length) {
    return null
  }

  return (
    <div className="season-tabs" role="tablist" aria-label="Sezonlar">
      {seasons.map((season) => (
        <button
          key={season.number}
          role="tab"
          type="button"
          className={season.number === activeSeason ? 'active' : ''}
          aria-selected={season.number === activeSeason}
          onClick={() => onChange(season.number)}
        >
          {season.title ?? `${season.number}. Sezon`}
        </button>
      ))}
    </div>
  )
}

function EpisodeGrid({ episodes = [], activeEpisode, onSelect, cover }) {
  if (!episodes.length) {
    return <div className="loading-state">Bu sezonda bölüm yok.</div>
  }

  return (
    <div className="episode-grid selector">
      {episodes.map((episode, index) => {
        const isActive =
          activeEpisode?.title === episode.title && activeEpisode?.episode === episode.episode
        return (
          <button
            key={`${episode.title}-${index}`}
            type="button"
            className={`episode-card ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(episode)}
          >
            <span className="episode-card__thumb">
              {cover ? <img src={cover} alt={episode.title} loading="lazy" /> : null}
            </span>
            <span className="episode-card__body">
              <span className="episode-title">{episode.episode ?? episode.title}</span>
              <span className="episode-meta">{episode.title}</span>
              <span className="episode-time">{episode.duration}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

function mapSeriesDetail(series) {
  if (!series) {
    return null
  }

  const formatDate = (value) => {
    if (!value) {
      return 'Tarih bilinmiyor'
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return 'Tarih bilinmiyor'
    }
    return date.toLocaleDateString('tr-TR')
  }

  const seasons = (series.Seasons ?? []).map((season, index) => {
    const episodes = (season.Episodes ?? []).map((episode) => {
      const title = episode.Title || `${season.SeasonNumber}. Sezon ${episode.EpisodeNumber}. Bölüm`
      const durationLabel = episode.Duration ? `${episode.Duration} dk` : 'Süre bilinmiyor'

      return {
        title,
        episode: episode.EpisodeNumber ? `${episode.EpisodeNumber}. Bölüm` : episode.Title,
        releasedAt: formatDate(episode.CreatedAt || season.ReleaseDate),
        duration: durationLabel,
        videoUrl: normalizeVideoUrl(episode.VideoURL),
        backupVideoUrl: normalizeVideoUrl(episode.BackupVideoURL),
        description: episode.Description,
      }
    })

    return {
      number: season.SeasonNumber || index + 1,
      title: season.Title || `${season.SeasonNumber || index + 1}. Sezon`,
      releaseDate: formatDate(season.ReleaseDate),
      episodes,
    }
  })

  const tags = ['Dizi']
  if (series.ReleaseYear) {
    tags.push(String(series.ReleaseYear))
  }
  if (series.IsFeatured) {
    tags.push('Öne çıkan')
  }

  return {
    type: 'series',
    title: series.Title,
    cover: normalizeImageUrl(series.PosterURL) || series.PosterURL,
    description: series.Description,
    tags,
    releaseYear: series.ReleaseYear,
    seasons,
  }
}

function mapFallbackDetail(fallback) {
  if (!fallback) {
    return null
  }

  return {
    type: 'series',
    title: fallback.Title || fallback.title || 'İçerik',
    cover: normalizeImageUrl(fallback.PosterURL) || fallback.image,
    description:
      fallback.Description || fallback.description || 'Bu içerik hakkında bilgiler yakında eklenecek.',
    tags: ['Dizi'],
    releaseYear: fallback.ReleaseYear || fallback.releaseYear,
    seasons: (fallback.Seasons ?? fallback.seasons ?? []).map((season, index) => ({
      number: season.SeasonNumber || season.number || index + 1,
      title: season.Title || season.title || `${season.SeasonNumber || index + 1}. Sezon`,
      releaseDate: season.ReleaseDate || season.releaseDate || '',
      episodes: (season.Episodes ?? season.episodes ?? []).map((episode) => ({
        title: episode.Title || episode.title,
        episode: episode.EpisodeNumber
          ? `${episode.EpisodeNumber}. Bölüm`
          : episode.title || episode.Title,
        releasedAt: episode.CreatedAt || episode.releasedAt || '',
        duration: episode.Duration ? `${episode.Duration} dk` : episode.duration ?? 'Süre bilinmiyor',
        videoUrl: normalizeVideoUrl(episode.VideoURL || episode.videoUrl),
        backupVideoUrl: normalizeVideoUrl(episode.BackupVideoURL || episode.backupVideoUrl),
        description: episode.Description || episode.description,
      })),
    })),
  }
}

function buildStats(detailContent, totalEpisodeCount) {
  if (!detailContent) {
    return []
  }

  return [
    { label: 'IMDb Puanı', value: detailContent.imdbRating ?? '—' },
    { label: 'Dizipal Sıralaması', value: detailContent.rank ?? 'Öne çıkan +' },
    { label: 'Toplam Bölüm', value: totalEpisodeCount ? `${totalEpisodeCount}` : '—' },
    {
      label: 'Türler',
      value: detailContent.tags?.length ? detailContent.tags.join(', ') : 'Bilinmiyor',
    },
    { label: 'Yapım Yılı', value: detailContent.releaseYear ?? 'Bilinmiyor' },
    { label: 'İzlenme Statüsü', value: detailContent.status ?? 'Devam Ediyor' },
    { label: 'Güncelleme Tarihi', value: new Date().toLocaleDateString('tr-TR') },
  ]
}

function SeriesDetailPage() {
  const { seriesId } = useParams()
  const location = useLocation()
  const navigationFallback = location.state?.fallback ?? null
  const navigationSlug = location.state?.slug ?? null

  const [detailContent, setDetailContent] = useState(null)
  const [detailLoading, setDetailLoading] = useState(true)
  const [detailError, setDetailError] = useState(null)

  const [activeSeason, setActiveSeason] = useState(null)
  const [activeEpisode, setActiveEpisode] = useState(null)
  const [copyFeedback, setCopyFeedback] = useState(false)

  const resolveSeriesId = async () => {
    if (Number.isInteger(Number(seriesId))) {
      return Number(seriesId)
    }

    if (navigationFallback?.ID) {
      return navigationFallback.ID
    }

    try {
      const data = await fetchSeriesList({ limit: 100, offset: 0 })
      const match = (data.series ?? []).find(
        (item) => item.Slug === seriesId || String(item.ID) === seriesId,
      )
      if (match) {
        return match.ID
      }
    } catch (error) {
      console.error('Seri kimliği çözülürken hata oluştu', error)
    }

    return null
  }

  useEffect(() => {
    let ignore = false

    async function loadDetail() {
      setDetailLoading(true)
      setDetailError(null)

      let resolvedDetail = null
      let numericId = await resolveSeriesId()

      if (!numericId) {
        numericId = null
      }

      if (numericId) {
        try {
          const apiDetail = await fetchSeriesDetail(numericId)
          if (apiDetail?.series) {
            resolvedDetail = mapSeriesDetail(apiDetail.series)
          }
        } catch (error) {
          const status = error?.response?.status
          if (status && status !== 404) {
            console.error('Gerçek seri detayı yüklenirken hata oluştu', error)
          }
        }
      }

      if (!resolvedDetail) {
        try {
          const mockDetail = await fetchDetail(seriesId)
          resolvedDetail = mockDetail
        } catch (error) {
          const status = error?.response?.status
          if (status && status !== 404) {
            console.error('Mock detay yüklenirken hata oluştu', error)
          }
        }
      }

      if (!resolvedDetail && navigationFallback) {
        resolvedDetail =
          mapSeriesDetail(navigationFallback) ||
          mapFallbackDetail({ ...navigationFallback, Slug: navigationSlug || seriesId })
      }

      if (!resolvedDetail) {
        resolvedDetail = mapFallbackDetail({ ...navigationFallback, Slug: navigationSlug || seriesId })
      }

      if (!ignore) {
        if (resolvedDetail) {
          setDetailContent(resolvedDetail)
          setDetailError(null)
        } else {
          setDetailContent(null)
          setDetailError('İçerik detayları yüklenemedi. Lütfen daha sonra tekrar deneyin.')
        }
        setDetailLoading(false)
      }
    }

    loadDetail()

    return () => {
      ignore = true
    }
  }, [seriesId, navigationFallback])

  useEffect(() => {
    if (!detailContent?.seasons?.length) {
      setActiveSeason(null)
      setActiveEpisode(null)
      return
    }

    const firstSeasonWithEpisodes = detailContent.seasons.find((season) => season.episodes.length)
    const firstSeason = firstSeasonWithEpisodes ?? detailContent.seasons[0]

    setActiveSeason(firstSeason.number)
    setActiveEpisode(firstSeason.episodes[0] ?? null)
  }, [detailContent])

  const episodes = useMemo(() => {
    if (!detailContent?.seasons?.length || !activeSeason) {
      return []
    }
    const season = detailContent.seasons.find((item) => item.number === activeSeason)
    return season?.episodes ?? []
  }, [detailContent, activeSeason])

  const totalEpisodeCount = detailContent?.seasons?.reduce(
    (sum, season) => sum + (season.episodes?.length ?? 0),
    0,
  )
  const stats = buildStats(detailContent, totalEpisodeCount)

  const handleWatchFirst = () => {
    if (!detailContent?.seasons?.length) {
      return
    }
    const firstSeasonWithEpisodes = detailContent.seasons.find((season) => season.episodes.length)
    const firstSeason = firstSeasonWithEpisodes ?? detailContent.seasons[0]
    setActiveSeason(firstSeason.number)
    setActiveEpisode(firstSeason.episodes[0] ?? null)
    document.getElementById('episodes-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleCopyLink = async () => {
    if (!activeEpisode?.videoUrl) {
      return
    }
    try {
      await navigator.clipboard?.writeText(activeEpisode.videoUrl)
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 2000)
    } catch (error) {
      console.error('Bağlantı kopyalanamadı', error)
    }
  }

  if (detailLoading) {
    return (
      <section className="series-body series-body--loading">
        <div className="container">
          <div className="loading-state">Detay yükleniyor...</div>
        </div>
      </section>
    )
  }

  if (detailError && !detailContent) {
    return (
      <section className="series-body">
        <div className="container">
          <div className="error-state">{detailError}</div>
        </div>
      </section>
    )
  }

  if (!detailContent) {
    return null
  }

  const primaryVideo = activeEpisode?.videoUrl
  const fallbackVideo = activeEpisode?.backupVideoUrl

  const backgroundStyle = detailContent.cover
    ? { backgroundImage: `linear-gradient(180deg, rgba(3,9,12,0.92), rgba(3,9,12,0.82)), url(${detailContent.cover})` }
    : { backgroundColor: '#03090c' }

  return (
    <section className="series-stack" style={backgroundStyle}>
      <div className="series-stack__overlay">
        <div className="container series-stack__inner">
          <div className="series-video-wrapper">
            <VideoPlayer
              src={primaryVideo ?? fallbackVideo}
              poster={detailContent.cover}
              title={activeEpisode ? `${detailContent.title} - ${activeEpisode.title}` : detailContent.title}
              fallback={fallbackVideo && primaryVideo !== fallbackVideo ? fallbackVideo : null}
            />
          </div>

          <div className="series-primary-info">
            <div className="series-primary-info__top">
              <div>
                <h1>{detailContent.title}</h1>
                <p>{detailContent.description}</p>
              </div>
              <div className="series-primary-info__buttons">
                <button className="button-primary" type="button" onClick={handleWatchFirst}>
                  İlk bölümü izle
                </button>
                <button className="button-secondary" type="button">
                  Takip et
                </button>
                <button className="button-secondary" type="button" aria-label="Favorilere ekle">
                  ✓
                </button>
              </div>
            </div>

            <div className="series-tags">
              {detailContent.tags?.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
              {detailContent.seasons?.length ? (
                <span>{detailContent.seasons.length} sezon</span>
              ) : null}
            </div>

            {stats.length ? (
              <ul className="series-stats-list">
                {stats.map((item) => (
                  <li key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="series-card" id="episodes-section">
            <div className="series-card__header">
              <h3>Sezonlar</h3>
              <span>
                {detailContent.seasons?.length
                  ? `${detailContent.seasons.length} sezon`
                  : 'Bilgi yok'}
              </span>
            </div>
            <SeasonTabs
              seasons={detailContent.seasons}
              activeSeason={activeSeason}
              onChange={(seasonNumber) => {
                setActiveSeason(seasonNumber)
                const seasonData = detailContent.seasons.find((item) => item.number === seasonNumber)
                setActiveEpisode(seasonData?.episodes?.[0] ?? null)
              }}
            />
            <EpisodeGrid
              episodes={episodes}
              activeEpisode={activeEpisode}
              onSelect={(episode) => setActiveEpisode(episode)}
              cover={detailContent.cover}
            />
          </div>

          {activeEpisode ? (
            <div className="series-episode-card">
              <h4>{activeEpisode.episode ?? activeEpisode.title}</h4>
              <p>{activeEpisode.description}</p>
              <div className="episode-meta-row">
                <span>{activeEpisode.duration}</span>
                <span>{activeEpisode.releasedAt}</span>
              </div>
              {copyFeedback && <span className="copy-feedback">Bağlantı kopyalandı!</span>}
            </div>
          ) : (
            <div className="series-episode-card">
              <div className="loading-state">Bir bölüm seçin</div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default SeriesDetailPage
