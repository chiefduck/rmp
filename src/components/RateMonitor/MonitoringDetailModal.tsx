// src/components/RateMonitor/MonitoringDetailModal.tsx - Dark Modern UI
import React, { useRef, useEffect } from 'react'
import { X, TrendingDown, Target, Phone, Calendar, DollarSign, Percent, User, Mail, PhoneCall } from 'lucide-react'
import { Button } from '../ui/Button'

interface Mortgage {
  id: string
  client_name?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  current_rate: number
  target_rate: number
  loan_amount: number
  market_rate?: number
  savings_potential?: number
  last_ai_call?: string
  refi_eligible_date?: string
  lender?: string
  term_years?: number
}

interface MonitoringDetailModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  mortgages: Mortgage[]
  icon: 'target' | 'trending' | 'phone' | 'calendar'
  color: 'green' | 'blue' | 'purple' | 'orange'
  onViewMortgage?: (mortgage: Mortgage) => void
}

export const MonitoringDetailModal: React.FC<MonitoringDetailModalProps> = ({
  isOpen, onClose, title, description, mortgages, icon, color, onViewMortgage
}) => {
  const modalRef = useRef<HTMLDivElement>(null)

  const colorClasses = {
    green: 'from-green-500 to-green-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  }

  const DynamicIcon = ({ className }: { className: string }) => {
    switch (icon) {
      case 'target': return <Target className={className} />
      case 'trending': return <TrendingDown className={className} />
      case 'phone': return <Phone className={className} />
      case 'calendar': return <Calendar className={className} />
      default: return null
    }
  }

  const formatCurrency = (amount?: number) => 
    amount ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount) : 'N/A'
  const formatDate = (dateString?: string) => 
    dateString ? new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'
  const getRateDifference = (current: number, market: number) => ({
    value: Math.abs(current - market),
    isGood: current > market
  })

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) onClose()
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        <div className={`bg-gradient-to-r ${colorClasses[color]} p-6 text-white relative`}>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <DynamicIcon className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">{title}</h2>
              <p className="text-white/90 text-sm">{description}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="font-semibold">{mortgages.length}</span>
              <span className="opacity-90">Client{mortgages.length !== 1 ? 's' : ''}</span>
            </div>
            {mortgages.length > 0 && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="font-semibold">{formatCurrency(mortgages.reduce((sum, m) => sum + (m.savings_potential || 0), 0))}</span>
                <span className="opacity-90">Total Potential</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {mortgages.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <DynamicIcon className="w-10 h-10 text-gray-500" />
              </div>
              <p className="text-gray-400 text-lg">No mortgages in this category</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mortgages.map((mortgage) => {
                const rateDiff = mortgage.market_rate ? getRateDifference(mortgage.current_rate, mortgage.market_rate) : null
                return (
                  <div key={mortgage.id} className="bg-gray-800/50 rounded-xl p-5 hover:bg-gray-800 transition-all border border-gray-700">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-100 mb-2">
                          {mortgage.client_name || `${mortgage.first_name} ${mortgage.last_name}`}
                        </h3>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm text-gray-400 font-medium">
                            {mortgage.lender || 'Unknown Lender'}
                          </span>
                          {rateDiff && (
                            <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                              rateDiff.isGood ? 'bg-green-900/30 text-green-300' : 'bg-gray-800 text-gray-400'
                            }`}>
                              {rateDiff.isGood ? `↓ ${rateDiff.value.toFixed(2)}%` : 'At market'}
                            </span>
                          )}
                        </div>
                      </div>
                      {mortgage.savings_potential && mortgage.savings_potential > 0 && (
                        <div className="text-right bg-green-900/20 rounded-lg p-3 border border-green-800">
                          <div className="text-3xl font-bold text-green-400">{formatCurrency(mortgage.savings_potential)}</div>
                          <div className="text-xs text-green-300 font-medium">monthly savings</div>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300 truncate">{mortgage.email}</span>
                      </div>
                      {mortgage.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <PhoneCall className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">{mortgage.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300 font-semibold">{formatCurrency(mortgage.loan_amount)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Percent className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">{mortgage.current_rate.toFixed(2)}% → {mortgage.target_rate.toFixed(2)}%</span>
                      </div>
                      {mortgage.market_rate && (
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingDown className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">Market: {mortgage.market_rate.toFixed(2)}%</span>
                        </div>
                      )}
                      {mortgage.refi_eligible_date && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">Eligible: {formatDate(mortgage.refi_eligible_date)}</span>
                        </div>
                      )}
                    </div>
                    {onViewMortgage && (
                      <Button onClick={() => onViewMortgage(mortgage)} variant="primary" size="md" className="w-full">
                        View Full Details
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="border-t border-gray-800 p-4 bg-gray-800/50">
          <Button onClick={onClose} variant="outline">Close</Button>
        </div>
      </div>
    </div>
  )
}