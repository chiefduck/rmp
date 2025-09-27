import React, { useState, useEffect } from 'react';
// The 'Tooltip' here is the one from the Recharts library for the chart itself
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Target, Clock, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// FIXED: Renamed this component to avoid conflict with the Recharts Tooltip
const StatCardTooltip = ({ children, text }: { children: React.ReactNode; text: string }) => {
  return (
    <div className="relative group">
      {children}
      <div 
        className="absolute bottom-full mb-2 w-max max-w-xs px-3 py-2 text-xs font-medium text-white bg-black/70 border border-white/20 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none backdrop-blur-sm z-10"
        style={{ left: '50%', transform: 'translateX(-50%)' }}
      >
        {text}
      </div>
    </div>
  );
};

interface RateData {
  date: string;
  conventional?: number;
  va?: number;
  fha?: number;
  jumbo?: number;
  '15yr_conventional'?: number;
}

interface HistoricalRateChartProps {
  className?: string;
  height?: number;
  timeRange?: '30' | '90' | '365' | 'all';
  variant?: 'full' | 'compact' | 'mini';
  title?: string;
}

const LOAN_TYPE_CONFIG = {
  conventional: {
    color: '#8B5CF6',
    gradient: 'from-purple-500 to-purple-600',
    name: '30yr Conventional',
    enabled: true,
    icon: '🏠'
  },
  va: {
    color: '#10B981', 
    gradient: 'from-emerald-500 to-emerald-600',
    name: '30yr VA',
    enabled: true,
    icon: '🎖️'
  },
  fha: {
    color: '#3B82F6',
    gradient: 'from-blue-500 to-blue-600',
    name: '30yr FHA', 
    enabled: true,
    icon: '🏛️'
  },
  jumbo: {
    color: '#F59E0B',
    gradient: 'from-amber-500 to-amber-600',
    name: '30yr Jumbo',
    enabled: true,
    icon: '💎'
  },
  '15yr_conventional': {
    color: '#6B7280',
    gradient: 'from-gray-500 to-gray-600',
    name: '15yr Conventional',
    enabled: true,
    icon: '⚡'
  }
};

const TIME_RANGES = {
  '30': { label: '30D', days: 30, format: 'short' },
  '90': { label: '90D', days: 90, format: 'medium' },
  '365': { label: '1Y', days: 365, format: 'medium' },
  'all': { label: '5Y', days: 1825, format: 'long' }
};

