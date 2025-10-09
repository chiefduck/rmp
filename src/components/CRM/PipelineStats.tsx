// src/components/CRM/PipelineStats.tsx - NOW CLICKABLE WITH MODALS
import React, { useState } from 'react'
import { Users, TrendingUp, DollarSign, Target } from 'lucide-react'
import { Card, CardContent } from '../ui/Card'
import { Client } from '../../lib/supabase'
import PipelineStatsModals  from './PipelineStatsModals'

interface Mortgage {
  id: string
  savings_potential?: number
  client_name?: string
  current_rate?: number
  market_rate?: number
  loan_amount?: number
}

interface PipelineStatsProps {
  activeClients: Client[]
  closedMortgages: Mortgage[]
}

export const PipelineStats: React.FC<PipelineStatsProps> = ({
  activeClients,
  closedMortgages
}) => {
  const [activeModal, setActiveModal] = useState<'pipeline' | 'monitor' | 'value' | 'refi' | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const totalPipelineValue = activeClients.reduce((sum, client) => sum + (client.loan_amount || 0), 0)
  const refiOpportunities = closedMortgages.filter(m => (m.savings_potential || 0) > 1000)

  const stats = [
    { 
      label: 'Active Pipeline', 
      value: activeClients.length, 
      icon: Users, 
      gradient: 'from-blue-500 to-blue-600',
      onClick: () => setActiveModal('pipeline')
    },
    { 
      label: 'Rate Monitor', 
      value: closedMortgages.length, 
      icon: TrendingUp, 
      gradient: 'from-green-500 to-green-600',
      onClick: () => setActiveModal('monitor')
    },
    { 
      label: 'Pipeline Value', 
      value: formatCurrency(totalPipelineValue), 
      icon: DollarSign, 
      gradient: 'from-purple-500 to-purple-600',
      onClick: () => setActiveModal('value')
    },
    { 
      label: 'Refi Opportunities', 
      value: refiOpportunities.length, 
      icon: Target, 
      gradient: 'from-orange-500 to-red-500',
      onClick: () => setActiveModal('refi')
    }
  ]

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {stats.map(stat => (
          <button
            key={stat.label}
            onClick={stat.onClick}
            className="text-left w-full group"
          >
            <Card className="bg-gray-800/70 backdrop-blur-md border-gray-700/30 hover:bg-gray-800/85 hover:border-gray-600/50 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer relative">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-3">
                  <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="w-full">
                    <p className="text-xs md:text-sm text-gray-400">{stat.label}</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-100 truncate">
                      {stat.value}
                    </p>
                  </div>
                </div>
                {/* Click indicator */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {/* Modals */}
      <PipelineStatsModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        activeClients={activeClients}
        closedMortgages={closedMortgages}
        refiOpportunities={refiOpportunities}
        totalPipelineValue={totalPipelineValue}
      />
    </>
  )
}