import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Target, Clock, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
    enabled: true, // Enable by default now that we have data
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

      const { data, error } = await supabase
        .from('rate_history')
        .select('rate_date, rate_value, loan_type')
        .gte('rate_date', startDate.toISOString().split('T')[0])
        .lte('rate_date', endDate.toISOString().split('T')[0])
        .order('rate_date', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('No data returned from Supabase query');
        setChartData([]);
        return;
      }

      console.log('✅ Loaded', data?.length, 'historical rate records');

      // Group data by date and loan type
      const groupedData: Record<string, RateData> = {};
      
      data?.forEach(record => {
        const date = record.rate_date;
        
        if (!groupedData[date]) {
          groupedData[date] = { date };
        }
        
        groupedData[date][record.loan_type as keyof RateData] = record.rate_value;
      });

      const formattedData = Object.values(groupedData)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setChartData(formattedData);
      calculateStats(formattedData);
    } catch (error) {
      console.error('Error fetching historical rates:', error);
      // Don't fall back to mock data - we have real data, so let's fix the real issue
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    const mockData: RateData[] = [];
    const range = TIME_RANGES[selectedTimeRange];
    const baseRates = { conventional: 6.8, va: 6.6, fha: 6.9, jumbo: 7.1, '15yr_conventional': 6.2 };
    
    for (let i = range.days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const volatility = Math.sin(i / 10) * 0.3 + Math.random() * 0.2 - 0.1;
      
      mockData.push({
        date: date.toISOString().split('T')[0],
        conventional: baseRates.conventional + volatility,
        va: baseRates.va + volatility * 0.8,
        fha: baseRates.fha + volatility * 0.9,
        jumbo: baseRates.jumbo + volatility * 1.1,
        '15yr_conventional': baseRates['15yr_conventional'] + volatility * 0.7
      });
    }
    
    setChartData(mockData);
    calculateStats(mockData);
  };

  const calculateStats = (data: RateData[]) => {
    if (data.length < 2) return;
    
    const conventionalRates = data.map(d => d.conventional).filter(Boolean) as number[];
    if (conventionalRates.length < 2) return;
    
    const firstRate = conventionalRates[0];
    const lastRate = conventionalRates[conventionalRates.length - 1];
    const totalChange = ((lastRate - firstRate) / firstRate) * 100;
    
    // Calculate volatility (standard deviation)
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
              day: 'numeric'
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
                {entry.value?.toFixed(3)}%
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

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

  // Compact variant for dashboard
  if (variant === 'compact') {
    return (
      <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-white/70">
                {chartData[chartData.length - 1]?.conventional?.toFixed(3)}% Current
              </span>
              <div className={`flex items-center space-x-1 ${
                stats.trending === 'up' ? 'text-red-300' : 
                stats.trending === 'down' ? 'text-green-300' : 'text-white/70'
              }`}>
                {stats.trending === 'up' ? <TrendingUp className="w-3 h-3" /> : 
                 stats.trending === 'down' ? <TrendingDown className="w-3 h-3" /> : 
                 <Activity className="w-3 h-3" />}
                <span>{Math.abs(stats.totalChange).toFixed(2)}%</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl">📈</div>
          </div>
        </div>

        <div style={{ height: height - 100 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="conventional"
                stroke="#8B5CF6"
                strokeWidth={2}
                fill="url(#rateGradient)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // Full variant for Rate Monitor page
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
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-4 h-4 text-emerald-300" />
              <span className="text-white/70 text-sm">Current Rate</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {chartData[chartData.length - 1]?.conventional?.toFixed(3) || '6.800'}%
            </div>
          </div>
          
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className={`w-4 h-4 ${stats.trending === 'up' ? 'text-red-300' : stats.trending === 'down' ? 'text-emerald-300' : 'text-white/70'}`} />
              <span className="text-white/70 text-sm">Period Change</span>
            </div>
            <div className={`text-2xl font-bold ${stats.trending === 'up' ? 'text-red-300' : stats.trending === 'down' ? 'text-emerald-300' : 'text-white'}`}>
              {stats.totalChange > 0 ? '+' : ''}{stats.totalChange.toFixed(2)}%
            </div>
          </div>
          
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-4 h-4 text-amber-300" />
              <span className="text-white/70 text-sm">Volatility</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.volatility.toFixed(3)}%
            </div>
          </div>
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
              {visibleLines[loanType] && (
                <div className="text-sm font-bold">
                  {chartData[chartData.length - 1]?.[loanType as keyof RateData]?.toFixed(3)}%
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
                    ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : date.toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
                }}
              />
              
              <YAxis 
                domain={['dataMin - 0.1', 'dataMax + 0.1']}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
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
                    strokeWidth={loanType === 'conventional' ? 4 : 3} // Thicker line for conventional
                    dot={false}
                    activeDot={{ 
                      r: 6, 
                      fill: config.color,
                      stroke: 'white',
                      strokeWidth: 2
                    }}
                    connectNulls={false}
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