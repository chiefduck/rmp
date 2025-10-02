import React from 'react'
import { TrendingUp } from 'lucide-react'
import { RateMonitorCard } from './RateMonitorCard'

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

interface RateMonitorSectionProps {
  mortgages: Mortgage[]
  onEditMortgage?: (mortgage: Mortgage) => void
  onViewMortgageDetails?: (mortgage: Mortgage) => void
  onDeleteMortgage?: (mortgage: Mortgage) => void
}

export const RateMonitorSection: React.FC<RateMonitorSectionProps> = ({ 
  mortgages, 
  onEditMortgage, 
  onViewMortgageDetails, 
  onDeleteMortgage 
}) => {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex items-center space-x-3 mb-4 md:mb-6">
        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
          <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-100">Rate Monitor</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-green-500/30 to-transparent" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {mortgages.map(mortgage => (
          <RateMonitorCard 
            key={mortgage.id} 
            mortgage={mortgage}
            onEdit={onEditMortgage}
            onViewDetails={onViewMortgageDetails}
            onDelete={onDeleteMortgage}
          />
        ))}
        
        {mortgages.length === 0 && (
          <div className="col-span-full text-center py-8 md:py-12">
            <TrendingUp className="w-10 h-10 md:w-12 md:h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-base md:text-lg font-medium text-gray-100 mb-2">No closed mortgages yet</h3>
            <p className="text-sm md:text-base text-gray-400">
              Closed loans will appear here for rate monitoring
            </p>
          </div>
        )}
      </div>
    </div>
  )
}