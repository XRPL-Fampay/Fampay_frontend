import React from 'react';
import { Eye, EyeOff, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface BalanceCardProps {
  balance: number;
  currency?: string;
  title?: string;
  subtitle?: string;
  isLoading?: boolean;
  showHideToggle?: boolean;
  showTrend?: boolean;
  trendValue?: number;
  trendPercentage?: number;
  className?: string;
  gradient?: 'green' | 'blue' | 'purple' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  currency = 'XRP',
  title = '잔액',
  subtitle,
  isLoading = false,
  showHideToggle = false,
  showTrend = false,
  trendValue,
  trendPercentage,
  className,
  gradient = 'green',
  size = 'md',
  onClick
}) => {
  const [isHidden, setIsHidden] = React.useState(false);

  const gradientClasses = {
    green: 'bg-gradient-to-r from-green-500 to-emerald-600',
    blue: 'bg-gradient-to-r from-blue-500 to-cyan-600',
    purple: 'bg-gradient-to-r from-purple-500 to-indigo-600',
    orange: 'bg-gradient-to-r from-orange-500 to-red-600'
  };

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const textSizeClasses = {
    sm: {
      title: 'text-xs',
      balance: 'text-xl',
      currency: 'text-sm'
    },
    md: {
      title: 'text-sm',
      balance: 'text-3xl',
      currency: 'text-base'
    },
    lg: {
      title: 'text-base',
      balance: 'text-4xl',
      currency: 'text-lg'
    }
  };

  const formatBalance = (value: number): string => {
    if (isHidden) return '****';
    return new Intl.NumberFormat('ko-KR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(value);
  };

  const formatTrendPercentage = (percentage: number): string => {
    return `${percentage > 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className={cn(
        'rounded-xl text-white',
        gradientClasses[gradient],
        sizeClasses[size],
        'animate-pulse',
        className
      )}>
        <div className="space-y-3">
          <div className="h-4 bg-white/20 rounded w-1/3"></div>
          <div className="h-8 bg-white/20 rounded w-2/3"></div>
          {subtitle && <div className="h-3 bg-white/20 rounded w-1/2"></div>}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'rounded-xl text-white cursor-pointer transition-all duration-200 hover:scale-[1.02]',
        gradientClasses[gradient],
        sizeClasses[size],
        className
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className={cn('opacity-80', textSizeClasses[size].title)}>
          {title}
        </p>
        {showHideToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsHidden(!isHidden);
            }}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            {isHidden ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Balance */}
      <div className="flex items-baseline space-x-2">
        <span className={cn('font-bold', textSizeClasses[size].balance)}>
          {formatBalance(balance)}
        </span>
        <span className={cn('opacity-80', textSizeClasses[size].currency)}>
          {currency}
        </span>
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className={cn('opacity-70 mt-1', textSizeClasses[size].title)}>
          {subtitle}
        </p>
      )}

      {/* Trend */}
      {showTrend && trendValue !== undefined && (
        <div className="flex items-center mt-3 space-x-2">
          {trendValue > 0 ? (
            <TrendingUp className="w-4 h-4 text-green-200" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-200" />
          )}
          <span className="text-sm opacity-80">
            {trendValue > 0 ? '+' : ''}{formatBalance(Math.abs(trendValue))} {currency}
          </span>
          {trendPercentage !== undefined && (
            <span className={cn(
              'text-xs px-2 py-1 rounded-full',
              trendValue > 0 
                ? 'bg-green-500/20 text-green-200' 
                : 'bg-red-500/20 text-red-200'
            )}>
              {formatTrendPercentage(trendPercentage)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

interface CompactBalanceCardProps {
  balance: number;
  currency?: string;
  label: string;
  isLoading?: boolean;
  className?: string;
}

export const CompactBalanceCard: React.FC<CompactBalanceCardProps> = ({
  balance,
  currency = 'XRP',
  label,
  isLoading = false,
  className
}) => {
  const formatBalance = (value: number): string => {
    return new Intl.NumberFormat('ko-KR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className={cn('bg-gray-100 p-4 rounded-lg animate-pulse', className)}>
        <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
        <div className="h-5 bg-gray-300 rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <div className={cn('bg-gray-100 p-4 rounded-lg', className)}>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <div className="flex items-baseline space-x-1">
        <span className="text-xl font-bold text-gray-900">
          {formatBalance(balance)}
        </span>
        <span className="text-sm text-gray-500">
          {currency}
        </span>
      </div>
    </div>
  );
};

export default BalanceCard;