export default function HistoricalRateChart({ 
  className = '',
  height = 400,
  timeRange = '365',
  variant = 'full',
  title = 'Rate History'
}: HistoricalRateChartProps) {
  const [chartData, setChartData] = useState<RateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>(
    Object.fromEntries(
      Object.entries(LOAN_TYPE_CONFIG).map(([key, config]) => [key, config.enabled])
    )
  );
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [stats, setStats] = useState<{
    totalChange: number;
    volatility: number;
    trending: 'up' | 'down' | 'stable';
  }>({
    totalChange: 0,
    volatility: 0,
    trending: 'stable'
  });

  useEffect(() => {
    fetchHistoricalRates();
  }, [selectedTimeRange]);
  
  const fetchHistoricalRates = async () => {
    setLoading(true);
    
    try {
      const endDate = new Date();
      const startDate = new Date();
      const range = TIME_RANGES[selectedTimeRange];
      startDate.setDate(endDate.getDate() - range.days);

      const { data, error } = await supabase.rpc('get_rates_for_chart', {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        setChartData([]);
        return;
      }
      
      const formattedData = data as RateData[];
      setChartData(formattedData);
      calculateStats(formattedData);

    } catch (error) {
      console.error('Error fetching historical rates:', error);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: RateData[]) => {
    if (data.length < 2) return;
    
    const conventionalRates = data.map(d => d.conventional).filter(rate => typeof rate === 'number') as number[];
    if (conventionalRates.length < 2) return;
    
    const firstRate = conventionalRates[0];
    const lastRate = conventionalRates[conventionalRates.length - 1];
    const totalChange = ((lastRate - firstRate) / firstRate) * 100;
    
    const mean = conventionalRates.reduce((sum, rate) => sum + rate, 0) / conventionalRates.length;
    const variance = conventionalRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / conventionalRates.length;
    const volatility = Math.sqrt(variance);
    
    const trending = Math.abs(totalChange) < 0.1 ? 'stable' : totalChange > 0 ? 'up' : 'down';
    
    setStats({ totalChange, volatility, trending });
  };

  const toggleLine = (loanType: string) => {
    setVisibleLines(prev => ({
      ...prev,
      [loanType]: !prev[loanType]
    }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {new Date(label).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              timeZone: 'UTC'
            })}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-gray-700">
                  {LOAN_TYPE_CONFIG[entry.dataKey as keyof typeof LOAN_TYPE_CONFIG]?.name}
                </span>
              </div>
              <span className="text-sm font-bold text-gray-900">
                {entry.value?.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const latestRateWithData = [...chartData].reverse().find(d => d.conventional != null);

  if (loading) {
    return (
      <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded-xl w-1/4 mb-6"></div>
          <div className="bg-white/10 rounded-2xl" style={{ height: height }}></div>
        </div>
      </div>
    );
  }

  // Compact variant code remains the same...
  if (variant === 'compact') {
    return (
        <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 ${className}`}>
        {/* ... compact variant JSX ... */}
        </div>
    );
  }

  // Full variant
  return (
    <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <p className="text-white/70 text-sm">Professional rate analytics</p>
            </div>
          </div>
          
          <div className="flex space-x-1 bg-white/10 rounded-2xl p-1 backdrop-blur-sm">
            {Object.entries(TIME_RANGES).map(([key, range]) => (
              <button
                key={key}
                onClick={() => setSelectedTimeRange(key as any)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                  selectedTimeRange === key
                    ? 'bg-white text-purple-600 shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        {/* FIXED: Using the renamed StatCardTooltip component */}
        <div className="grid grid-cols-3 gap-4">
          <StatCardTooltip text="The most recent 30-year Conventional mortgage rate from our daily and historical data sources.">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 h-full">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-emerald-300" />
                <span className="text-white/70 text-sm">Current Rate</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {latestRateWithData ? `${latestRateWithData.conventional?.toFixed(2)}%` : '--%'}
              </div>
            </div>
          </StatCardTooltip>
          
          <StatCardTooltip text={`Total percentage change of the 30-year Conventional rate over the selected ${TIME_RANGES[selectedTimeRange].label} period.`}>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 h-full">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className={`w-4 h-4 ${stats.trending === 'up' ? 'text-red-300' : stats.trending === 'down' ? 'text-emerald-300' : 'text-white/70'}`} />
                <span className="text-white/70 text-sm">Period Change</span>
              </div>
              <div className={`text-2xl font-bold ${stats.trending === 'up' ? 'text-red-300' : stats.trending === 'down' ? 'text-emerald-300' : 'text-white'}`}>
                {stats.totalChange > 0 ? '+' : ''}{stats.totalChange.toFixed(2)}%
              </div>
            </div>
          </StatCardTooltip>
          
          <StatCardTooltip text="A statistical measure (standard deviation) of how much the 30-year Conventional rate has fluctuated over the selected period. Higher values mean more drastic rate swings.">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 h-full">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-4 h-4 text-amber-300" />
                <span className="text-white/70 text-sm">Volatility</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {stats.volatility.toFixed(2)}
              </div>
            </div>
          </StatCardTooltip>
        </div>
      </div>

      {/* Legend */}
      <div className="p-6 border-b border-white/10">
        <div className="flex flex-wrap gap-3">
          {Object.entries(LOAN_TYPE_CONFIG).map(([loanType, config]) => (
            <button
              key={loanType}
              onClick={() => toggleLine(loanType)}
              className={`flex items-center space-x-3 px-4 py-2 rounded-2xl transition-all duration-200 ${
                visibleLines[loanType]
                  ? 'bg-white/10 text-white shadow-lg backdrop-blur-sm'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              <span className="text-lg">{config.icon}</span>
              <div
                className={`w-3 h-3 rounded-full transition-opacity`}
                style={{ 
                  backgroundColor: config.color, 
                  opacity: visibleLines[loanType] ? 1 : 0.3 
                }}
              />
              <span className="font-medium">{config.name}</span>
              {visibleLines[loanType] && chartData.length > 0 && (
                <div className="text-sm font-bold">
                  {latestRateWithData?.[loanType as keyof RateData]?.toFixed(2)}%
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <div style={{ height: height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              
              <XAxis 
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return selectedTimeRange === '30' || selectedTimeRange === '90'
                    ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
                    : date.toLocaleDateString('en-US', { year: '2-digit', month: 'short', timeZone: 'UTC' });
                }}
              />
              
              <YAxis 
                domain={['dataMin - 0.1', 'dataMax + 0.1']}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
              />
              
              {/* This is the official Recharts Tooltip, now free from conflict */}
              <Tooltip content={<CustomTooltip />} />

              {Object.entries(LOAN_TYPE_CONFIG).map(([loanType, config]) => 
                visibleLines[loanType] ? (
                  <Line
                    key={loanType}
                    type="monotone"
                    dataKey={loanType}
                    stroke={config.color}
                    strokeWidth={loanType === 'conventional' ? 4 : 3}
                    dot={false}
                    activeDot={{ 
                      r: 6, 
                      fill: config.color,
                      stroke: 'white',
                      strokeWidth: 2
                    }}
                    connectNulls={true}
                  />
                ) : null
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}