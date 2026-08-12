'use client'

import { Area, AreaChart, ResponsiveContainer } from 'recharts'

const TONES = {
  brand: {
    icon: 'from-brand-500 to-violet-500 shadow-[0_12px_28px_-14px_rgb(99_102_241)]',
    stroke: '#818cf8',
    glow: 'group-hover:border-brand-500/45',
  },
  emerald: {
    icon: 'from-emerald-500 to-teal-400 shadow-[0_12px_28px_-14px_rgb(16_185_129)]',
    stroke: '#34d399',
    glow: 'group-hover:border-emerald-500/45',
  },
  amber: {
    icon: 'from-amber-500 to-orange-400 shadow-[0_12px_28px_-14px_rgb(245_158_11)]',
    stroke: '#fbbf24',
    glow: 'group-hover:border-amber-500/45',
  },
  rose: {
    icon: 'from-rose-500 to-pink-500 shadow-[0_12px_28px_-14px_rgb(244_63_94)]',
    stroke: '#fb7185',
    glow: 'group-hover:border-rose-500/45',
  },
  sky: {
    icon: 'from-sky-500 to-cyan-400 shadow-[0_12px_28px_-14px_rgb(14_165_233)]',
    stroke: '#38bdf8',
    glow: 'group-hover:border-sky-500/45',
  },
}

export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'brand',
  spark,
  delay = 0,
}) {
  const theme = TONES[tone] || TONES.brand
  const gradientId = `spark-${tone}-${label.replace(/\W/g, '')}`

  return (
    <div
      className={`group card card-hover relative overflow-hidden p-5 animate-fade-up ${theme.glow}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-faint">
            {label}
          </p>
          <p className="headline mt-2 text-3xl leading-none text-ink">{value}</p>
          {hint && <p className="mt-2 truncate text-xs text-muted">{hint}</p>}
        </div>
        {Icon && (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${theme.icon}`}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      {spark && spark.length > 1 && (
        <div className="pointer-events-none -mx-5 -mb-5 mt-4 h-14 opacity-70 transition-opacity duration-300 group-hover:opacity-100">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.stroke} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={theme.stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={theme.stroke}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
