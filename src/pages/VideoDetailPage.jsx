import { useEffect, useMemo, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { fetchVideoDetail } from '../api/mediaService'
import VideoPlayer from '../components/VideoPlayer'

const formatFileSize = (size) => {
  if (!size || Number.isNaN(Number(size))) {
    return '—'
  }
  const bytes = Number(size)
  if (bytes < 1024) {
    return `${bytes} B`
  }
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`
}

function VideoDetailPage() {
  const { videoId } = useParams()
  const location = useLocation()
  const fallbackVideo = location.state?.fallback ?? null

  const [detailContent, setDetailContent] = useState(null)
  const [detailLoading, setDetailLoading] = useState(true)
  const [detailError, setDetailError] = useState(null)

  useEffect(() => {
    let ignore = false

    async function loadVideo() {
      try {
        setDetailLoading(true)
        setDetailError(null)

        const data = await fetchVideoDetail(videoId)
        const video = data?.video

        if (!ignore) {
          if (video) {
            setDetailContent(video)
          } else if (fallbackVideo) {
            setDetailContent(fallbackVideo)
          } else {
            setDetailContent(null)
            setDetailError('Video detayları yüklenemedi.')
          }
        }
      } catch (error) {
        console.error('Video detayı yüklenirken hata oluştu', error)
        if (!ignore) {
          if (fallbackVideo) {
            setDetailContent(fallbackVideo)
            setDetailError(null)
          } else {
            setDetailContent(null)
            setDetailError('Video detayları yüklenemedi.')
          }
        }
      } finally {
        if (!ignore) {
          setDetailLoading(false)
        }
      }
    }

    loadVideo()

    return () => {
      ignore = true
    }
  }, [videoId, fallbackVideo])

  const stats = useMemo(() => {
    if (!detailContent) {
      return []
    }
    const metadata = detailContent.metadata ?? {}
    return [
      { label: 'Görüntülenme', value: detailContent.views ?? '0' },
      { label: 'Beğeni', value: detailContent.like_count ?? '0' },
      { label: 'Süre', value: metadata.duration ? `${metadata.duration} dk` : 'Bilgi yok' },
      { label: 'Çözünürlük', value: metadata.resolution ?? 'Bilinmiyor' },
      { label: 'Dosya Boyutu', value: formatFileSize(detailContent.file_size ?? metadata.size) },
      { label: 'Format', value: metadata.format ?? 'mp4' },
      { label: 'Dil', value: metadata.language ?? 'Bilinmiyor' },
      { label: 'Yüklenme Tarihi', value: detailContent.created_at ?? 'Bilinmiyor' },
    ]
  }, [detailContent])

  if (detailLoading) {
    return (
      <section className="series-body series-body--loading">
        <div className="container">
          <div className="loading-state">Video yükleniyor...</div>
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

  const backgroundStyle = detailContent.thumbnail_url
    ? { backgroundImage: `linear-gradient(180deg, rgba(3,9,12,0.92), rgba(3,9,12,0.82)), url(${detailContent.thumbnail_url})` }
    : { backgroundColor: '#03090c' }

  const categories = detailContent.categories ?? []

  return (
    <section className="series-stack" style={backgroundStyle}>
      <div className="series-stack__overlay">
        <div className="container series-stack__inner">
          <div className="series-video-wrapper">
            <VideoPlayer
              src={detailContent.r2_url}
              poster={detailContent.thumbnail_url}
              title={detailContent.title}
            />
          </div>

          <div className="series-primary-info">
            <div className="series-primary-info__top">
              <div>
                <h1>{detailContent.title}</h1>
                <p>{detailContent.description}</p>
              </div>
              <div className="series-primary-info__buttons">
                <button className="button-primary" type="button">
                  Filmi oynat
                </button>
                <button className="button-secondary" type="button">
                  Takip et
                </button>
                <button className="button-secondary" type="button" aria-label="Favorilere ekle">
                  ✓
                </button>
              </div>
            </div>

            {categories.length ? (
              <div className="series-tags">
                {categories.map((category) => (
                  <span key={category.id ?? category.slug}>{category.name}</span>
                ))}
              </div>
            ) : null}

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
        </div>
      </div>
    </section>
  )
}

export default VideoDetailPage


