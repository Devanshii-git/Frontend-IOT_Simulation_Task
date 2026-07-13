import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

interface TelemetryChartProps {
  chartData: any[];
  selectedDevices: string[];
  colors: { stroke: string; fill: string }[];
}

export default function TelemetryChart({ chartData, selectedDevices, colors }: TelemetryChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <defs>
          {selectedDevices.map((id, i) => (
            <linearGradient key={id} id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors[i].stroke} stopOpacity={0.15}/>
              <stop offset="95%" stopColor={colors[i].stroke} stopOpacity={0.01}/>
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis
          dataKey="timestamp"
          tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontWeight: 'bold' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontWeight: 'bold' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            color: 'var(--color-text-primary)',
            fontSize: '11px',
            fontFamily: 'monospace',
          }}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', marginTop: '10px' }} />
        {selectedDevices.map((id, i) => (
          <Area
            key={id}
            type="monotone"
            dataKey={id}
            name={id}
            stroke={colors[i].stroke}
            fill={`url(#grad-${id})`}
            strokeWidth={2}
            activeDot={{ r: 4 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
