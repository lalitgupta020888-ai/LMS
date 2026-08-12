import Link from 'next/link'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center animate-fade-up">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/15 to-violet-500/15 ring-1 ring-inset ring-brand-500/25">
        <Compass className="h-7 w-7 text-brand-400" />
      </div>
      <p className="headline gradient-text text-6xl">404</p>
      <h1 className="headline mt-3 text-xl text-ink">This shelf is empty</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        The page you were looking for is not catalogued here.
      </p>
      <Link href="/" className="btn-primary mt-6">
        Back to the dashboard
      </Link>
    </div>
  )
}
