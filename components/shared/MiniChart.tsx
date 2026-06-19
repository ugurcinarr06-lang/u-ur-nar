import React from 'react';
import { DailyAnalytics } from '../../types';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  filled?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data, color = '#3b82f6', height = 40, filled = true
}) => {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 120;
  const h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const pathD = `M ${pts.join(' L ')}`;
  const fillD = `M 0,${h} L ${pts.join(' L ')} L ${w},${h} Z`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {filled && (
        <path d={fillD} fill={`${color}22`} />
      )}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

interface BarChartProps {
  data: DailyAnalytics[];
  metric: keyof DailyAnalytics;
  color?: string;
  height?: number;
  showLabels?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
  data, metric, color = '#3b82f6', height = 160, showLabels = false
}) => {
  const values = data.map(d => d[metric] as number);
  const max = Math.max(...values) || 1;
  const w = 100;
  const h = height;
  const barW = w / values.length - 1;

  return (
    <svg width="100%" height={h} viewBox={`0 0 100 ${h}`} preserveAspectRatio="none">
      {values.map((v, i) => {
        const barH = (v / max) * (h - 16);
        const x = i * (100 / values.length);
        const y = h - barH - 4;
        return (
          <rect
            key={i}
            x={x + 0.2}
            y={y}
            width={barW - 0.4}
            height={barH}
            rx="0.8"
            fill={`${color}66`}
          />
        );
      })}
    </svg>
  );
};

interface LineChartProps {
  data: DailyAnalytics[];
  lines: { key: keyof DailyAnalytics; color: string; label: string }[];
  height?: number;
}

export const LineChart: React.FC<LineChartProps> = ({ data, lines, height = 180 }) => {
  if (!data.length) return null;
  const w = 600;
  const h = height;
  const padL = 0;
  const padB = 20;
  const chartH = h - padB;
  const chartW = w - padL;

  const allVals = lines.flatMap(l => data.map(d => d[l.key] as number));
  const max = Math.max(...allVals) || 1;

  const getPath = (key: keyof DailyAnalytics) => {
    const pts = data.map((d, i) => {
      const x = padL + (i / (data.length - 1)) * chartW;
      const y = chartH - ((d[key] as number) / max) * (chartH - 10) - 4;
      return `${x},${y}`;
    });
    return `M ${pts.join(' L ')}`;
  };

  const getFill = (key: keyof DailyAnalytics, color: string) => {
    const pts = data.map((d, i) => {
      const x = padL + (i / (data.length - 1)) * chartW;
      const y = chartH - ((d[key] as number) / max) * (chartH - 10) - 4;
      return `${x},${y}`;
    });
    return `M ${padL},${chartH} L ${pts.join(' L ')} L ${padL + chartW},${chartH} Z`;
  };

  const labelIndices = [0, Math.floor(data.length / 4), Math.floor(data.length / 2), Math.floor(data.length * 3 / 4), data.length - 1];

  return (
    <div className="w-full">
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((t, i) => (
          <line
            key={i}
            x1={padL} y1={chartH * (1 - t) + 4}
            x2={padL + chartW} y2={chartH * (1 - t) + 4}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        ))}
        {/* Fills */}
        {lines.slice(0, 1).map(l => (
          <path key={`fill-${l.key as string}`} d={getFill(l.key, l.color)} fill={`${l.color}12`} />
        ))}
        {/* Lines */}
        {lines.map(l => (
          <path
            key={`line-${l.key as string}`}
            d={getPath(l.key)}
            fill="none"
            stroke={l.color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {/* Date labels */}
        {labelIndices.map(i => {
          if (!data[i]) return null;
          const x = padL + (i / (data.length - 1)) * chartW;
          const label = data[i].date.slice(5);
          return (
            <text key={i} x={x} y={h - 2} textAnchor="middle" fontSize="9" fill="#555">
              {label}
            </text>
          );
        })}
      </svg>
      {/* Legend */}
      <div className="flex gap-4 mt-2 flex-wrap">
        {lines.map(l => (
          <div key={l.key as string} className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-full" style={{ background: l.color }} />
            <span className="text-xs" style={{ color: '#666' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface DonutChartProps {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ segments, size = 120 }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const r = 40;
  const cx = 50;
  const cy = 50;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const arcs = segments.map(seg => {
    const pct = seg.value / total;
    const dashArray = `${pct * circumference} ${circumference}`;
    const rotate = `rotate(${offset * 360 - 90} ${cx} ${cy})`;
    offset += pct;
    return { ...seg, dashArray, rotate };
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 100 100">
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth="16"
            strokeDasharray={arc.dashArray}
            transform={arc.rotate}
            strokeLinecap="butt"
          />
        ))}
        <circle cx={cx} cy={cy} r="28" fill="#111" />
      </svg>
      <div className="flex flex-wrap gap-2 mt-2 justify-center">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: seg.color }} />
            <span className="text-xs" style={{ color: '#888' }}>{seg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
