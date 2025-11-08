import { useEffect, useMemo, useRef, useState } from 'react'
import { loginUser, registerUser } from '../api/authService'

const heroMap = {
  login: {
    title: 'Fight Club',
    image: 'https://image.tmdb.org/t/p/original/bptfVGEQuv6vDTIMVCHjJ9Dz8PX.jpg',
  },
  register: {
    title: 'V for Vendetta',
    image: 'https://m.media-amazon.com/images/I/41QST6DYNDL._AC_UF894,1000_QL80_.jpg',
  },
}

const initialFormValues = {
  login: {
    email: '',
    password: '',
    remember: false,
  },
  register: {
    username: '',
    password: '',
    email: '',
    gender: '',
  },
}

const cloneInitialValues = (mode) => {
  const template = initialFormValues[mode] ?? initialFormValues.login
  return { ...template }
}

const safeTrim = (value) => (typeof value === 'string' ? value.trim() : '')

function AuthModal({ mode = 'login', onClose, onSwitchMode }) {
  const { title, image } = useMemo(() => heroMap[mode] ?? heroMap.login, [mode])
  const [formValues, setFormValues] = useState(() => cloneInitialValues(mode))
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const successTimeout = useRef()

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    setFormValues(cloneInitialValues(mode))
    setFeedback(null)
  }, [mode])

  useEffect(() => {
    return () => {
      if (successTimeout.current) {
        clearTimeout(successTimeout.current)
      }
    }
  }, [])

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.()
    }
  }

  const toggleMode = (next) => {
    if (next === mode) {
      return
    }
    onSwitchMode?.(next)
  }

  const handleInputChange = (field) => (event) => {
    const { type, checked, value } = event.target
    setFormValues((prev) => ({
      ...prev,
      [field]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) {
      return
    }

    const payload = isLogin
      ? {
          email: safeTrim(formValues.email),
          password: formValues.password,
          remember: Boolean(formValues.remember),
        }
      : {
          email: safeTrim(formValues.email),
          username: safeTrim(formValues.username),
          password: formValues.password,
          gender: safeTrim(formValues.gender),
        }

    if (!payload.gender) {
      delete payload.gender
    }

    setSubmitting(true)
    setFeedback(null)

    try {
      if (isLogin) {
        const data = await loginUser(payload)
        const message = data?.message ?? 'Giriş başarılı. Keyifli seyirler!'
        setFeedback({ type: 'success', message })
        successTimeout.current = setTimeout(() => {
          onClose?.()
        }, 1000)
      } else {
        const data = await registerUser(payload)
        const message = data?.message ?? 'Hesabın başarıyla oluşturuldu.'
        setFeedback({ type: 'success', message })
        successTimeout.current = setTimeout(() => {
          onSwitchMode?.('login')
        }, 1400)
      }
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message ??
        error?.message ??
        (isLogin
          ? 'Giriş işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.'
          : 'Kayıt işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.')
      setFeedback({ type: 'error', message: apiMessage })
    } finally {
      setSubmitting(false)
    }
  }

  const isLogin = mode === 'login'
  const canSubmit = isLogin
    ? safeTrim(formValues.email) && formValues.password
    : safeTrim(formValues.username) && formValues.password && safeTrim(formValues.email)
  const primaryLabel = submitting ? 'Gönderiliyor...' : isLogin ? 'Giriş yap' : 'Kayıt ol'

  return (
    <div className="auth-modal-backdrop" role="dialog" aria-modal="true" onClick={handleBackdropClick}>
      <div className="auth-modal">
        <button className="auth-modal__close" type="button" aria-label="Kapat" onClick={onClose}>
          &times;
        </button>

        <div className="auth-modal__panel auth-modal__panel--form">
          <div className="auth-modal__header">
            <h2>{isLogin ? 'Giriş yap' : 'Hesap oluştur'}</h2>
            <p>{isLogin ? 'Tekrar hoş geldin. Eğlence kaldığı yerden devam etsin.' : 'Bir hesap oluştur ve sınırsız içeriğin tadını çıkar.'}</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isLogin ? (
              <label className="auth-form__field">
                <span>E-posta adresi</span>
                <input
                  type="email"
                  placeholder="ornek@email.com"
                  value={formValues.email}
                  onChange={handleInputChange('email')}
                  required
                  disabled={submitting}
                />
              </label>
            ) : (
              <label className="auth-form__field">
                <span>Kullanıcı adınız</span>
                <input
                  type="text"
                  placeholder="Kullanıcı adınızı girin"
                  value={formValues.username}
                  onChange={handleInputChange('username')}
                  required
                  disabled={submitting}
                />
              </label>
            )}

            <label className="auth-form__field">
              <span>{isLogin ? 'Şifre' : 'Şifreniz'}</span>
              <input
                type="password"
                placeholder="Şifrenizi girin"
                value={formValues.password}
                onChange={handleInputChange('password')}
                required
                disabled={submitting}
              />
            </label>

            {!isLogin && (
              <>
                <label className="auth-form__field">
                  <span>E-posta adresiniz</span>
                  <input
                    type="email"
                    placeholder="ornek@email.com"
                    value={formValues.email}
                    onChange={handleInputChange('email')}
                    required
                    disabled={submitting}
                  />
                </label>

                <label className="auth-form__field">
                  <span>Cinsiyetiniz</span>
                  <select
                    value={formValues.gender}
                    onChange={handleInputChange('gender')}
                    disabled={submitting}
                  >
                    <option value="" disabled>
                      Seçin
                    </option>
                    <option value="female">Kadın</option>
                    <option value="male">Erkek</option>
                    <option value="other">Diğer</option>
                    <option value="prefer_not_say">Belirtmek istemiyorum</option>
                  </select>
                </label>
              </>
            )}

            {isLogin && (
              <label className="auth-form__checkbox">
                <input
                  type="checkbox"
                  checked={formValues.remember}
                  onChange={handleInputChange('remember')}
                  disabled={submitting}
                />
                <span>Beni hatırla</span>
              </label>
            )}

            <button
              type="submit"
              className="auth-form__primary"
              disabled={!canSubmit || submitting}
            >
              {primaryLabel}
            </button>

            {feedback && (
              <div className={`auth-form__feedback auth-form__feedback--${feedback.type}`}>
                {feedback.message}
              </div>
            )}

            {isLogin ? (
              <>
                <div className="auth-form__divider">
                  <span />
                  <p>ya da</p>
                  <span />
                </div>
                <button
                  type="button"
                  className="auth-form__secondary"
                  disabled={submitting}
                  onClick={() => toggleMode('register')}
                >
                  Hesap oluştur
                </button>
              </>
            ) : (
              <p className="auth-form__footer">
                Zaten hesabın var mı?{' '}
                <button type="button" onClick={() => toggleMode('login')} disabled={submitting}>
                  Giriş yap
                </button>
              </p>
            )}
          </form>
        </div>

        <div className="auth-modal__panel auth-modal__panel--visual">
          <div className="auth-hero">
            <img src={image} alt={title} loading="lazy" />
            <div className="auth-hero__overlay" />
            <p>{title}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthModal

