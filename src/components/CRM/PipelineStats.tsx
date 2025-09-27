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

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="bg-gray-800/70 backdrop-blur-md border-gray-700/30">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Active Pipeline</p>
              <p className="text-2xl font-bold text-gray-100">
                {activeClients.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/70 backdrop-blur-md border-gray-700/30">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Rate Monitor</p>
              <p className="text-2xl font-bold text-gray-100">
                {closedMortgages.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/70 backdrop-blur-md border-gray-700/30">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Pipeline Value</p>
              <p className="text-2xl font-bold text-gray-100">
                {formatCurrency(totalPipelineValue).replace(/\.\d{2}$/, '')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/70 backdrop-blur-md border-gray-700/30">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Refi Opportunities</p>
              <p className="text-2xl font-bold text-gray-100">
                {refiOpportunities}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}