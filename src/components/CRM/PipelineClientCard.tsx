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
  client,
  isDragging,
  onEdit,
  onViewDetails,
  onDelete,
  onArchive,
  onRestore,
  onStageChange,
  showArchiveButton = false,
  showRestoreButton = false,
  onDragStart,
  onDragEnd
}) => {
  const [showStageMenu, setShowStageMenu] = useState(false)
  const clientName = `${client.first_name} ${client.last_name}`.trim()

  const stages = [
    { id: 'prospect', label: 'Prospect' },
    { id: 'qualified', label: 'Qualified' },
    { id: 'application', label: 'Application' },
    { id: 'processing', label: 'Processing' },
    { id: 'closing', label: 'Closing' }
  ]

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)

  const formatLoanTypeDisplay = (loanType: string) => {
    if (!loanType) return 'N/A'
    if (loanType.includes('_')) {
      const [type, term] = loanType.split('_')
      return `${type.toUpperCase()} ${term.replace('yr', 'Y')}`
    }
    const standardTerms = ['10yr', '15yr', '20yr', '25yr', '30yr', '40yr', 'io', 'arm']
    return standardTerms.includes(loanType)
      ? `${loanType.replace('yr', 'Y').replace('io', 'IO').replace('arm', 'ARM').toUpperCase()}`
      : loanType.toUpperCase()
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
        className={`bg-gray-800/70 backdrop-blur-md border border-gray-700/50 rounded-2xl p-4 shadow-lg transition-all duration-300 cursor-move hover:shadow-xl hover:scale-[1.02] hover:bg-gray-800/85 hover:border-gray-600/50 ${
          isDragging ? 'opacity-30 scale-95 rotate-2' : ''
        } select-none`}
      >
        {/* Header with Avatar & Name */}
        <div className="mb-3">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white font-bold text-base">
                {clientName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-base leading-tight mb-1 break-words line-clamp-2">
                {clientName}
              </h3>
              <p className="text-xs font-medium text-gray-300 truncate">
                {formatLoanTypeDisplay(client.loan_type)}
              </p>
              {client.credit_score && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Score: {client.credit_score}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-900/30 transition-colors rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Edit Client"
            >
              <Edit className="w-4 h-4" />
            </button>
            {showArchiveButton && onArchive && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onArchive()
                }}
                className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-900/30 transition-colors rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Archive Client"
              >
                <Archive className="w-4 h-4" />
              </button>
            )}
            {showRestoreButton && onRestore && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRestore()
                }}
                className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-900/30 transition-colors rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Restore Client"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/30 transition-colors rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Delete Client"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Loan Info Cards - Compact */}
        <div className="space-y-2 mb-3">
          <div className="bg-gradient-to-br from-gray-700/60 to-gray-700/40 rounded-lg p-2.5 border border-gray-600/50 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide truncate">
                Loan Amount
              </span>
              <span className="text-base font-bold text-gray-100 whitespace-nowrap">
                {formatCurrency(client.loan_amount || 0)}
              </span>
            </div>
          </div>
          {client.target_rate && (
            <div className="bg-gradient-to-br from-blue-900/40 to-blue-900/20 rounded-lg p-2.5 border border-blue-800/60 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide truncate">
                  Target Rate
                </span>
                <span className="text-base font-bold text-blue-300 whitespace-nowrap">
                  {client.target_rate}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Stage Selector */}
        {onStageChange && (
          <div className="lg:hidden mb-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowStageMenu(!showStageMenu)
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 hover:from-indigo-900/40 hover:to-purple-900/40 text-indigo-300 border border-indigo-800/60 rounded-lg text-sm font-semibold transition-all min-h-[44px] backdrop-blur-sm"
            >
              <span>Move to Stage</span>
              <MoveRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Contact Buttons - Compact */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              window.open(`tel:${client.phone}`)
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-green-900/30 to-emerald-900/30 hover:from-green-900/40 hover:to-emerald-900/40 text-green-300 border border-green-800/60 rounded-lg text-sm font-semibold transition-all min-h-[44px] shadow-sm backdrop-blur-sm"
          >
            <Phone className="w-4 h-4" />
            <span>Call</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              window.open(`mailto:${client.email}`)
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 hover:from-blue-900/40 hover:to-cyan-900/40 text-blue-300 border border-blue-800/60 rounded-lg text-sm font-semibold transition-all min-h-[44px] shadow-sm backdrop-blur-sm"
          >
            <Mail className="w-4 h-4" />
            <span>Email</span>
          </button>
        </div>

        {/* Drag Indicator */}
        {isDragging && (
          <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-2xl bg-blue-900/10" />
        )}
      </div>

      {/* Stage Menu Dropdown */}
      {showStageMenu && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
          {stages.map((stage) => (
            <button
              key={stage.id}
              onClick={(e) => {
                e.stopPropagation()
                handleStageChange(stage.id)
              }}
              disabled={stage.id === client.current_stage}
              className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors min-h-[44px] ${
                stage.id === client.current_stage
                  ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                  : 'hover:bg-gray-700 text-gray-100'
              } border-b border-gray-700 last:border-b-0`}
            >
              <div className="flex items-center justify-between">
                <span>{stage.label}</span>
                {stage.id === client.current_stage && (
                  <span className="text-xs text-gray-500">(Current)</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}