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
    console.log('Drop triggered for stage:', stage.id, 'Client:', draggedClient?.first_name)
    onDrop(stage.id)
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="bg-gray-800/40 backdrop-blur-md border border-gray-700/30 rounded-2xl p-4 min-h-[500px]"
    >
      <div className="mb-4">
        <div className={`h-1 w-full bg-gradient-to-r ${stage.color} rounded-full mb-3`} />
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-100">{stage.title}</h3>
          <span className="px-3 py-1 bg-gray-700/70 text-gray-300 rounded-full text-sm font-medium">
            {stage.count}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {clients.map(client => (
          <PipelineClientCard
            key={client.id}
            client={client}
            isDragging={draggedClient?.id === client.id}
            onEdit={() => onEditClient(client)}
            onViewDetails={() => onViewDetails(client)}
            onDelete={() => onDeleteClient(client)}
            onArchive={onArchiveClient ? () => onArchiveClient(client) : undefined}
            onRestore={onRestoreClient ? () => onRestoreClient(client) : undefined}
            onStageChange={(newStage) => {
              onDragStart(client)
              onDrop(newStage)
              onDragEnd()
            }}
            showArchiveButton={showArchiveButton}
            showRestoreButton={showRestoreButton}
            onDragStart={() => onDragStart(client)}
            onDragEnd={onDragEnd}
          />
        ))}
        
        {clients.length === 0 && (
          <div className="border-2 border-dashed border-gray-600/50 rounded-xl p-8 text-center">
            <p className="text-gray-400 text-sm">Drop clients here</p>
          </div>
        )}
      </div>
    </div>
  )
}