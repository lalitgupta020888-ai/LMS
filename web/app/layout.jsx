import { Inter, Sora } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import Shell from '@/components/Shell'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata = {
  title: 'Athenaeum · Library Management System',
  description:
    'Track students, catalogue books, manage circulation and generate reports — all in one place.',
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f7fc' },
    { media: '(prefers-color-scheme: dark)', color: '#070b14' },
  ],
}

// Applied before first paint so the page never flashes the wrong theme.
const THEME_SCRIPT = `
(function(){
  try {
    var stored = localStorage.getItem('lms-theme');
    var dark = stored ? stored === 'dark'
      : !window.matchMedia('(prefers-color-scheme: light)').matches;
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable} dark`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  )
}
