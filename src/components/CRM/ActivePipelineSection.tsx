import React, { useState } from 'react'
import { Users } from 'lucide-react'
import { StageColumn } from './StageColumn'
import { Client } from '../../lib/supabase'

interface ActivePipelineSectionProps {
  clients: Client[]
  onEditClient: (client: Client) => void
  onViewDetails: (client: Client) => void
  onDeleteClient: (client: Client) => void
  onUpdateStage: (clientId: string, newStage: string, previousStage: string) => void
  onArchiveClient?: (client: Client) => void
  onRestoreClient?: (client: Client) => void
  showArchiveButton?: boolean
  showRestoreButton?: boolean
}

export const ActivePipelineSection: React.FC<ActivePipelineSectionProps> = ({
  clients,
  onEditClient,
  onViewDetails,
  onDeleteClient,
  onUpdateStage,
  onArchiveClient,
  onRestoreClient,
  showArchiveButton = false,
  showRestoreButton = false
}) => {
  const [draggedClient, setDraggedClient] = useState<Client | null>(null)

  const stages = [
    { id: 'prospect', title: 'Prospects', color: 'from-blue-500 to-blue-600' },
    { id: 'qualified', title: 'Qualified', color: 'from-yellow-500 to-orange-500' },
    { id: 'application', title: 'Application', color: 'from-orange-500 to-red-500' },
    { id: 'processing', title: 'Processing', color: 'from-purple-500 to-purple-600' },
    { id: 'closing', title: 'Closing', color: 'from-green-500 to-green-600' }
  ]

  const stagesWithCounts = stages.map(stage => ({
    ...stage,
    count: clients.filter(client => client.current_stage === stage.id).length
  }))

  const handleDragStart = (client: Client) => setDraggedClient(client)
  const handleDragEnd = () => setDraggedClient(null)
  const handleDrop = (newStage: string) => {
    if (draggedClient && draggedClient.current_stage !== newStage) {
      onUpdateStage(draggedClient.id, newStage, draggedClient.current_stage)
    }
    setDraggedClient(null)
  }

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4 md:mb-6">
        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
          <Users className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-100">
          {showRestoreButton ? 'Archived Clients' : 'Active Pipeline'}
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-blue-500/30 to-transparent" />
      </div>
      
      {/* Mobile: Horizontal Scroll */}
      <div className="lg:hidden overflow-x-auto -mx-4 px-4">
        <div className="flex gap-4 pb-4 snap-x snap-mandatory">
          {stagesWithCounts.map(stage => (
            <div key={stage.id} className="min-w-[280px] snap-start">
              <StageColumn
                stage={stage}
                clients={clients.filter(client => client.current_stage === stage.id)}
                draggedClient={draggedClient}
                onEditClient={onEditClient}
                onViewDetails={onViewDetails}
                onDeleteClient={onDeleteClient}
                onUpdateStage={onUpdateStage}
                onArchiveClient={onArchiveClient}
                onRestoreClient={onRestoreClient}
                showArchiveButton={showArchiveButton}
                showRestoreButton={showRestoreButton}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
              />
            </div>
          ))}
        </div>
        <div className="text-center mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">← Swipe to see more stages →</p>
        </div>
      </div>

      {/* Desktop: 5-Column Grid */}
      <div className="hidden lg:grid lg:grid-cols-5 lg:gap-4 xl:gap-6">
        {stagesWithCounts.map(stage => (
          <StageColumn
            key={stage.id}
            stage={stage}
            clients={clients.filter(client => client.current_stage === stage.id)}
            draggedClient={draggedClient}
            onEditClient={onEditClient}
            onViewDetails={onViewDetails}
            onDeleteClient={onDeleteClient}
            onUpdateStage={onUpdateStage}
            onArchiveClient={onArchiveClient}
            onRestoreClient={onRestoreClient}
            showArchiveButton={showArchiveButton}
            showRestoreButton={showRestoreButton}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  )
}