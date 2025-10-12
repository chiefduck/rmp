// src/components/AutoCalling/AutoCallingModals.tsx
import React from 'react';
import { X, Phone, TrendingUp, Clock, DollarSign, CheckCircle, XCircle, MessageSquare, Calendar, PhoneOff, PhoneMissed } from 'lucide-react';

// Types
interface CallLog {
  id: string;
  client_id: string;
  client_name?: string;
  phone_number?: string;
  call_type: 'broker' | 'client';
  call_status: string;
  call_duration?: number;
  cost_cents?: number;
  transcript?: string;
  created_at: string;
  completed_at?: string;
}

// MODAL 1: Total Calls Detail Modal (Blue)
interface TotalCallsModalProps {
  isOpen: boolean;
  onClose: () => void;
  calls: CallLog[];
  totalCalls: number;
}

export const TotalCallsModal: React.FC<TotalCallsModalProps> = ({
  isOpen,
  onClose,
  calls,
  totalCalls
}) => {
  if (!isOpen) return null;

  // Calculate breakdown by status
  const statusBreakdown = calls.reduce((acc, call) => {
    const status = call.call_status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate breakdown by type
  const typeBreakdown = calls.reduce((acc, call) => {
    acc[call.call_type] = (acc[call.call_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'no-answer': return <PhoneMissed className="w-5 h-5 text-yellow-500" />;
      case 'voicemail': return <MessageSquare className="w-5 h-5 text-blue-500" />;
      default: return <Phone className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'failed': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'no-answer': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'voicemail': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default: return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Blue Gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Total Calls</h2>
              <p className="text-white/80 text-sm">Complete call activity breakdown</p>
            </div>
          </div>

          <div className="text-5xl font-bold">{totalCalls}</div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Call Type Breakdown */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Calls by Type
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Client Calls</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {typeBreakdown.client || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {totalCalls > 0 ? Math.round((typeBreakdown.client || 0) / totalCalls * 100) : 0}% of total
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Broker Alerts</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {typeBreakdown.broker || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {totalCalls > 0 ? Math.round((typeBreakdown.broker || 0) / totalCalls * 100) : 0}% of total
                </p>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Call Outcomes</h3>
            <div className="space-y-2">
              {Object.entries(statusBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([status, count]) => {
                  const percentage = totalCalls > 0 ? (count / totalCalls * 100).toFixed(1) : '0';
                  return (
                    <div 
                      key={status}
                      className={`rounded-xl p-4 border ${getStatusColor(status)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(status)}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {formatStatus(status)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {percentage}% of all calls
                            </p>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {count}
                        </div>
                      </div>
                      {/* Progress Bar */}
                      <div className="mt-3 h-2 bg-white/50 dark:bg-gray-800/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Quick Insights */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm">Quick Insights</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Most Common Outcome</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {Object.entries(statusBreakdown).sort(([, a], [, b]) => b - a)[0]?.[0] ? 
                    formatStatus(Object.entries(statusBreakdown).sort(([, a], [, b]) => b - a)[0][0]) : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Client vs Broker Ratio</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {typeBreakdown.client || 0}:{typeBreakdown.broker || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// MODAL 2: Success Rate Detail Modal (Green)
interface SuccessRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  calls: CallLog[];
  successRate: number;
}

export const SuccessRateModal: React.FC<SuccessRateModalProps> = ({
  isOpen,
  onClose,
  calls,
  successRate
}) => {
  if (!isOpen) return null;

  const completedCalls = calls.filter(c => c.call_status === 'completed').length;
  const failedCalls = calls.filter(c => c.call_status === 'failed').length;
  const noAnswerCalls = calls.filter(c => c.call_status === 'no-answer').length;
  const voicemailCalls = calls.filter(c => c.call_status === 'voicemail').length;

  const clientSuccessRate = calls.filter(c => c.call_type === 'client').length > 0
    ? (calls.filter(c => c.call_type === 'client' && c.call_status === 'completed').length / 
       calls.filter(c => c.call_type === 'client').length * 100).toFixed(1)
    : '0';

  const brokerSuccessRate = calls.filter(c => c.call_type === 'broker').length > 0
    ? (calls.filter(c => c.call_type === 'broker' && c.call_status === 'completed').length / 
       calls.filter(c => c.call_type === 'broker').length * 100).toFixed(1)
    : '0';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Green Gradient */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Success Rate</h2>
              <p className="text-white/80 text-sm">Call completion performance metrics</p>
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-bold">{successRate.toFixed(1)}%</span>
            <span className="text-lg text-white/80">completion rate</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Success vs Non-Success */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Successful</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{completedCalls}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Calls completed successfully
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 rounded-xl p-4 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unsuccessful</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {failedCalls + noAnswerCalls + voicemailCalls}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Failed, no answer, or voicemail
              </p>
            </div>
          </div>

          {/* Success by Type */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Success Rate by Type</h3>
            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Client Calls</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{clientSuccessRate}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${clientSuccessRate}%` }}
                  />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Broker Alerts</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{brokerSuccessRate}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${brokerSuccessRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Performance Indicator */}
          <div className={`rounded-xl p-4 border ${
            successRate >= 70 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : successRate >= 50
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-start gap-3">
              <TrendingUp className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                successRate >= 70 ? 'text-green-600 dark:text-green-400'
                : successRate >= 50 ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-red-600 dark:text-red-400'
              }`} />
              <div>
                <h3 className={`font-semibold mb-1 ${
                  successRate >= 70 ? 'text-green-900 dark:text-green-100'
                  : successRate >= 50 ? 'text-yellow-900 dark:text-yellow-100'
                  : 'text-red-900 dark:text-red-100'
                }`}>
                  {successRate >= 70 ? 'Excellent Performance' 
                   : successRate >= 50 ? 'Good Performance'
                   : 'Room for Improvement'}
                </h3>
                <p className={`text-sm ${
                  successRate >= 70 ? 'text-green-800 dark:text-green-200'
                  : successRate >= 50 ? 'text-yellow-800 dark:text-yellow-200'
                  : 'text-red-800 dark:text-red-200'
                }`}>
                  {successRate >= 70 
                    ? 'Your call completion rate is above industry average. Keep up the great work!'
                    : successRate >= 50
                    ? 'Your call completion rate is on track. Consider optimizing call timing.'
                    : 'Your completion rate could be improved. Review call scripts and timing strategies.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// MODAL 3: Average Duration Modal (Purple)
interface AvgDurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  calls: CallLog[];
  avgDuration: number;
}

export const AvgDurationModal: React.FC<AvgDurationModalProps> = ({
  isOpen,
  onClose,
  calls,
  avgDuration
}) => {
  if (!isOpen) return null;

  const callsWithDuration = calls.filter(c => c.call_duration && c.call_duration > 0);
  const totalDuration = callsWithDuration.reduce((sum, c) => sum + (c.call_duration || 0), 0);
  const longestCall = callsWithDuration.length > 0 
    ? Math.max(...callsWithDuration.map(c => c.call_duration || 0))
    : 0;
  const shortestCall = callsWithDuration.length > 0
    ? Math.min(...callsWithDuration.map(c => c.call_duration || 0))
    : 0;

  // Duration ranges
  const under1Min = callsWithDuration.filter(c => (c.call_duration || 0) < 60).length;
  const between1And3 = callsWithDuration.filter(c => (c.call_duration || 0) >= 60 && (c.call_duration || 0) < 180).length;
  const over3Min = callsWithDuration.filter(c => (c.call_duration || 0) >= 180).length;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Purple Gradient */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Average Duration</h2>
              <p className="text-white/80 text-sm">Call length insights and trends</p>
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-bold">{formatDuration(Math.round(avgDuration))}</span>
            <span className="text-lg text-white/80">per call</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Duration Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Shortest</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatDuration(shortestCall)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Average</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatDuration(Math.round(avgDuration))}
              </p>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-900/10 rounded-xl p-4 border border-pink-200 dark:border-pink-800">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Longest</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatDuration(longestCall)}
              </p>
            </div>
          </div>

          {/* Total Time */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/10 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Call Time</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {formatDuration(totalDuration)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Across {callsWithDuration.length} calls
            </p>
          </div>

          {/* Duration Distribution */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Call Length Distribution</h3>
            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Under 1 minute</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Quick calls</p>
                  </div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{under1Min}</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: `${callsWithDuration.length > 0 ? (under1Min / callsWithDuration.length * 100) : 0}%` }}
                  />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">1-3 minutes</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Standard calls</p>
                  </div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{between1And3}</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${callsWithDuration.length > 0 ? (between1And3 / callsWithDuration.length * 100) : 0}%` }}
                  />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Over 3 minutes</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Extended calls</p>
                  </div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{over3Min}</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${callsWithDuration.length > 0 ? (over3Min / callsWithDuration.length * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Insight */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">Duration Insights</h3>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  {avgDuration < 60 
                    ? 'Most calls are brief. Consider if conversations are engaging enough.'
                    : avgDuration > 180
                    ? 'Longer call times may indicate engaged prospects or complex discussions.'
                    : 'Average call duration is optimal for meaningful conversations.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// MODAL 4: Total Cost Modal (Orange)
interface TotalCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  calls: CallLog[];
  totalCost: number;
}

export const TotalCostModal: React.FC<TotalCostModalProps> = ({
  isOpen,
  onClose,
  calls,
  totalCost
}) => {
  if (!isOpen) return null;

  const callsWithCost = calls.filter(c => c.cost_cents && c.cost_cents > 0);
  const avgCostPerCall = callsWithCost.length > 0
    ? callsWithCost.reduce((sum, c) => sum + (c.cost_cents || 0), 0) / callsWithCost.length / 100
    : 0;

  const clientCallsCost = calls
    .filter(c => c.call_type === 'client' && c.cost_cents)
    .reduce((sum, c) => sum + (c.cost_cents || 0), 0) / 100;

  const brokerCallsCost = calls
    .filter(c => c.call_type === 'broker' && c.cost_cents)
    .reduce((sum, c) => sum + (c.cost_cents || 0), 0) / 100;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);

  // Cost per completed call
  const completedCalls = calls.filter(c => c.call_status === 'completed');
  const costPerCompletedCall = completedCalls.length > 0
    ? completedCalls.reduce((sum, c) => sum + (c.cost_cents || 0), 0) / completedCalls.length / 100
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Orange Gradient */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Total Cost</h2>
              <p className="text-white/80 text-sm">Call spending breakdown and insights</p>
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-bold">{formatCurrency(totalCost)}</span>
            <span className="text-lg text-white/80">total spent</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Cost Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Client Calls</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(clientCallsCost)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {calls.filter(c => c.call_type === 'client').length} calls
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <PhoneOff className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Broker Alerts</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(brokerCallsCost)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {calls.filter(c => c.call_type === 'broker').length} calls
              </p>
            </div>
          </div>

          {/* Average Costs */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Cost Per Call</h3>
            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Average per Call</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">All calls</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(avgCostPerCall)}
                  </p>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Per Completed Call</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Successful only</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(costPerCompletedCall)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cost Efficiency */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/10 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Cost Efficiency</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Calls Made</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{callsWithCost.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Spent</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(totalCost)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Avg per Call</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(avgCostPerCall)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-orange-200 dark:border-orange-700">
                <span className="text-gray-600 dark:text-gray-400">Cost per Success</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(costPerCompletedCall)}
                </span>
              </div>
            </div>
          </div>

          {/* Insight */}
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">Spending Insights</h3>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  {avgCostPerCall < 0.10
                    ? 'Your cost per call is excellent. Maintain current calling strategies.'
                    : avgCostPerCall < 0.20
                    ? 'Cost per call is within normal range. Monitor for optimization opportunities.'
                    : 'Consider reviewing call duration and efficiency to optimize costs.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold rounded-xl transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};