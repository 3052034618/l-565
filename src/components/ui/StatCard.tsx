import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: 'cyan' | 'green' | 'orange' | 'red' | 'purple';
  onClick?: () => void;
}

const colorConfig = {
  cyan: {
    iconBg: 'bg-cyber-500/20',
    iconColor: 'text-cyber-400',
    valueColor: 'text-cyber-300',
    border: 'border-cyber-500/20 hover:border-cyber-500/40',
  },
  green: {
    iconBg: 'bg-signal-green/20',
    iconColor: 'text-signal-green',
    valueColor: 'text-signal-green',
    border: 'border-signal-green/20 hover:border-signal-green/40',
  },
  orange: {
    iconBg: 'bg-signal-orange/20',
    iconColor: 'text-signal-orange',
    valueColor: 'text-signal-orange',
    border: 'border-signal-orange/20 hover:border-signal-orange/40',
  },
  red: {
    iconBg: 'bg-signal-red/20',
    iconColor: 'text-signal-red',
    valueColor: 'text-signal-red',
    border: 'border-signal-red/20 hover:border-signal-red/40',
  },
  purple: {
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    valueColor: 'text-purple-300',
    border: 'border-purple-500/20 hover:border-purple-500/40',
  },
};

export function StatCard({
  title,
  value,
  unit,
  icon,
  trend,
  trendLabel,
  color = 'cyan',
  onClick,
}: StatCardProps) {
  const config = colorConfig[color];

  return (
    <div
      className={`glass-card-hover p-5 cursor-pointer border ${config.border}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-space-400 mb-1">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold font-display ${config.valueColor}`}>
              {value}
            </span>
            {unit && <span className="text-sm text-space-500">{unit}</span>}
          </div>
        </div>
        <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center ${config.iconColor}`}>
          {icon}
        </div>
      </div>

      {trend !== undefined && (
        <div className="mt-4 flex items-center gap-2">
          {trend > 0 ? (
            <TrendingUp className="w-4 h-4 text-signal-green" />
          ) : trend < 0 ? (
            <TrendingDown className="w-4 h-4 text-signal-red" />
          ) : (
            <Minus className="w-4 h-4 text-space-400" />
          )}
          <span
            className={`text-sm font-medium ${
              trend > 0 ? 'text-signal-green' : trend < 0 ? 'text-signal-red' : 'text-space-400'
            }`}
          >
            {trend > 0 ? '+' : ''}
            {trend}%
          </span>
          {trendLabel && <span className="text-xs text-space-500">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: 'cyan' | 'green' | 'orange' | 'red';
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  color = 'cyan',
  size = 'md',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorClasses = {
    cyan: 'bg-cyber-400',
    green: 'bg-signal-green',
    orange: 'bg-signal-orange',
    red: 'bg-signal-red',
  };

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-space-400">{label}</span>}
          {showValue && <span className="text-xs font-mono text-space-300">{value}%</span>}
        </div>
      )}
      <div className={`w-full bg-space-800/50 rounded-full ${heightClasses[size]} overflow-hidden`}>
        <div
          className={`h-full ${colorClasses[color]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
