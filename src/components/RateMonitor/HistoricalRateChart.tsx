import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Target, Activity, Sparkles } from 'lucide-react';
import { RateService } from '../../lib/rateService';

// Simplified tooltip for mobile (no hover-based tooltips)
const InfoBadge = ({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) => (
  <div className="bg-white/5 rounded-xl p-3 md:p-4 border border-white/10">
    <div className="flex items-center gap-2 mb-1">
      <Icon className={`w-3 h-3 md:w-4 md:h-4 ${color}`} />
      <span className="text-white/70 text-xs md:text-sm">{label}</span>
    </div>
    <div className="text-lg md:text-2xl font-bold text-white">{value}</div>
  </div>
);

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
  conventional: { color: '#8B5CF6', name: '30yr Conv', icon: '🏠', enabled: true },
  va: { color: '#10B981', name: '30yr VA', icon: '🎖️', enabled: true },
  fha: { color: '#3B82F6', name: '30yr FHA', icon: '🏛️', enabled: true },
  jumbo: { color: '#F59E0B', name: '30yr Jumbo', icon: '💎', enabled: true },
  '15yr_conventional': { color: '#6B7280', name: '15yr Conv', icon: '⚡', enabled: true }
};

const TIME_RANGES = {
  '30': { label: '30D', days: 30 },
  '90': { label: '90D', days: 90 },
  '365': { label: '1Y', days: 365 },
  'all': { label: '5Y', days: 1825 }
};

export default function HistoricalRateChart({ 
  className = '',
  height,
  timeRange = '365',
  variant = 'full',
  title = 'Rate History'
}: HistoricalRateChartProps) {
  const [chartData, setChartData] = useState<RateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>(
    Object.fromEntries(Object.entries(LOAN_TYPE_CONFIG).map(([key, config]) => [key, config.enabled]))
  );
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [stats, setStats] = useState({ totalChange: 0, volatility: 0, trending: 'stable' as 'up' | 'down' | 'stable' });

  // Responsive height: 300px mobile, 400px desktop (or custom)
  const chartHeight = height || 300;

  useEffect(() => {
    fetchHistoricalRates();
  }, [selectedTimeRange]);
  
  const fetchHistoricalRates = async () => {
    setLoading(true);
    try {
      const range = TIME_RANGES[selectedTimeRange];
      const [conventionalHistory, fhaHistory, vaHistory, jumboHistory, fifteenYearHistory] = await Promise.all([
        RateService.getRateHistory(30, 'conventional', range.days),
        RateService.getRateHistory(30, 'fha', range.days),
        RateService.getRateHistory(30, 'va', range.days),
        RateService.getRateHistory(30, 'jumbo', range.days),
        RateService.getRateHistory(15, 'conventional', range.days)
      ]);
  
      const dateMap = new Map<string, any>();
      const addRateData = (history: any[], loanType: string) => {
        history.forEach(item => {
          const dateKey = item.date;
          if (!dateMap.has(dateKey)) dateMap.set(dateKey, { date: dateKey });
          dateMap.get(dateKey)[loanType] = item.rate;
        });
      };
  
      addRateData(conventionalHistory, 'conventional');
      addRateData(fhaHistory, 'fha');
      addRateData(vaHistory, 'va');
      addRateData(jumboHistory, 'jumbo');
      addRateData(fifteenYearHistory, '15yr_conventional');
  
      const data = Array.from(dateMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setChartData(data);
      calculateStats(data);
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl p-3 md:p-4 shadow-2xl">
          <p className="text-xs md:text-sm font-medium text-gray-900 mb-2">
            {new Date(label).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-xs md:text-sm text-gray-700">
                  {LOAN_TYPE_CONFIG[entry.dataKey as keyof typeof LOAN_TYPE_CONFIG]?.name}
                </span>
              </div>
              <span className="text-xs md:text-sm font-bold text-gray-900">{entry.value?.toFixed(2)}%</span>
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
      <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-5 md:h-6 bg-white/20 rounded-xl w-1/2 md:w-1/4 mb-4 md:mb-6"></div>
          <div className="bg-white/10 rounded-xl md:rounded-2xl" style={{ height: chartHeight }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl md:rounded-3xl overflow-hidden ${className}`}>
      {/* Header - Stacked on mobile, side-by-side on desktop */}
      <div className="p-4 md:p-6 border-b border-white/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white">{title}</h3>
              <p className="text-white/70 text-xs md:text-sm">Professional rate analytics</p>
            </div>
          </div>
          
          {/* Time Range Selector - Full width on mobile */}
          <div className="flex gap-1 bg-white/10 rounded-xl md:rounded-2xl p-1 backdrop-blur-sm">
            {Object.entries(TIME_RANGES).map(([key, range]) => (
              <button
                key={key}
                onClick={() => setSelectedTimeRange(key as any)}
                className={`flex-1 md:flex-none md:px-4 py-2 text-xs md:text-sm font-medium rounded-lg md:rounded-xl transition-all duration-200 min-h-[44px] ${
                  selectedTimeRange === key
                    ? 'bg-white text-purple-600 shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10 active:scale-95'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Row - 1 column on mobile, 3 on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <InfoBadge
            icon={Target}
            color="text-emerald-300"
            label="Current Rate"
            value={latestRateWithData ? `${latestRateWithData.conventional?.toFixed(2)}%` : '--%'}
          />
          <InfoBadge
            icon={TrendingUp}
            color={stats.trending === 'up' ? 'text-red-300' : stats.trending === 'down' ? 'text-emerald-300' : 'text-white/70'}
            label="Period Change"
            value={`${stats.totalChange > 0 ? '+' : ''}${stats.totalChange.toFixed(2)}%`}
          />
          <InfoBadge
            icon={Activity}
            color="text-amber-300"
            label="Volatility"
            value={stats.volatility.toFixed(2)}
          />
        </div>
      </div>

      {/* Legend - Simplified on mobile (hide current rates) */}
      <div className="p-4 md:p-6 border-b border-white/10">
        <div className="flex flex-wrap gap-2 md:gap-3">
          {Object.entries(LOAN_TYPE_CONFIG).map(([loanType, config]) => (
            <button
              key={loanType}
              onClick={() => setVisibleLines(prev => ({ ...prev, [loanType]: !prev[loanType] }))}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 min-h-[44px] ${
                visibleLines[loanType]
                  ? 'bg-white/10 text-white shadow-lg backdrop-blur-sm'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 active:scale-95'
              }`}
            >
              <span className="text-base md:text-lg">{config.icon}</span>
              <div className="w-2 h-2 md:w-3 md:h-3 rounded-full" style={{ backgroundColor: config.color, opacity: visibleLines[loanType] ? 1 : 0.3 }} />
              <span className="font-medium text-xs md:text-sm">{config.name}</span>
              {/* Show current rate only on desktop when line is visible */}
              {visibleLines[loanType] && chartData.length > 0 && (
                <div className="hidden md:block text-xs font-bold">
                  {latestRateWithData?.[loanType as keyof RateData]?.toFixed(2)}%
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chart - Responsive height */}
      <div className="p-4 md:p-6">
        <div style={{ height: chartHeight }} className="md:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10 }}
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
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10 }}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              {Object.entries(LOAN_TYPE_CONFIG).map(([loanType, config]) => 
                visibleLines[loanType] ? (
                  <Line
                    key={loanType}
                    type="monotone"
                    dataKey={loanType}
                    stroke={config.color}
                    strokeWidth={loanType === 'conventional' ? 3 : 2}
                    dot={false}
                    activeDot={{ r: 4, fill: config.color, stroke: 'white', strokeWidth: 2 }}
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