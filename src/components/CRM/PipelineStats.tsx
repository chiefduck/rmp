import React from 'react'
import { Users, TrendingUp, DollarSign, Target } from 'lucide-react'
import { Card, CardContent } from '../ui/Card'
import { Client } from '../../lib/supabase'

interface Mortgage {
  id: string
  savings_potential?: number
}

interface PipelineStatsProps {
  activeClients: Client[]
  closedMortgages: Mortgage[]
}

export const PipelineStats: React.FC<PipelineStatsProps> = ({
  activeClients,
  closedMortgages
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const totalPipelineValue = activeClients.reduce((sum, client) => sum + (client.loan_amount || 0), 0)
  const refiOpportunities = closedMortgages.filter(m => (m.savings_potential || 0) > 1000).length

  const stats = [
    { label: 'Active Pipeline', value: activeClients.length, icon: Users, gradient: 'from-blue-500 to-blue-600' },
    { label: 'Rate Monitor', value: closedMortgages.length, icon: TrendingUp, gradient: 'from-green-500 to-green-600' },
    { label: 'Pipeline Value', value: formatCurrency(totalPipelineValue), icon: DollarSign, gradient: 'from-purple-500 to-purple-600' },
    { label: 'Refi Opportunities', value: refiOpportunities, icon: Target, gradient: 'from-orange-500 to-red-500' }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
      {stats.map(stat => (
        <Card key={stat.label} className="bg-gray-800/70 backdrop-blur-md border-gray-700/30">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-3">
              <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="w-full">
                <p className="text-xs md:text-sm text-gray-400">{stat.label}</p>
                <p className="text-xl md:text-2xl font-bold text-gray-100 truncate">
                  {stat.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}