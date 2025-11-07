import { useEffect, useState } from 'react'

function VideoPlayer({ src, poster, title, fallback }) {
  const [errored, setErrored] = useState(false)
  const [activeSrc, setActiveSrc] = useState(src || fallback || null)
  const [errorMessage, setErrorMessage] = useState(null)

  useEffect(() => {
    setActiveSrc(src || fallback || null)
    setErrored(false)
    setErrorMessage(null)
  }, [src, fallback])

  useEffect(() => {
    if (errored && fallback && activeSrc !== fallback) {
      setActiveSrc(fallback)
      setErrored(false)
      setErrorMessage(null)
    }
  }, [errored, fallback, activeSrc])

  if (!activeSrc) {
    return <div className="loading-state">Bu bölüm için video kaynağı bulunamadı.</div>
  }

  if (errorMessage) {
    return (
      <div className="error-state">
        {errorMessage}{' '}
        <a href={fallback ?? src} target="_blank" rel="noreferrer">
          Yeni sekmede açmayı dene
        </a>
      </div>
    )
  }

  return (
    <video
      key={activeSrc}
      controls
      playsInline
      preload="metadata"
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
      poster={poster || undefined}
      onError={() => {
        if (fallback && activeSrc !== fallback) {
          setErrored(true)
        } else {
          setErrorMessage('Video yüklenemedi.')
        }
      }}
      title={title}
    >
      <source src={activeSrc} type="video/mp4" />
      Tarayıcın bu video playerı desteklemiyor.
    </video>
  )
}

export default VideoPlayer


