import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  strong?: boolean;
  glow?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick, strong, glow }) => {
  const base = strong ? 'glass-strong' : 'glass';
  const glowClass = glow ? `glow-${glow}` : '';
  return (
    <div
      className={`rounded-2xl ${base} ${glowClass} ${onClick ? 'cursor-pointer hover:scale-[1.01] transition-transform duration-200' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, color = '#3b82f6', size = 'sm' }) => (
  <span
    className={`inline-flex items-center font-semibold rounded-full ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}
    style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
  >
    {children}
  </span>
);

interface StatusDotProps {
  status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'MAINTENANCE' | 'ACTIVE' | 'INACTIVE';
  showLabel?: boolean;
}

const STATUS_CONFIG = {
  ONLINE: { color: '#22c55e', label: 'Online', pulse: true },
  ACTIVE: { color: '#22c55e', label: 'Active', pulse: true },
  BUSY: { color: '#f59e0b', label: 'Busy', pulse: true },
  OFFLINE: { color: '#6b7280', label: 'Offline', pulse: false },
  INACTIVE: { color: '#6b7280', label: 'Inactive', pulse: false },
  MAINTENANCE: { color: '#ef4444', label: 'Maintenance', pulse: false },
};

export const StatusDot: React.FC<StatusDotProps> = ({ status, showLabel }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.OFFLINE;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        {cfg.pulse && (
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ background: cfg.color }}
          />
        )}
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: cfg.color }} />
      </span>
      {showLabel && <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</span>}
    </span>
  );
};

interface MetricCardProps {
  label: string;
  value: string;
  change?: number;
  icon: string;
  color: string;
  subtitle?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, change, icon, color, subtitle }) => (
  <div
    className="glass rounded-2xl p-5 flex flex-col gap-3 hover:scale-[1.02] transition-transform duration-200 cursor-default"
    style={{ borderColor: `${color}22` }}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#888' }}>{label}</p>
        <p className="text-2xl font-bold mt-1" style={{ color: '#f0f0f0' }}>{value}</p>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: '#666' }}>{subtitle}</p>}
      </div>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}33` }}
      >
        {icon}
      </div>
    </div>
    {change !== undefined && (
      <div className="flex items-center gap-1.5">
        <span
          className="text-xs font-semibold flex items-center gap-0.5"
          style={{ color: change >= 0 ? '#22c55e' : '#ef4444' }}
        >
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
        </span>
        <span className="text-xs" style={{ color: '#555' }}>vs last month</span>
      </div>
    )}
  </div>
);

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  label?: string;
  showValue?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value, max = 100, color = '#3b82f6', label, showValue
}) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between mb-1.5">
          {label && <span className="text-xs" style={{ color: '#888' }}>{label}</span>}
          {showValue && <span className="text-xs font-semibold" style={{ color }}>{value}{max !== 100 ? `/${max}` : '%'}</span>}
        </div>
      )}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
      </div>
    </div>
  );
};
