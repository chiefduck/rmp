import React from 'react'
import { Phone, Mail, DollarSign, Calendar } from 'lucide-react'
import { Card, CardContent } from '../ui/Card'
import { Client } from '../../lib/supabase'

interface ClientCardProps {
  client: Client
  onClick?: () => void
}

export const ClientCard: React.FC<ClientCardProps> = ({ client, onClick }) => {
  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'prospect': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'qualified': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'application': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
      case 'closed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const formatCurrency = (amount?: number) => {
    return amount ? new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount) : 'N/A'
  }

  const formatDate = (date?: string) => {
    return date ? new Date(date).toLocaleDateString() : 'Never'
  }

  return (
    <Card hover onClick={onClick} className="cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {client.name}
            </h3>
            <p className="text-sm text-gray-500">
              {client.loan_type.toUpperCase()} • {client.credit_score || 'No Score'}
            </p>
          </div>
          <span className={`px-2 py-1 rounded-lg text-xs font-medium capitalize ${getStageColor(client.current_stage)}`}>
            {client.current_stage}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <DollarSign className="w-4 h-4" />
            <span>{formatCurrency(client.loan_amount)}</span>
            {client.target_rate && (
              <span className="ml-auto text-blue-600 dark:text-blue-400 font-medium">
                Target: {client.target_rate}%
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Last contact: {formatDate(client.last_contact)}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {client.phone && (
            <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Phone className="w-4 h-4" />
              <span className="text-sm">Call</span>
            </button>
          )}
          {client.email && (
            <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <Mail className="w-4 h-4" />
              <span className="text-sm">Email</span>
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}