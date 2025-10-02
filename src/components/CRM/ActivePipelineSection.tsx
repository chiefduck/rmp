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

  // Calculate stage counts
  const stagesWithCounts = stages.map(stage => ({
    ...stage,
    count: clients.filter(client => client.current_stage === stage.id).length
  }))

  const handleDragStart = (client: Client) => {
    setDraggedClient(client)
  }

  const handleDragEnd = () => {
    setDraggedClient(null)
  }

  const handleDrop = (newStage: string) => {
    if (draggedClient && draggedClient.current_stage !== newStage) {
      onUpdateStage(draggedClient.id, newStage, draggedClient.current_stage)
    }
    setDraggedClient(null)
  }

  return (
    <div>
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
          <Users className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-100">
          {showRestoreButton ? 'Archived Clients' : 'Active Pipeline'}
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-blue-500/30 to-transparent" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {stagesWithCounts.map(stage => (
          <StageColumn
            key={stage.id}
            stage={stage}
            clients={clients.filter(client => client.current_stage === stage.id)}
            draggedClient={draggedClient}
            onEditClient={onEditClient}
            onViewDetails={onViewDetails}
            onDeleteClient={onDeleteClient}
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