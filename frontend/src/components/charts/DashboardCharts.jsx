import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTheme } from '../../context/ThemeContext'

const getCssVar = (name) =>
  typeof window === 'undefined'
    ? ''
    : getComputedStyle(document.documentElement).getPropertyValue(name).trim()

const getPalette = () => ({
  muted: getCssVar('--text-muted'),
  success: getCssVar('--success'),
  warning: getCssVar('--warning'),
  danger: getCssVar('--danger'),
  border: getCssVar('--border'),
  accentSoft: getCssVar('--accent-soft'),
})

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null

  const item = payload[0]

  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-name">{item.name ?? label}</span>
      <span className="chart-tooltip-value">{item.value}</span>
    </div>
  )
}

export function TaskStatusDonut({ data }) {
  const { theme } = useTheme()
  const palette = useMemo(() => getPalette(theme), [theme])

  const colors = {
    'To-Do': palette.muted,
    'In Progress': palette.warning,
    Done: palette.success,
  }

  const total = data.reduce((sum, entry) => sum + (entry.value || 0), 0)

  if (total === 0) {
    return <div className="chart-empty">No tasks yet</div>
  }

  return (
    <>
      <div className="chart-body chart-body-donut">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="90%"
              paddingAngle={3}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={colors[entry.name]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="chart-donut-center">
          <span className="chart-donut-center-value">{total}</span>
          <span className="chart-donut-center-label">tasks</span>
        </div>
      </div>

      <div className="chart-legend">
        {data.map((entry) => (
          <div className="chart-legend-item" key={entry.name}>
            <span
              className="chart-legend-dot"
              style={{ background: colors[entry.name] }}
            />
            <span className="chart-legend-label">{entry.name}</span>
            <span className="chart-legend-value">{entry.value}</span>
          </div>
        ))}
      </div>
    </>
  )
}

export function TaskPriorityBar({ data }) {
  const { theme } = useTheme()
  const palette = useMemo(() => getPalette(theme), [theme])

  const colors = {
    Low: palette.success,
    Medium: palette.warning,
    High: palette.danger,
  }

  const total = data.reduce((sum, entry) => sum + (entry.value || 0), 0)
  const maxValue = data.reduce((max, entry) => Math.max(max, entry.value || 0), 0)

  if (total === 0) {
    return <div className="chart-empty">No tasks yet</div>
  }

  return (
    <div className="chart-body">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke={palette.border}
          />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fill: palette.muted, fontSize: 12 }}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, maxValue > 0 ? maxValue : 'auto']}
            tickLine={false}
            axisLine={false}
            width={40}
            tick={{ fill: palette.muted, fontSize: 12 }}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: palette.accentSoft }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={42}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={colors[entry.name]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}