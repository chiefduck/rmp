import React from 'react'
import { Phone, Mail, Edit, Trash2, TrendingUp, Calendar, AlertCircle } from 'lucide-react'
import { TargetProgressBar } from './TargetProgressBar'

interface Mortgage {
  id: string
  client_id: string
  current_rate: number
  target_rate: number
  loan_amount: number
  term_years: number
  start_date: string
  lender: string
  notes?: string
  refi_eligible_date?: string
  created_at: string
  updated_at: string
  client_name?: string
  phone?: string
  email?: string
  market_rate?: number
  savings_potential?: number
}

interface RateMonitorCardProps {
  mortgage: Mortgage
  onEdit?: (mortgage: Mortgage) => void
  onViewDetails?: (mortgage: Mortgage) => void
  onDelete?: (mortgage: Mortgage) => void
}

export const RateMonitorCard: React.FC<RateMonitorCardProps> = ({ 
  mortgage, 
  onEdit, 
  onViewDetails, 
  onDelete 
}) => {
  const calculateMonthlyPayment = (principal: number, annualRate: number, termYears: number) => {
    const monthlyRate = annualRate / 100 / 12
    const numPayments = termYears * 12
    
    if (monthlyRate === 0) return principal / numPayments
    
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
           (Math.pow(1 + monthlyRate, numPayments) - 1)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest('button')) {
      onViewDetails?.(mortgage)
    }
  }

  // Calculate refi eligibility status
  const getRefiStatus = () => {
    if (!mortgage.refi_eligible_date) return null
    
    const today = new Date()
    const refiDate = new Date(mortgage.refi_eligible_date)
    const daysUntilEligible = Math.ceil((refiDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilEligible <= 0) {
      return {
        status: 'eligible',
        text: 'Refi Eligible Now',
        color: 'bg-green-500 text-white',
        borderColor: 'border-green-500',
        glowColor: 'shadow-green-500/50'
      }
    } else if (daysUntilEligible <= 30) {
      return {
        status: 'soon',
        text: `Eligible in ${daysUntilEligible} days`,
        color: 'bg-yellow-500 text-white',
        borderColor: 'border-yellow-500',
        glowColor: 'shadow-yellow-500/50'
      }
    } else {
      return {
        status: 'waiting',
        text: `Eligible ${new Date(mortgage.refi_eligible_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        color: 'bg-gray-500 text-white',
        borderColor: 'border-gray-500',
        glowColor: ''
      }
    }
  }

  const currentMonthlyPayment = calculateMonthlyPayment(mortgage.loan_amount, mortgage.current_rate, mortgage.term_years)
  const targetMonthlyPayment = calculateMonthlyPayment(mortgage.loan_amount, mortgage.target_rate, mortgage.term_years)
  const actualSavings = Math.max(0, currentMonthlyPayment - targetMonthlyPayment)

  const getOpportunityStatus = (monthlySavings: number) => {
    if (monthlySavings >= 300) return { text: 'Excellent', color: 'bg-green-900/30 text-green-300' }
    if (monthlySavings >= 150) return { text: 'Good', color: 'bg-yellow-900/30 text-yellow-300' }
    if (monthlySavings >= 50) return { text: 'Monitor', color: 'bg-blue-900/30 text-blue-300' }
    return { text: 'Low Priority', color: 'bg-gray-800 text-gray-300' }
  }

  const opportunityStatus = getOpportunityStatus(actualSavings)
  const refiStatus = getRefiStatus()

  return (
    <div 
      onClick={handleClick}
      className="group bg-gray-800/70 backdrop-blur-md border border-gray-700/30 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:bg-gray-800/80 relative overflow-hidden"
    >
      {/* Premium Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-xl transform translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform duration-500" />
      
      <div className="relative z-10">
        {/* Header with Client Name */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-green-500/25 transition-all duration-300">
              <span className="text-white font-semibold text-sm">
                {mortgage.client_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-100 text-base group-hover:text-white transition-colors">
                {mortgage.client_name}
              </h3>
              <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                {mortgage.lender} • {mortgage.term_years}yr
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            {actualSavings > 100 && (
              <div className={`px-2 py-1 rounded-lg text-xs font-medium ${opportunityStatus.color} backdrop-blur-sm`}>
                {opportunityStatus.text}
              </div>
            )}
            
            {/* Premium Action Buttons */}
            <div className="flex items-center space-x-1 opacity-70 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit?.(mortgage)
                }}
                className="p-2 text-gray-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-xl transition-all duration-200 backdrop-blur-sm"
                title="Edit Mortgage"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.(mortgage)
                }}
                className="p-2 text-gray-400 hover:text-red-300 hover:bg-red-900/20 rounded-xl transition-all duration-200 backdrop-blur-sm"
                title="Delete Mortgage"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Refi Eligibility Badge */}
        {refiStatus && (
          <div className="mb-4">
            <div className={`
              relative overflow-hidden rounded-xl p-3 border backdrop-blur-sm
              ${refiStatus.status === 'eligible' 
                ? 'bg-green-900/30 border-green-800/50' 
                : refiStatus.status === 'soon'
                ? 'bg-yellow-900/30 border-yellow-800/50'
                : 'bg-purple-900/30 border-purple-800/50'
              }
            `}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {refiStatus.status === 'eligible' && (
                    <AlertCircle className="w-4 h-4 text-green-400 animate-pulse" />
                  )}
                  {refiStatus.status === 'soon' && (
                    <Calendar className="w-4 h-4 text-yellow-400" />
                  )}
                  {refiStatus.status === 'waiting' && (
                    <Calendar className="w-4 h-4 text-purple-400" />
                  )}
                  <span className={`text-xs font-medium ${
                    refiStatus.status === 'eligible' 
                      ? 'text-green-400' 
                      : refiStatus.status === 'soon'
                      ? 'text-yellow-400'
                      : 'text-purple-400'
                  }`}>
                    Refi Eligibility
                  </span>
                </div>
                <span className={`text-sm font-semibold ${
                  refiStatus.status === 'eligible' 
                    ? 'text-green-300' 
                    : refiStatus.status === 'soon'
                    ? 'text-yellow-300'
                    : 'text-purple-300'
                }`}>
                  {refiStatus.text}
                </span>
              </div>
              {refiStatus.status === 'eligible' && (
                <div className="absolute inset-0 bg-green-500/5 animate-pulse" />
              )}
            </div>
          </div>
        )}

        {/* Rate Details - Premium Cards */}
        <div className="space-y-3 mb-4">
          <div className="bg-gray-700/50 backdrop-blur-sm rounded-xl p-3 border border-gray-600/30 group-hover:bg-gray-700/70 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Closing Date</span>
              <span className="text-sm font-semibold text-gray-100">
                {new Date(mortgage.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="bg-gray-700/50 backdrop-blur-sm rounded-xl p-3 border border-gray-600/30 group-hover:bg-gray-700/70 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Current Rate</span>
              <span className="text-sm font-semibold text-gray-100">
                {mortgage.current_rate}%
              </span>
            </div>
          </div>
          
          <div className="bg-blue-900/30 backdrop-blur-sm rounded-xl p-3 border border-blue-800/50 group-hover:bg-blue-900/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-400">Target Rate</span>
              <span className="text-sm font-semibold text-blue-400">
                {mortgage.target_rate}%
              </span>
            </div>
          </div>

          <div className="bg-green-900/30 backdrop-blur-sm rounded-xl p-3 border border-green-800/50 group-hover:bg-green-900/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-400">Loan Amount</span>
              <span className="text-sm font-semibold text-green-400">
                {formatCurrency(mortgage.loan_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Target Progress */}
        <TargetProgressBar
          currentRate={mortgage.current_rate}
          targetRate={mortgage.target_rate}
          marketRate={mortgage.market_rate || 6.5}
          className="mb-4"
        />

        {/* Contact Actions - Premium Style */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={(e) => {
              e.stopPropagation()
              window.open(`tel:${mortgage.phone}`)
            }}
            className="flex items-center justify-center space-x-1 px-3 py-2.5 bg-green-900/30 hover:bg-green-900/50 text-green-300 border border-green-800/50 rounded-xl text-xs font-medium transition-all duration-200 backdrop-blur-sm hover:scale-105"
          >
            <Phone className="w-3 h-3" />
            <span>Call</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              window.open(`mailto:${mortgage.email}`)
            }}
            className="flex items-center justify-center space-x-1 px-3 py-2.5 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border border-blue-800/50 rounded-xl text-xs font-medium transition-all duration-200 backdrop-blur-sm hover:scale-105"
          >
            <Mail className="w-3 h-3" />
            <span>Email</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails?.(mortgage)
            }}
            className="flex items-center justify-center space-x-1 px-3 py-2.5 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 border border-purple-800/50 rounded-xl text-xs font-medium transition-all duration-200 backdrop-blur-sm hover:scale-105"
          >
            <TrendingUp className="w-3 h-3" />
            <span>Details</span>
          </button>
        </div>

        {/* Savings Display */}
        {actualSavings > 0 && (
          <div className="pt-3 border-t border-gray-600/50">
            <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-xl p-3 border border-green-800/30 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-400">Monthly Savings*</span>
                <span className="text-sm font-semibold text-green-400">
                  {formatCurrency(actualSavings)}
                </span>
              </div>
              <p className="text-xs text-green-500/70 mt-1">
                *Estimated P&I only
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}