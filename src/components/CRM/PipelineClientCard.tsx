import React from 'react'
import { Phone, Mail, Edit, Trash2 } from 'lucide-react'
import { Client } from '../../lib/supabase'

interface PipelineClientCardProps {
  client: Client
  isDragging: boolean
  onEdit: () => void
  onViewDetails: () => void
  onDelete: () => void
  onDragStart: () => void
  onDragEnd: () => void
}

export const PipelineClientCard: React.FC<PipelineClientCardProps> = ({
  client,
  isDragging,
  onEdit,
  onViewDetails,
  onDelete,
  onDragStart,
  onDragEnd
}) => {
  const clientName = `${client.first_name} ${client.last_name}`.trim()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatLoanTypeDisplay = (loanType: string) => {
    if (!loanType) return 'N/A'
    
    if (loanType.includes('_')) {
      // New combined format: "conventional_30yr"
      const [type, term] = loanType.split('_')
      const formattedType = type.toUpperCase()
      const formattedTerm = term.replace('yr', 'Y').replace('io', 'IO').replace('arm', 'ARM')
      return `${formattedType} ${formattedTerm}`
    } else {
      // Old single format - could be just a type or just a term
      const standardTerms = ['10yr', '15yr', '20yr', '25yr', '30yr', '40yr', 'io', 'arm']
      if (standardTerms.includes(loanType)) {
        // It's just a term, show it formatted with "LOAN" prefix
        return `LOAN ${loanType.replace('yr', 'Y').replace('io', 'IO').replace('arm', 'ARM').toUpperCase()}`
      } else {
        // It's a loan type, show it
        return loanType.toUpperCase()
      }
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    onDragStart()
    e.dataTransfer.effectAllowed = 'move'
    
    // Use the actual card element as drag image
    const cardElement = e.currentTarget as HTMLElement
    e.dataTransfer.setDragImage(cardElement, cardElement.offsetWidth / 2, cardElement.offsetHeight / 2)
  }

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger edit if not clicking on action buttons
    const target = e.target as HTMLElement
    if (!target.closest('button')) {
      onEdit()
    }
  }

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={handleClick}
      className={`
        bg-gray-800/70 backdrop-blur-md border border-gray-700/30
        rounded-2xl p-4 shadow-lg transition-all duration-300 cursor-move
        hover:shadow-xl hover:scale-[1.02] hover:bg-gray-800/80
        ${isDragging ? 'opacity-30 scale-95 rotate-2' : ''}
        select-none
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-semibold text-sm">
              {clientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-100 text-sm">
              {clientName}
            </h3>
            <p className="text-xs text-gray-400">
              {formatLoanTypeDisplay(client.loan_type)} {client.credit_score ? `• Credit: ${client.credit_score}` : ''}
            </p>
          </div>
        </div>
        
        {/* Quick Action Buttons */}
        <div className="flex items-center space-x-1 opacity-70 hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="p-1.5 text-gray-400 hover:text-blue-300 transition-colors rounded-lg hover:bg-blue-900/20"
            title="Edit Client"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1.5 text-gray-400 hover:text-red-300 transition-colors rounded-lg hover:bg-red-900/20"
            title="Delete Client"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between bg-gray-700/50 rounded-lg p-2">
          <span className="text-xs text-gray-400">Loan Amount</span>
          <span className="text-sm font-semibold text-gray-100">
            {formatCurrency(client.loan_amount || 0)}
          </span>
        </div>
        
        {client.target_rate && (
          <div className="flex items-center justify-between bg-blue-900/30 rounded-lg p-2">
            <span className="text-xs text-blue-400">Locked Rate</span>
            <span className="text-sm font-semibold text-blue-400">
              {client.target_rate}%
            </span>
          </div>
        )}
      </div>

      {/* Contact Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            window.open(`tel:${client.phone}`)
          }}
          className="flex items-center justify-center space-x-1 px-3 py-2 bg-green-900/30 hover:bg-green-900/50 text-green-300 border border-green-800/50 rounded-lg text-xs font-medium transition-colors"
        >
          <Phone className="w-3 h-3" />
          <span>Call</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            window.open(`mailto:${client.email}`)
          }}
          className="flex items-center justify-center space-x-1 px-3 py-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border border-blue-800/50 rounded-lg text-xs font-medium transition-colors"
        >
          <Mail className="w-3 h-3" />
          <span>Email</span>
        </button>
      </div>
      
      {/* Drag Indicator */}
      {isDragging && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-2xl bg-blue-900/10" />
      )}
    </div>
  )
}