import React from 'react'
import { Phone, Mail, DollarSign, Calendar, Edit, MessageSquare, User, Trash2 } from 'lucide-react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Client } from '../../lib/supabase'

interface ClientCardProps {
  client: Client
  onClick?: () => void
  onEdit?: () => void
  onViewDetails?: () => void
  onDelete?: () => void
}

export const ClientCard: React.FC<ClientCardProps> = ({ 
  client, 
  onClick, 
  onEdit, 
  onViewDetails,
  onDelete 
}) => {
  const clientName = `${client.first_name} ${client.last_name}`.trim()

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

  const formatLoanTypeDisplay = (loanType: string) => {
    if (!loanType) return 'N/A'
    
    // Add debug logging
    console.log('Debug - Client loan_type:', loanType)
    
    if (loanType.includes('_')) {
      // New combined format: "conventional_30yr"
      const [type, term] = loanType.split('_')
      const formattedType = type.toUpperCase()
      const formattedTerm = term.replace('yr', 'Y').replace('io', 'IO').replace('arm', 'ARM')
      const result = `${formattedType} ${formattedTerm}`
      console.log('Debug - Combined format result:', result)
      return result
    } else {
      // Old single format - could be just a type or just a term
      const standardTerms = ['10yr', '15yr', '20yr', '25yr', '30yr', '40yr', 'io', 'arm']
      if (standardTerms.includes(loanType)) {
        // It's just a term, show it formatted with "LOAN" prefix
        const result = `LOAN ${loanType.replace('yr', 'Y').replace('io', 'IO').replace('arm', 'ARM').toUpperCase()}`
        console.log('Debug - Term only result:', result)
        return result
      } else {
        // It's a loan type, show it
        const result = loanType.toUpperCase()
        console.log('Debug - Type only result:', result)
        return result
      }
    }
  }

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (client.phone) {
      window.open(`tel:${client.phone}`)
    }
  }

  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (client.email) {
      window.open(`mailto:${client.email}`)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.()
  }

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation()
    onViewDetails?.()
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm(`Are you sure you want to delete ${clientName}? This action cannot be undone.`)) {
      onDelete?.()
    }
  }

  return (
    <Card 
      hover 
      className="cursor-pointer transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 border border-white/20 dark:border-gray-700/50"
      onClick={onClick}
    >
      <CardContent className="p-6">
        {/* Header with Avatar, Stage, and Delete */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {clientName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
  {formatLoanTypeDisplay(client.loan_type)} {client.lender ? `• ${client.lender}` : ''} {client.credit_score ? `• Credit: ${client.credit_score}` : ''}
</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize backdrop-blur-sm ${getStageColor(client.current_stage)}`}>
              {client.current_stage}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 h-10 w-10"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Client Details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between bg-gray-50/50 dark:bg-gray-700/50 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">Loan Amount</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(client.loan_amount)}
            </span>
          </div>
          
          {client.target_rate && (
            <div className="flex items-center justify-between bg-blue-50/50 dark:bg-blue-900/20 rounded-lg p-3 backdrop-blur-sm">
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Target Rate</span>
              </div>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {client.target_rate}%
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between bg-gray-50/50 dark:bg-gray-700/50 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-medium">Last Contact</span>
            </div>
            <span className="text-sm text-gray-900 dark:text-gray-100">
              {formatDate(client.last_contact)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {client.phone && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCall}
              className="flex items-center justify-center space-x-1 bg-green-50/80 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-300 dark:border-green-800 backdrop-blur-sm"
            >
              <Phone className="w-4 h-4" />
              <span>Call</span>
            </Button>
          )}
          
          {client.email && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEmail}
              className="flex items-center justify-center space-x-1 bg-blue-50/80 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 backdrop-blur-sm"
            >
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="flex items-center justify-center space-x-1 bg-purple-50/80 hover:bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800 backdrop-blur-sm"
          >
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewDetails}
            className="flex items-center justify-center space-x-1 bg-gray-50/80 hover:bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:hover:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800 backdrop-blur-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Details</span>
          </Button>
        </div>

        {/* Contact Info Pills */}
        <div className="flex flex-wrap gap-2">
          {client.email && (
            <div className="px-3 py-1 bg-white/60 dark:bg-gray-700/60 rounded-full border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {client.email}
              </span>
            </div>
          )}
          {client.phone && (
            <div className="px-3 py-1 bg-white/60 dark:bg-gray-700/60 rounded-full border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {client.phone}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}