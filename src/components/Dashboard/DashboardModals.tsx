// src/components/Dashboard/DashboardModals.tsx
import React from 'react';
import { X, TrendingDown, TrendingUp, Calendar, Info, Users, Target, DollarSign, ArrowRight, Phone, Mail } from 'lucide-react';

// Rate Details Modal
interface RateDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rateData: {
    label: string;
    current: number | undefined;
    change: number | null | undefined;
    date: string | undefined;
    gradient: string;
  };
  history?: Array<{ date: string; rate: number }>;
}

export const RateDetailsModal: React.FC<RateDetailsModalProps> = ({
  isOpen,
  onClose,
  rateData,
  history = []
}) => {
  if (!isOpen) return null;

  const hasChange = rateData.change !== null && rateData.change !== undefined && rateData.change !== 0;
  const ChangeIcon = hasChange ? (rateData.change! > 0 ? TrendingUp : TrendingDown) : null;

  // Calculate stats from history
  const recentHistory = history.slice(-30);
  const highRate = recentHistory.length > 0 ? Math.max(...recentHistory.map(h => h.rate)) : rateData.current || 0;
  const lowRate = recentHistory.length > 0 ? Math.min(...recentHistory.map(h => h.rate)) : rateData.current || 0;
  const avgRate = recentHistory.length > 0 
    ? recentHistory.reduce((sum, h) => sum + h.rate, 0) / recentHistory.length 
    : rateData.current || 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Gradient */}
        <div className={`bg-gradient-to-r ${rateData.gradient} p-6 text-white relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{rateData.label} Fixed Rate</h2>
              <p className="text-white/80 text-sm">Current market rate details</p>
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-bold">
              {rateData.current ? `${rateData.current.toFixed(3)}%` : '-.---'}
            </span>
            {hasChange && ChangeIcon && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                <ChangeIcon className="w-5 h-5" />
                <span className="text-lg font-semibold">{Math.abs(rateData.change!).toFixed(3)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Key Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">30-Day High</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {highRate.toFixed(3)}%
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">30-Day Avg</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {avgRate.toFixed(3)}%
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">30-Day Low</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {lowRate.toFixed(3)}%
              </p>
            </div>
          </div>

          {/* Last Updated */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Last Updated</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {rateData.date ? new Date(rateData.date + 'T00:00:00').toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'Updating...'}
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <Info className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">About This Rate</p>
              <p>
                This rate is updated daily from Mortgage News Daily. Rates shown are national averages 
                and actual rates may vary based on credit score, loan amount, and other factors.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

// Opportunities Modal - Shows filtered client list
interface OpportunitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Array<{
    id: string;
    first_name: string;
    last_name: string;
    current_stage: string;
    loan_amount?: number;
    phone?: string;
    email?: string;
    created_at: string;
  }>;
  onNavigateToCRM: () => void;
}

export const OpportunitiesModal: React.FC<OpportunitiesModalProps> = ({
  isOpen,
  onClose,
  clients,
  onNavigateToCRM
}) => {
  if (!isOpen) return null;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      minimumFractionDigits: 0 
    }).format(amount);

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      prospect: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      contacted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      qualified: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      application: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      processing: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      closing: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return colors[stage.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  const formatStage = (stage: string) => {
    return stage.charAt(0).toUpperCase() + stage.slice(1).toLowerCase();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Filter for hot leads (qualified + application stages)
  const hotLeads = clients.filter(c => 
    c.current_stage.toLowerCase() === 'qualified' || 
    c.current_stage.toLowerCase() === 'application'
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Active Opportunities</h2>
              <p className="text-white/80 text-sm">{hotLeads.length} hot leads ready to close</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <p className="text-white/70 text-xs mb-1">Total Value</p>
              <p className="text-xl font-bold">
                {formatCurrency(hotLeads.reduce((sum, c) => sum + (c.loan_amount || 0), 0))}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <p className="text-white/70 text-xs mb-1">Qualified</p>
              <p className="text-xl font-bold">
                {hotLeads.filter(c => c.current_stage.toLowerCase() === 'qualified').length}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <p className="text-white/70 text-xs mb-1">In Application</p>
              <p className="text-xl font-bold">
                {hotLeads.filter(c => c.current_stage.toLowerCase() === 'application').length}
              </p>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {hotLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Active Opportunities
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Move clients to "Qualified" or "Application" stage to track them here
              </p>
              <button
                onClick={() => {
                  onNavigateToCRM();
                  onClose();
                }}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200"
              >
                Go to CRM
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {hotLeads.map((client) => (
                <div 
                  key={client.id}
                  className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {client.first_name} {client.last_name}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-1 rounded-lg font-medium ${getStageColor(client.current_stage)}`}>
                          {formatStage(client.current_stage)}
                        </span>
                        {client.loan_amount && (
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(client.loan_amount)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                      {formatDate(client.created_at)}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="flex flex-wrap gap-3 text-sm">
                    {client.phone && (
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <Phone className="w-3.5 h-3.5" />
                        <span className="text-xs">{client.phone}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="text-xs truncate">{client.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <button
              onClick={() => {
                onNavigateToCRM();
                onClose();
              }}
              className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              View Full Pipeline
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Pipeline Quick View Modal
interface PipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: {
    totalClients: number;
    activeOpportunities: number;
    pipelineValue: number;
  };
  onNavigateToCRM: () => void;
}

export const PipelineModal: React.FC<PipelineModalProps> = ({
  isOpen,
  onClose,
  stats,
  onNavigateToCRM
}) => {
  if (!isOpen) return null;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      minimumFractionDigits: 0 
    }).format(amount);

  const avgDealSize = stats.totalClients > 0 ? stats.pipelineValue / stats.totalClients : 0;
  const conversionRate = stats.totalClients > 0 ? (stats.activeOpportunities / stats.totalClients) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Pipeline Overview</h2>
              <p className="text-white/80 text-sm">Your business at a glance</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Main Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Clients</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalClients}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.totalClients === 0 ? 'Start building your pipeline' : 'In your database'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Hot Leads</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.activeOpportunities}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.activeOpportunities === 0 ? 'No active opportunities' : 'Ready to close'}
              </p>
            </div>
          </div>

          {/* Pipeline Value */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/10 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Pipeline Value</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.pipelineValue)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.totalClients > 0 ? `Avg ${formatCurrency(avgDealSize)} per client` : 'Add loan amounts to track value'}
            </p>
          </div>

          {/* Quick Insights */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Quick Insights</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {conversionRate.toFixed(0)}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Average Deal Size</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(avgDealSize)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                <span className={`text-sm font-semibold ${
                  stats.activeOpportunities > 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {stats.activeOpportunities > 0 ? 'Active Pipeline' : 'Build Your Pipeline'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                onNavigateToCRM();
                onClose();
              }}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200"
            >
              View All Clients
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};