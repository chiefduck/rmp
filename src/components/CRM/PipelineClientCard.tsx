import React, { useState } from 'react'
import { Phone, Mail, Edit, Trash2, Archive, RotateCcw, MoveRight } from 'lucide-react'
import { Client } from '../../lib/supabase'

interface PipelineClientCardProps {
  client: Client
  isDragging: boolean
  onEdit: () => void
  onViewDetails: () => void
  onDelete: () => void
  onArchive?: () => void
  onRestore?: () => void
  onStageChange?: (newStage: string) => void
  showArchiveButton?: boolean
  showRestoreButton?: boolean
  onDragStart: () => void
  onDragEnd: () => void
}

export const PipelineClientCard: React.FC<PipelineClientCardProps> = ({
  client, isDragging, onEdit, onViewDetails, onDelete, onArchive, onRestore, onStageChange,
  showArchiveButton = false, showRestoreButton = false, onDragStart, onDragEnd
}) => {
  const [showStageMenu, setShowStageMenu] = useState(false)
  const clientName = `${client.first_name} ${client.last_name}`.trim()

  const stages = [
    { id: 'prospect', label: 'Prospect' }, { id: 'qualified', label: 'Qualified' },
    { id: 'application', label: 'Application' }, { id: 'processing', label: 'Processing' }, { id: 'closing', label: 'Closing' }
  ]

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount)

  const formatLoanTypeDisplay = (loanType: string) => {
    if (!loanType) return 'N/A'
    if (loanType.includes('_')) {
      const [type, term] = loanType.split('_')
      return `${type.toUpperCase()} ${term.replace('yr', 'Y').replace('io', 'IO').replace('arm', 'ARM')}`
    }
    const standardTerms = ['10yr', '15yr', '20yr', '25yr', '30yr', '40yr', 'io', 'arm']
    return standardTerms.includes(loanType) ? `LOAN ${loanType.replace('yr', 'Y').replace('io', 'IO').replace('arm', 'ARM').toUpperCase()}` : loanType.toUpperCase()
  }

  const handleDragStart = (e: React.DragEvent) => {
    onDragStart()
    e.dataTransfer.effectAllowed = 'move'
    const cardElement = e.currentTarget as HTMLElement
    e.dataTransfer.setDragImage(cardElement, cardElement.offsetWidth / 2, cardElement.offsetHeight / 2)
  }

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest('button')) {
      onViewDetails()
    }
  }

  const handleStageChange = (newStage: string) => {
    if (onStageChange && newStage !== client.current_stage) {
      onStageChange(newStage)
    }
    setShowStageMenu(false)
  }

  return (
    <div className="relative">
      <div 
        draggable
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onClick={handleClick}
        className={`bg-gray-800/70 backdrop-blur-md border border-gray-700/30 rounded-2xl p-4 shadow-lg transition-all duration-300 cursor-move hover:shadow-xl hover:scale-[1.02] hover:bg-gray-800/80 ${isDragging ? 'opacity-30 scale-95 rotate-2' : ''} select-none`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-semibold text-sm">{clientName.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-100 text-sm">{clientName}</h3>
              <p className="text-xs text-gray-400">{formatLoanTypeDisplay(client.loan_type)} {client.credit_score ? `• Credit: ${client.credit_score}` : ''}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 opacity-70 hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); onEdit() }} className="p-1.5 text-gray-400 hover:text-blue-300 transition-colors rounded-lg hover:bg-blue-900/20" title="Edit Client">
              <Edit className="w-3.5 h-3.5" />
            </button>
            {showArchiveButton && onArchive && (
              <button onClick={(e) => { e.stopPropagation(); onArchive() }} className="p-1.5 text-gray-400 hover:text-purple-300 transition-colors rounded-lg hover:bg-purple-900/20" title="Archive Client">
                <Archive className="w-3.5 h-3.5" />
              </button>
            )}
            {showRestoreButton && onRestore && (
              <button onClick={(e) => { e.stopPropagation(); onRestore() }} className="p-1.5 text-gray-400 hover:text-green-300 transition-colors rounded-lg hover:bg-green-900/20" title="Restore Client">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="p-1.5 text-gray-400 hover:text-red-300 transition-colors rounded-lg hover:bg-red-900/20" title="Delete Client">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between bg-gray-700/50 rounded-lg p-2">
            <span className="text-xs text-gray-400">Loan Amount</span>
            <span className="text-sm font-semibold text-gray-100">{formatCurrency(client.loan_amount || 0)}</span>
          </div>
          {client.target_rate && (
            <div className="flex items-center justify-between bg-blue-900/30 rounded-lg p-2">
              <span className="text-xs text-blue-400">Locked Rate</span>
              <span className="text-sm font-semibold text-blue-400">{client.target_rate}%</span>
            </div>
          )}
        </div>

        {onStageChange && (
          <div className="lg:hidden mb-3">
            <button
              onClick={(e) => { e.stopPropagation(); setShowStageMenu(!showStageMenu) }}
              className="w-full flex items-center justify-between px-3 py-2 bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-800/50 rounded-lg text-xs font-medium transition-colors min-h-[44px]"
            >
              <span>Move to Stage</span>
              <MoveRight className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button onClick={(e) => { e.stopPropagation(); window.open(`tel:${client.phone}`) }} className="flex items-center justify-center space-x-1 px-3 py-2 bg-green-900/30 hover:bg-green-900/50 text-green-300 border border-green-800/50 rounded-lg text-xs font-medium transition-colors min-h-[44px]">
            <Phone className="w-3 h-3" />
            <span>Call</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); window.open(`mailto:${client.email}`) }} className="flex items-center justify-center space-x-1 px-3 py-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border border-blue-800/50 rounded-lg text-xs font-medium transition-colors min-h-[44px]">
            <Mail className="w-3 h-3" />
            <span>Email</span>
          </button>
        </div>
        
        {isDragging && <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-2xl bg-blue-900/10" />}
      </div>

      {showStageMenu && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          {stages.map(stage => (
            <button
              key={stage.id}
              onClick={(e) => { e.stopPropagation(); handleStageChange(stage.id) }}
              disabled={stage.id === client.current_stage}
              className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors min-h-[44px] ${stage.id === client.current_stage ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-700 text-gray-100'} border-b border-gray-700 last:border-b-0`}
            >
              <div className="flex items-center justify-between">
                <span>{stage.label}</span>
                {stage.id === client.current_stage && <span className="text-xs text-gray-500">(Current)</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}