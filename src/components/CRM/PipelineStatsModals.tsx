// src/components/CRM/PipelineStatsModals.tsx - NEW FILE
import React from 'react'
import { X, Users, TrendingUp, DollarSign, Target, Phone, Mail, TrendingDown } from 'lucide-react'
import { Client } from '../../lib/supabase'

interface Mortgage {
  id: string
  savings_potential?: number
  client_name?: string
  current_rate?: number
  market_rate?: number
  loan_amount?: number
}

interface PipelineStatsModalsProps {
  activeModal: 'pipeline' | 'monitor' | 'value' | 'refi' | null
  onClose: () => void
  activeClients: Client[]
  closedMortgages: Mortgage[]
  refiOpportunities: Mortgage[]
  totalPipelineValue: number
}

export const PipelineStatsModals: React.FC<PipelineStatsModalsProps> = ({
  activeModal,
  onClose,
  activeClients,
  closedMortgages,
  refiOpportunities,
  totalPipelineValue
}) => {
  if (!activeModal) return null

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      prospect: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      qualified: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      application: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      processing: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      closing: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    }
    return colors[stage.toLowerCase()] || 'bg-gray-100 text-gray-700' 
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Active Pipeline Modal */}
        {activeModal === 'pipeline' && (
          <>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Active Pipeline</h2>
                  <p className="text-white/80 text-sm">{activeClients.length} clients in your pipeline</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {activeClients.map((client) => (
                  <div key={client.id} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {client.first_name} {client.last_name}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-lg font-medium ${getStageColor(client.current_stage)}`}>
                          {client.current_stage}
                        </span>
                      </div>
                      {client.loan_amount && (
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(client.loan_amount)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
                      {client.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {client.phone}
                        </span>
                      )}
                      {client.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {client.email}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Rate Monitor Modal */}
        {activeModal === 'monitor' && (
          <>
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
              <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Rate Monitor</h2>
                  <p className="text-white/80 text-sm">{closedMortgages.length} mortgages being tracked</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {closedMortgages.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No mortgages being monitored yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {closedMortgages.map((mortgage) => (
                    <div key={mortgage.id} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{mortgage.client_name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Current: {mortgage.current_rate}% | Market: {mortgage.market_rate}%
                          </p>
                        </div>
                        {mortgage.loan_amount && (
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(mortgage.loan_amount)}
                          </span>
                        )}
                      </div>
                      {mortgage.savings_potential && mortgage.savings_potential > 0 && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
                          <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                            Potential savings: {formatCurrency(mortgage.savings_potential)}/mo
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Pipeline Value Modal */}
        {activeModal === 'value' && (
          <>
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
              <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Pipeline Value</h2>
                  <p className="text-white/80 text-sm">Total value across all clients</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/10 rounded-xl p-6 mb-6">
                <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">Total Pipeline Value</p>
                <p className="text-4xl font-bold text-purple-900 dark:text-purple-100">{formatCurrency(totalPipelineValue)}</p>
                {activeClients.length > 0 && (
                  <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
                    Average: {formatCurrency(totalPipelineValue / activeClients.length)} per client
                  </p>
                )}
              </div>

              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Value Breakdown by Client</h3>
              <div className="space-y-2">
                {activeClients
                  .filter(c => c.loan_amount && c.loan_amount > 0)
                  .sort((a, b) => (b.loan_amount || 0) - (a.loan_amount || 0))
                  .map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {client.first_name} {client.last_name}
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(client.loan_amount || 0)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        {/* Refi Opportunities Modal */}
        {activeModal === 'refi' && (
          <>
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 text-white">
              <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Refi Opportunities</h2>
                  <p className="text-white/80 text-sm">{refiOpportunities.length} clients can save money</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {refiOpportunities.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No refi opportunities at current rates</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {refiOpportunities.map((mortgage) => (
                    <div key={mortgage.id} className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/10 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{mortgage.client_name}</h3>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Current: {mortgage.current_rate}%</span>
                            <TrendingDown className="w-4 h-4 text-green-600" />
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              New: {mortgage.market_rate}%
                            </span>
                          </div>
                        </div>
                        {mortgage.loan_amount && (
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(mortgage.loan_amount)}
                          </span>
                        )}
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-3 border border-orange-300 dark:border-orange-700">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Savings</span>
                          <span className="text-xl font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(mortgage.savings_potential || 0)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatCurrency((mortgage.savings_potential || 0) * 12)} annually
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
export default PipelineStatsModals;