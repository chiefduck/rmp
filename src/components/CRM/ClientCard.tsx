// src/components/CRM/ClientCard.tsx - WITH HOT/COLD BADGES
import React from 'react'
import { Phone, Mail, DollarSign, Calendar, Edit, MessageSquare, User, Trash2, Flame, Snowflake, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Client } from '../../lib/supabase'
import { ClientNotificationStatus } from '../Clients/ClientNotificationStatus'
import { RefiEligibilityStatus } from '../Clients/RefiEligibilityStatus'

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

  // 🔥 NEW: Calculate days since last contact
  const getDaysSinceContact = (lastContact?: string): number => {
    if (!lastContact) return 999
    const lastContactDate = new Date(lastContact)
    const today = new Date()
    const diffTime = today.getTime() - lastContactDate.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // 🔥 NEW: Get contact status badge
  const getContactStatus = () => {
    const days = getDaysSinceContact(client.last_contact)
    
    if (days < 7) {
      return {
        label: 'Hot',
        icon: Flame,
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-700 dark:text-green-300',
        borderColor: 'border-green-300 dark:border-green-700',
        iconColor: 'text-green-600 dark:text-green-400'
      }
    } else if (days < 30) {
      return {
        label: 'Warm',
        icon: AlertTriangle,
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        textColor: 'text-yellow-700 dark:text-yellow-300',
        borderColor: 'border-yellow-300 dark:border-yellow-700',
        iconColor: 'text-yellow-600 dark:text-yellow-400'
      }
    } else {
      return {
        label: 'Cold',
        icon: Snowflake,
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        textColor: 'text-red-700 dark:text-red-300',
        borderColor: 'border-red-300 dark:border-red-700',
        iconColor: 'text-red-600 dark:text-red-400'
      }
    }
  }

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
    
    if (loanType.includes('_')) {
      const [type, term] = loanType.split('_')
      const formattedType = type.toUpperCase()
      const formattedTerm = term.replace('yr', 'Y').replace('io', 'IO').replace('arm', 'ARM')
      return `${formattedType} ${formattedTerm}`
    } else {
      const standardTerms = ['10yr', '15yr', '20yr', '25yr', '30yr', '40yr', 'io', 'arm']
      if (standardTerms.includes(loanType)) {
        return `LOAN ${loanType.replace('yr', 'Y').replace('io', 'IO').replace('arm', 'ARM').toUpperCase()}`
      } else {
        return loanType.toUpperCase()
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

  const contactStatus = getContactStatus()

  return (
    <Card 
      hover 
      className="cursor-pointer transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 border border-white/20 dark:border-gray-700/50"
      onClick={onClick}
    >
      <CardContent className="p-6">
        {/* Header with Avatar, Stage, Hot/Cold Badge, and Delete */}
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
            {/* 🔥 NEW: Hot/Cold Badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${contactStatus.bgColor} ${contactStatus.textColor} ${contactStatus.borderColor} backdrop-blur-sm`}>
              <contactStatus.icon className={`w-3.5 h-3.5 ${contactStatus.iconColor}`} />
              {contactStatus.label}
            </div>
            
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

        {/* Notification Status */}
        <div className="mb-4">
          <ClientNotificationStatus 
            client={client} 
            onUpdate={() => {
              // Refresh the card by calling parent refresh if available
              // For now, just log the update
              console.log('Client notification status updated')
            }} 
          />
        </div>

        {/* Refi Eligibility Status */}
        <div className="mb-4">
          <RefiEligibilityStatus client={client} />
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