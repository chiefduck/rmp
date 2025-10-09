// src/components/CRM/StageColumn.tsx - UPDATED FOR LARGER CARDS
import React from 'react'
import { PipelineClientCard } from './PipelineClientCard'
import { Client } from '../../lib/supabase'

interface Stage {
  id: string
  title: string
  color: string
  count: number
}

interface StageColumnProps {
  stage: Stage
  clients: Client[]
  draggedClient: Client | null
  onEditClient: (client: Client) => void
  onViewDetails: (client: Client) => void
  onDeleteClient: (client: Client) => void
  onUpdateStage: (clientId: string, newStage: string, previousStage: string) => void
  onArchiveClient?: (client: Client) => void
  onRestoreClient?: (client: Client) => void
  showArchiveButton?: boolean
  showRestoreButton?: boolean
  onDragStart: (client: Client) => void
  onDragEnd: () => void
  onDrop: (stageId: string) => void
}

export const StageColumn: React.FC<StageColumnProps> = ({
  stage,
  clients,
  draggedClient,
  onEditClient,
  onViewDetails,
  onDeleteClient,
  onUpdateStage,
  onArchiveClient,
  onRestoreClient,
  showArchiveButton = false,
  showRestoreButton = false,
  onDragStart,
  onDragEnd,
  onDrop
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    onDrop(stage.id)
  }

  const handleMobileStageChange = (client: Client, newStage: string) => {
    if (newStage !== client.current_stage) {
      onUpdateStage(client.id, newStage, client.current_stage)
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="bg-gray-800/40 backdrop-blur-md border border-gray-700/30 rounded-2xl p-4 md:p-5 min-h-[600px] flex flex-col"
    >
      {/* Column Header - LARGER */}
      <div className="mb-4 md:mb-5 flex-shrink-0">
        <div className={`h-1.5 w-full bg-gradient-to-r ${stage.color} rounded-full mb-3 md:mb-4`} />
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-base md:text-lg text-gray-100 truncate">
            {stage.title}
          </h3>
          <span className="px-3 py-1.5 bg-gray-700/70 text-gray-300 rounded-full text-sm md:text-base font-semibold whitespace-nowrap">
            {stage.count}
          </span>
        </div>
      </div>

      {/* Client Cards - Scrollable with MORE SPACE */}
      <div className="flex-1 overflow-y-auto space-y-4 md:space-y-5 pr-1">
        {clients.map((client) => (
          <PipelineClientCard
            key={client.id}
            client={client}
            isDragging={draggedClient?.id === client.id}
            onEdit={() => onEditClient(client)}
            onViewDetails={() => onViewDetails(client)}
            onDelete={() => onDeleteClient(client)}
            onArchive={onArchiveClient ? () => onArchiveClient(client) : undefined}
            onRestore={onRestoreClient ? () => onRestoreClient(client) : undefined}
            onStageChange={(newStage) => handleMobileStageChange(client, newStage)}
            showArchiveButton={showArchiveButton}
            showRestoreButton={showRestoreButton}
            onDragStart={() => onDragStart(client)}
            onDragEnd={onDragEnd}
          />
        ))}

        {/* Empty State - LARGER */}
        {clients.length === 0 && (
          <div className="border-2 border-dashed border-gray-600/50 rounded-2xl p-8 md:p-12 text-center">
            <p className="text-gray-400 text-sm md:text-base">Drop clients here</p>
          </div>
        )}
      </div>
    </div>
  )
}