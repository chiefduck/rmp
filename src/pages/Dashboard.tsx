import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingDown, Phone, Mail, DollarSign, Target, RefreshCw, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { RateService } from '../lib/rateService';
import { RateChart } from '../components/Dashboard/RateChart';
import { RecentActivity } from '../components/Dashboard/RecentActivity';

interface MarketData {
  current_30yr?: number;
  current_15yr?: number;
  current_fha?: number;
  current_va?: number;
  current_jumbo?: number;
  change_1day_30yr?: number;
  date_30yr?: string;
  date_15yr?: string;
  date_fha?: string;
  date_va?: string;
  date_jumbo?: string;
}

interface DashboardStats {
  totalClients: number;
  activeOpportunities: number;
  pipelineValue: number;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [marketData, setMarketData] = useState<MarketData>({});
  const [rateHistory, setRateHistory] = useState<Array<{ date: string; rate: number }>>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalClients: 0, activeOpportunities: 0, pipelineValue: 0 });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchDashboardData();
    const handleFocus = () => {
      fetchDashboardData();
      setRefreshTrigger(prev => prev + 1);
    };
    window.addEventListener('focus', handleFocus);
    
    // Auto-refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      fetchDashboardData();
      setRefreshTrigger(prev => prev + 1);
    }, 5 * 60 * 1000);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(refreshInterval);
    };
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      const [clientRes, oppRes, pipelineRes, currentRates, historyData] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user.id).is('deleted_at', null),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user.id).is('deleted_at', null).in('current_stage', ['qualified', 'application']),
        supabase.from('clients').select('loan_amount').eq('user_id', user.id).is('deleted_at', null).not('loan_amount', 'is', null),
        RateService.getCurrentRates(),
        RateService.getRateHistory(30, 'conventional', 30)
      ]);

      setStats({
        totalClients: clientRes.count || 0,
        activeOpportunities: oppRes.count || 0,
        pipelineValue: pipelineRes.data?.reduce((sum, client) => sum + (client.loan_amount || 0), 0) || 0
      });

      setMarketData({
        current_30yr: currentRates['30yr_conventional']?.rate_value,
        current_15yr: currentRates['15yr_conventional']?.rate_value,
        current_fha: currentRates['30yr_fha']?.rate_value,
        current_va: currentRates['30yr_va']?.rate_value,
        current_jumbo: currentRates['30yr_jumbo']?.rate_value,
        change_1day_30yr: currentRates['30yr_conventional']?.change_1_day,
        date_30yr: currentRates['30yr_conventional']?.rate_date,
        date_15yr: currentRates['15yr_conventional']?.rate_date,
        date_fha: currentRates['30yr_fha']?.rate_date,
        date_va: currentRates['30yr_va']?.rate_date,
        date_jumbo: currentRates['30yr_jumbo']?.rate_date,
      });
      
      setRateHistory(historyData?.map(trend => ({ date: trend.date, rate: trend.rate })) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };
  
  const handleRefreshRates = async () => {
    setIsRefreshing(true);
    try {
      await RateService.fetchFreshRates();
      await fetchDashboardData();
    } catch (error) {
      console.error('Error refreshing rates:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  const getChangeColor = (change: number | null | undefined) => !change ? 'text-gray-500' : change > 0 ? 'text-red-500' : 'text-green-500';
  const getChangeIcon = (change: number | null | undefined) => !change ? null : change > 0 ? TrendingUp : TrendingDown;
  const formatRateDate = (dateStr?: string) => {
    if (!dateStr) return 'Updating...';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const rateWidgets = useMemo(() => [
    { label: '30yr', current: marketData.current_30yr, change: marketData.change_1day_30yr, date: marketData.date_30yr, gradient: 'from-blue-500 to-blue-600' },
    { label: '15yr', current: marketData.current_15yr, change: null, date: marketData.date_15yr, gradient: 'from-green-500 to-green-600' },
    { label: 'FHA', current: marketData.current_fha, change: null, date: marketData.date_fha, gradient: 'from-purple-500 to-purple-600' },
    { label: 'VA', current: marketData.current_va, change: null, date: marketData.date_va, gradient: 'from-orange-500 to-orange-600' },
    { label: 'Jumbo', current: marketData.current_jumbo, change: null, date: marketData.date_jumbo, gradient: 'from-red-500 to-red-600' }
  ], [marketData]);

  const statCards = useMemo(() => [
    { 
      title: 'Total Clients', 
      value: stats.totalClients, 
      icon: Users, 
      gradient: 'from-blue-600 to-indigo-600',
      description: stats.totalClients > 0 
        ? (stats.totalClients === 1 ? 'Your first client' : 'Growing your pipeline') 
        : 'Add your first client',
      descriptionColor: 'text-gray-500 dark:text-gray-400'
    },
    { 
      title: 'Active Opportunities', 
      value: stats.activeOpportunities, 
      icon: Target,
      gradient: 'from-green-600 to-emerald-600',
      description: stats.activeOpportunities > 0 
        ? (stats.activeOpportunities === 1 ? '1 hot lead' : `${stats.activeOpportunities} hot leads`)
        : 'No active opportunities yet',
      descriptionColor: stats.activeOpportunities > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
    },
    { 
      title: 'Pipeline Value', 
      value: formatCurrency(stats.pipelineValue), 
      icon: DollarSign,
      gradient: 'from-purple-600 to-pink-600',
      description: stats.pipelineValue > 0 
        ? (stats.totalClients > 0 ? `Avg ${formatCurrency(stats.pipelineValue / stats.totalClients)} per client` : 'Building your pipeline')
        : 'Add loan amounts to track',
      descriptionColor: stats.pipelineValue > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
    }
  ], [stats]);

  const quickActions = [
    { label: 'Add Client', icon: Users, onClick: () => navigate('/crm'), className: 'bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100/70 dark:hover:bg-blue-900/30', iconClass: 'text-blue-600', textClass: 'text-blue-900 dark:text-blue-300' },
    { label: 'Start Calling', icon: Phone, onClick: () => navigate('/calling'), className: 'bg-green-50/50 dark:bg-green-900/20 hover:bg-green-100/70 dark:hover:bg-green-900/30', iconClass: 'text-green-600', textClass: 'text-green-900 dark:text-green-300' },
    { label: 'View Rates', icon: TrendingDown, onClick: () => navigate('/rates'), className: 'bg-purple-50/50 dark:bg-purple-900/20 hover:bg-purple-100/70 dark:hover:bg-purple-900/30', iconClass: 'text-purple-600', textClass: 'text-purple-900 dark:text-purple-300' },
    { label: 'AI Assistant', icon: Mail, onClick: () => navigate('/ai-assistant'), className: 'bg-orange-50/50 dark:bg-orange-900/20 hover:bg-orange-100/70 dark:hover:bg-orange-900/30', iconClass: 'text-orange-600', textClass: 'text-orange-900 dark:text-orange-300' },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6 p-4 md:p-0">
      
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        <div className="relative backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-8 text-white">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-4 md:space-y-0">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2 drop-shadow-sm">Welcome back! 👋</h1>
              <p className="text-white/90 text-base md:text-lg">Here's what's happening with your mortgage business today.</p>
            </div>
            <button onClick={handleRefreshRates} disabled={isRefreshing} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl border border-white/30 transition-all duration-200 w-full md:w-auto justify-center">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh Rates</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {rateWidgets.map((rate) => {
          const ChangeIcon = getChangeIcon(rate.change);
          const hasValidChange = rate.change !== null && rate.change !== undefined && rate.change !== 0;
          
          return (
            <div key={rate.label} className="relative group">
              <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-xl md:rounded-2xl p-3 md:p-4 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300">
                <div className={`w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r ${rate.gradient} rounded-lg md:rounded-xl flex items-center justify-center mb-2 md:mb-3`}>
                  <TrendingDown className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h3 className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{rate.label}</h3>
                <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-2">
                  <span className="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {rate.current ? `${rate.current.toFixed(3)}%` : '-.---'}
                  </span>
                  {hasValidChange && ChangeIcon && (
                    <div className={`flex items-center gap-1 ${getChangeColor(rate.change)}`}>
                      <ChangeIcon className="w-3 h-3" />
                      <span className="text-xs font-medium">{Math.abs(rate.change!).toFixed(3)}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatRateDate(rate.date)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {statCards.map(card => (
          <div key={card.title} className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-xl md:rounded-2xl p-4 md:p-6 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
                <p className={`text-sm mt-1 ${card.descriptionColor}`}>{card.description}</p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-r ${card.gradient} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-xl md:rounded-2xl p-4 md:p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {quickActions.map(action => (
            <button key={action.label} onClick={action.onClick} className={`flex flex-col items-center p-3 md:p-4 rounded-xl transition-all duration-200 backdrop-blur-sm ${action.className}`}>
              <action.icon className={`w-6 h-6 md:w-8 md:h-8 mb-2 ${action.iconClass}`} />
              <span className={`text-xs md:text-sm font-medium text-center ${action.textClass}`}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-xl md:rounded-2xl overflow-hidden">
          <RateChart data={rateHistory} title="30yr Fixed Rate Trends (Last 30 Days)" />
        </div>
        <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-xl md:rounded-2xl overflow-hidden">
          <RecentActivity refreshTrigger={refreshTrigger} />
        </div>
      </div>

    </div>
  );
};