import React, { useState } from 'react';

interface DataPoint {
  date: string;
  value: number;
  secondaryValue?: number;
}

interface AdsChartProps {
  title: string;
  data: DataPoint[];
  metricLabel: string;
  secondaryLabel?: string;
  color?: string;
  secondaryColor?: string;
  formatValue?: (val: number) => string;
  chartType?: 'area' | 'bar';
}

export const AdsChart: React.FC<AdsChartProps> = ({
  title,
  data,
  metricLabel,
  secondaryLabel,
  color = '#4f46e5',
  secondaryColor = '#06b6d4',
  formatValue = val => val.toLocaleString('en-IN'),
  chartType = 'area',
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 mb-2">{title}</h3>
        <div className="h-44 flex items-center justify-center text-slate-400 text-sm">
          No data available for the selected date range.
        </div>
      </div>
    );
  }

  const values = data.map(d => d.value);
  const maxValue = Math.max(...values, 1);
  const height = 180;
  const width = 500;
  const paddingX = 40;
  const paddingY = 25;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(data.length - 1, 1)) * chartWidth;
    const y = height - paddingY - (d.value / maxValue) * chartHeight;
    return { x, y, ...d };
  });

  // SVG path for area/line
  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`
    : '';

  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  const avg = Math.round(total / (data.length || 1));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
          <div className="text-xl font-bold text-slate-900 mt-0.5">
            {formatValue(total)}
            <span className="text-xs font-medium text-slate-400 ml-2">Avg: {formatValue(avg)}/day</span>
          </div>
        </div>
        <span
          className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{ backgroundColor: `${color}15`, color: color }}
        >
          {metricLabel}
        </span>
      </div>

      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-44 overflow-visible"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = height - paddingY - pct * chartHeight;
            const gridVal = Math.round(pct * maxValue);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                  strokeDasharray={pct > 0 && pct < 1 ? '3 3' : undefined}
                />
                <text
                  x={paddingX - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="#94a3b8"
                  className="select-none"
                >
                  {gridVal >= 1000 ? `${(gridVal / 1000).toFixed(1)}k` : gridVal}
                </text>
              </g>
            );
          })}

          {chartType === 'area' ? (
            <>
              {/* Shaded Area */}
              <path d={areaD} fill={`url(#grad-${title.replace(/\s+/g, '')})`} />
              {/* Trend Line */}
              <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          ) : (
            /* Bar Chart alternative */
            points.map((pt, i) => {
              const barWidth = Math.max(6, Math.min(24, (chartWidth / points.length) * 0.6));
              const barHeight = height - paddingY - pt.y;
              return (
                <rect
                  key={i}
                  x={pt.x - barWidth / 2}
                  y={pt.y}
                  width={barWidth}
                  height={barHeight}
                  fill={hoverIndex === i ? color : `${color}cc`}
                  rx="3"
                  className="transition-colors cursor-pointer"
                  onMouseEnter={() => setHoverIndex(i)}
                />
              );
            })
          )}

          {/* Interactive hover points */}
          {points.map((pt, i) => (
            <g key={i} onMouseEnter={() => setHoverIndex(i)}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoverIndex === i ? 5.5 : 3.5}
                fill="#ffffff"
                stroke={color}
                strokeWidth={hoverIndex === i ? 3 : 2}
                className="cursor-pointer transition-all"
              />
              {/* Invisible larger hit target */}
              <circle cx={pt.x} cy={pt.y} r={14} fill="transparent" className="cursor-pointer" />
            </g>
          ))}

          {/* Date labels on X-axis */}
          {points.length > 0 && (
            <>
              <text x={points[0].x} y={height - 6} textAnchor="start" fontSize="9" fill="#94a3b8">
                {points[0].date.slice(5)}
              </text>
              {points.length > 2 && (
                <text
                  x={points[Math.floor(points.length / 2)].x}
                  y={height - 6}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#94a3b8"
                >
                  {points[Math.floor(points.length / 2)].date.slice(5)}
                </text>
              )}
              <text
                x={points[points.length - 1].x}
                y={height - 6}
                textAnchor="end"
                fontSize="9"
                fill="#94a3b8"
              >
                {points[points.length - 1].date.slice(5)}
              </text>
            </>
          )}
        </svg>

        {/* Clean floating tooltip */}
        {hoverIndex !== null && points[hoverIndex] && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-900 text-white text-xs rounded-lg py-1.5 px-3 shadow-lg transform -translate-x-1/2 -translate-y-full transition-all"
            style={{
              left: `${(points[hoverIndex].x / width) * 100}%`,
              top: `${(points[hoverIndex].y / height) * 100}%`,
              marginTop: '-10px',
            }}
          >
            <div className="text-[10px] text-slate-300 font-medium">{points[hoverIndex].date}</div>
            <div className="font-bold flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
              <span>{metricLabel}: {formatValue(points[hoverIndex].value)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
