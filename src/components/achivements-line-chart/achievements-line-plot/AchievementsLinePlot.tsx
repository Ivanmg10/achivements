'use client'

import { useId, type ReactElement } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

/**
 * The one chart of unlocks over time: a line in the theme's accent with a soft
 * fill fading down from it, and a dot on each point that has any. The home's
 * week and a game's weeks or months both draw this, each with its own axis
 * names and tooltip. Apart from its cards so that recharts (the heaviest thing
 * on the page) is downloaded after the page is up, not before it. It fills the
 * height of its box.
 */
export default function AchievementsLinePlot({
  data,
  x,
  y,
  tick,
  tooltip,
  onPick,
}: {
  data: object[]
  /** The field of a point that names it on the axis, and what `onPick` gets. */
  x: string
  /** The field of a point that holds its count. */
  y: string
  tick: (name: string) => string
  tooltip: ReactElement
  /** A point was clicked. */
  onPick: (name: string) => void
}) {
  const reduce = useReducedMotion()
  const fillId = `unlocks-fill-${useId().replace(/:/g, '')}`
  const empty = data.every((point) => !(point as Record<string, number>)[y])

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
        onClick={/* istanbul ignore next */ (p: { activeLabel?: string | number } | null) => {
          if (typeof p?.activeLabel === 'string') onPick(p.activeLabel)
        }}
        style={{ cursor: 'pointer' }}
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity={0.35} />
            <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 4" stroke="rgb(var(--text-secondary) / 0.15)" />
        <XAxis
          dataKey={x}
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'rgb(var(--text-secondary))', fontSize: 11 }}
          tickFormatter={/* istanbul ignore next */ tick}
        />
        {/* A flat 0 still needs a real 0–1 axis, not an empty band. */}
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tick={{ fill: 'rgb(var(--text-secondary))', fontSize: 11 }}
          allowDecimals={false}
          domain={empty ? [0, 1] : [0, 'auto']}
        />
        <Tooltip cursor={{ stroke: 'rgb(var(--text-secondary) / 0.35)', strokeDasharray: '3 3' }} content={tooltip} />
        <Area
          type="monotone"
          dataKey={y}
          stroke="rgb(var(--accent))"
          strokeWidth={2.5}
          fill={`url(#${fillId})`}
          dot={/* istanbul ignore next */ (p: { cx?: number; cy?: number; payload?: Record<string, number>; index?: number }) =>
            p.payload?.[y] ? (
              <circle key={p.index} cx={p.cx} cy={p.cy} r={4} fill="rgb(var(--accent))" stroke="rgb(var(--bg-card))" strokeWidth={2} />
            ) : (
              <g key={p.index} />
            )
          }
          activeDot={{ r: 6, fill: 'rgb(var(--accent))', stroke: 'rgb(var(--bg-card))', strokeWidth: 2 }}
          isAnimationActive={!reduce}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
