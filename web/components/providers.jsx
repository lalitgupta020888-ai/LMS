'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { CheckCircle2, AlertTriangle, Info, X, XCircle } from 'lucide-react'

/* ------------------------------------------------------------------ theme */

const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} })

export function useTheme() {
  return useContext(ThemeContext)
}

function ThemeProvider({ children }) {
  // Start with the value the inline script in layout already applied, so the
  // first client render matches the DOM instead of flipping the class.
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark'
      document.documentElement.classList.toggle('dark', next === 'dark')
      try {
        localStorage.setItem('lms-theme', next)
      } catch {
        /* private mode — the theme just won't persist */
      }
      return next
    })
  }, [])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/* ------------------------------------------------------------------ toasts */

const ToastContext = createContext({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext).toast
}

const TOAST_STYLES = {
  success: {
    icon: CheckCircle2,
    accent: 'text-emerald-400',
    bar: 'from-emerald-400 to-teal-400',
  },
  error: { icon: XCircle, accent: 'text-rose-400', bar: 'from-rose-500 to-pink-500' },
  warning: {
    icon: AlertTriangle,
    accent: 'text-amber-400',
    bar: 'from-amber-400 to-orange-400',
  },
  info: { icon: Info, accent: 'text-sky-400', bar: 'from-sky-400 to-indigo-400' },
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())
  const nextId = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((item) => item.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const toast = useCallback(
    (message, type = 'success', title) => {
      const id = nextId.current++
      setToasts((current) => [...current, { id, message, type, title }])
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), type === 'error' ? 6000 : 4000)
      )
      return id
    },
    [dismiss]
  )

  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach(clearTimeout)
      pending.clear()
    }
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-[min(22rem,calc(100vw-3rem))] flex-col gap-3"
      >
        {toasts.map((item) => {
          const style = TOAST_STYLES[item.type] || TOAST_STYLES.info
          const Icon = style.icon
          return (
            <div
              key={item.id}
              className="pointer-events-auto animate-slide-in-right overflow-hidden rounded-2xl shadow-lift card"
            >
              <div className={`h-0.5 w-full bg-gradient-to-r ${style.bar}`} />
              <div className="flex items-start gap-3 p-4">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.accent}`} />
                <div className="min-w-0 flex-1">
                  {item.title && (
                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                  )}
                  <p className="text-sm leading-snug text-muted">{item.message}</p>
                </div>
                <button
                  onClick={() => dismiss(item.id)}
                  aria-label="Dismiss notification"
                  className="rounded-lg p-1 text-faint transition-colors hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function Providers({ children }) {
  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  )
}
