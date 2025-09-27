import React, { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { PipelineStats } from '../components/CRM/PipelineStats'
import { RateMonitorSection } from '../components/CRM/RateMonitorSection'
import { ActivePipelineSection } from '../components/CRM/ActivePipelineSection'
import { AddClientModal } from '../components/CRM/AddClientModal'
import { EditClientModal } from '../components/CRM/EditClientModal'
import { ClientDetailsModal } from '../components/CRM/ClientDetailsModal'
import { ClosingModal } from '../components/CRM/ClosingModal'
import { EditMortgageModal } from '../components/CRM/EditMortgageModal'
import { MortgageDetailsModal } from '../components/CRM/MortgageDetailsModal'
import { supabase, Client } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { deleteClient } from '../utils/clientUtils'
import { RateService } from '../lib/rateService'

// Mortgage interface
interface Mortgage {
  id: string
  client_id: string
  current_rate: number
  target_rate: number
  loan_amount: number
  term_years: number
  start_date: string
  lender: string
  notes?: string
  created_at: string
  updated_at: string
  client_name?: string
  phone?: string
  email?: string
  market_rate?: number
  savings_potential?: number
}

export const CRM: React.FC = () => {
  const { user } = useAuth()
  const [activeClients, setActiveClients] = useState<Client[]>([])
  const [closedMortgages, setClosedMortgages] = useState<Mortgage[]>([])
  const [loading, setLoading] = useState(true)
  
  // Client modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showClosingModal, setShowClosingModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Mortgage modal states
  const [showEditMortgageModal, setShowEditMortgageModal] = useState(false)
  const [showMortgageDetailsModal, setShowMortgageDetailsModal] = useState(false)
  const [selectedMortgage, setSelectedMortgage] = useState<Mortgage | null>(null)

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch active clients (not closed, not deleted)
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user?.id)
        .neq('current_stage', 'closed')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (clientsError) throw clientsError

      // Fetch closed mortgages with client info
      const { data: mortgagesData, error: mortgagesError } = await supabase
        .from('mortgages')
        .select(`
          *,
          clients!inner(
            first_name,
            last_name,
            email,
            phone,
            user_id
          )
        `)
        .eq('clients.user_id', user?.id)
        .order('created_at', { ascending: false })

      if (mortgagesError) {
        console.error('Error fetching mortgages:', mortgagesError)
        setClosedMortgages([])
      } else {
        const transformedMortgages = await Promise.all(
          mortgagesData?.map(async mortgage => {
            // Get loan type from mortgage or client
            const loanTypeField = mortgage.loan_type || mortgage.clients?.loan_type || '30yr'
            
            // Map all 5 main types
            let loanType = 'conventional' // default
            const typeText = loanTypeField.toLowerCase()
            
            if (typeText.includes('fha')) loanType = 'fha'
            else if (typeText.includes('va')) loanType = 'va'
            else if (typeText.includes('jumbo')) loanType = 'jumbo'
            else if (typeText.includes('arm')) loanType = 'arm'
            // else stays 'conventional'
            
            // Get term years
            const termYears = mortgage.term_years || 30
            
            const marketRate = await RateService.getMarketRate(loanType, termYears)
            
            // Enhanced debug
            console.log('=== MAPPING DEBUG ===')
            console.log('Mortgage loan_type:', mortgage.loan_type)
            console.log('Client loan_type:', mortgage.clients?.loan_type)
            console.log('Final loanTypeField:', loanTypeField)
            console.log('Mapped loanType:', loanType)
            console.log('Term years:', termYears)
            console.log('Market rate returned:', marketRate)
            console.log('=====================')
            
            return {
              ...mortgage,
              client_name: `${mortgage.clients.first_name} ${mortgage.clients.last_name}`,
              phone: mortgage.clients.phone,
              email: mortgage.clients.email,
              market_rate: marketRate,
              savings_potential: calculateSavings(mortgage.current_rate, marketRate, mortgage.loan_amount)
            }
          }) || []
        )

        setClosedMortgages(transformedMortgages)
      }

      setActiveClients(clientsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateSavings = (currentRate: number, marketRate: number, loanAmount: number) => {
    if (currentRate <= marketRate) return 0
    const currentPayment = (loanAmount * (currentRate / 100 / 12))
    const newPayment = (loanAmount * (marketRate / 100 / 12))
    return Math.round(currentPayment - newPayment)
  }

  // Handle stage updates with special case for "closing"
  const updateClientStage = async (clientId: string, newStage: string, previousStage: string) => {
    // If moving to "closing", show closing modal instead
    if (newStage === 'closing') {
      const client = activeClients.find(c => c.id === clientId)
      if (client) {
        setSelectedClient(client)
        setShowClosingModal(true)
        return // Don't update stage yet, wait for closing modal
      }
    }

    // Update local state immediately for better UX
    setActiveClients(prev => prev.map(client => 
      client.id === clientId 
        ? { ...client, current_stage: newStage as any }
        : client
    ))
    
    try {
      // Update database
      const { error } = await supabase
        .from('clients')
        .update({ 
          current_stage: newStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)

      if (error) throw error

      // Add stage change note
      await supabase
        .from('client_notes')
        .insert({
          client_id: clientId,
          user_id: user?.id,
          note: `Stage changed from ${previousStage} to ${newStage}`,
          note_type: 'stage_change',
          previous_stage: previousStage,
          new_stage: newStage
        })

    } catch (error) {
      console.error('Error updating stage:', error)
      // Revert local state on error
      fetchData()
    }
  }

  // Handle client closing and mortgage creation
  const handleClientClosing = async (mortgageData: any) => {
    if (!selectedClient) return

    try {
      // First, update client to closed status
      const { error: clientError } = await supabase
        .from('clients')
        .update({ 
          current_stage: 'closed',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedClient.id)

      if (clientError) throw clientError

      // Create mortgage record
      const { error: mortgageError } = await supabase
        .from('mortgages')
        .insert({
          client_id: selectedClient.id,
          current_rate: mortgageData.current_rate,
          target_rate: mortgageData.target_rate,
          loan_amount: mortgageData.loan_amount,
          term_years: mortgageData.term_years,
          start_date: mortgageData.start_date,
          lender: mortgageData.lender,
          notes: mortgageData.notes
        })

      if (mortgageError) throw mortgageError

      // Add closing note
      await supabase
        .from('client_notes')
        .insert({
          client_id: selectedClient.id,
          user_id: user?.id,
          note: `Loan closed with ${mortgageData.lender} at ${mortgageData.current_rate}%`,
          note_type: 'stage_change',
          previous_stage: selectedClient.current_stage,
          new_stage: 'closed'
        })

      // Refresh data to move client to rate monitor
      await fetchData()
      
      // Close modal
      setShowClosingModal(false)
      setSelectedClient(null)

    } catch (error) {
      console.error('Error closing client:', error)
      alert('Error closing client. Please try again.')
    }
  }

  // Delete client handler
  const handleDeleteClient = async (client: Client) => {
    const clientName = `${client.first_name} ${client.last_name}`.trim()
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${clientName}?\n\nThis will permanently remove:\n• Client information\n• All notes and activity\n• This action cannot be undone.`
    )

    if (!confirmed) return

    try {
      const success = await deleteClient(client.id)
      
      if (success) {
        setActiveClients(prev => prev.filter(c => c.id !== client.id))
        console.log(`${clientName} has been deleted successfully`)
        
        if (selectedClient?.id === client.id) {
          setSelectedClient(null)
          setShowEditModal(false)
          setShowDetailsModal(false)
        }
      } else {
        alert(`Failed to delete ${clientName}. Please try again.`)
      }
    } catch (error) {
      console.error('Error in delete handler:', error)
      alert(`An error occurred while deleting ${clientName}. Please try again.`)
    }
  }

  // Mortgage handlers - NOW FULLY FUNCTIONAL
  const handleEditMortgage = (mortgage: Mortgage) => {
    setSelectedMortgage(mortgage)
    setShowEditMortgageModal(true)
  }

  const handleViewMortgageDetails = (mortgage: Mortgage) => {
    setSelectedMortgage(mortgage)
    setShowMortgageDetailsModal(true)
  }

  const handleDeleteMortgage = async (mortgage: Mortgage) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${mortgage.client_name}'s mortgage?\n\nThis will remove it from rate monitoring and cannot be undone.`
    )
    
    if (!confirmed) return
    
    try {
      const { error } = await supabase
        .from('mortgages')
        .delete()
        .eq('id', mortgage.id)
      
      if (error) throw error
      
      // Remove from local state immediately for better UX
      setClosedMortgages(prev => prev.filter(m => m.id !== mortgage.id))
      
      console.log(`${mortgage.client_name}'s mortgage has been deleted successfully`)
      
      // Close modals if this mortgage is selected
      if (selectedMortgage?.id === mortgage.id) {
        setSelectedMortgage(null)
        setShowEditMortgageModal(false)
        setShowMortgageDetailsModal(false)
      }
      
    } catch (error) {
      console.error('Error deleting mortgage:', error)
      alert('Error deleting mortgage. Please try again.')
      // Refresh data on error to sync state
      fetchData()
    }
  }

  const handleEditClient = (client: Client) => {
    setSelectedClient(client)
    setShowEditModal(true)
  }

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client)
    setShowDetailsModal(true)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setSelectedClient(null)
  }

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false)
    setSelectedClient(null)
  }

  const handleEditFromDetails = () => {
    setShowDetailsModal(false)
    setShowEditModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-400">Loading pipeline...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
          Pipeline Management
        </h1>
        <p className="text-gray-400">
          Active pipeline and rate monitoring dashboard
        </p>
        <div className="mt-4">
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <PipelineStats 
        activeClients={activeClients} 
        closedMortgages={closedMortgages} 
      />

      {/* Rate Monitor Section */}
      <RateMonitorSection 
        mortgages={closedMortgages}
        onEditMortgage={handleEditMortgage}
        onViewMortgageDetails={handleViewMortgageDetails}
        onDeleteMortgage={handleDeleteMortgage}
      />

      {/* Active Pipeline Section */}
      <ActivePipelineSection 
        clients={activeClients}
        onEditClient={handleEditClient}
        onViewDetails={handleViewDetails}
        onDeleteClient={handleDeleteClient}
        onUpdateStage={updateClientStage}
      />

      {/* CLIENT MODALS */}
      <AddClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onClientAdded={fetchData}
      />

      <EditClientModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onClientUpdated={fetchData}
        client={selectedClient}
      />

      <ClientDetailsModal
        isOpen={showDetailsModal}
        onClose={handleCloseDetailsModal}
        client={selectedClient}
        onEdit={handleEditFromDetails}
      />

      <ClosingModal
        isOpen={showClosingModal}
        onClose={() => {
          setShowClosingModal(false)
          setSelectedClient(null)
        }}
        client={selectedClient}
        onConfirm={handleClientClosing}
      />

      {/* MORTGAGE MODALS */}
      <EditMortgageModal
        isOpen={showEditMortgageModal}
        onClose={() => {
          setShowEditMortgageModal(false)
          setSelectedMortgage(null)
        }}
        mortgage={selectedMortgage}
        onMortgageUpdated={fetchData}
      />

      <MortgageDetailsModal
        isOpen={showMortgageDetailsModal}
        onClose={() => {
          setShowMortgageDetailsModal(false)
          setSelectedMortgage(null)
        }}
        mortgage={selectedMortgage}
        onEdit={(mortgage) => {
          setShowMortgageDetailsModal(false)
          setSelectedMortgage(mortgage)
          setShowEditMortgageModal(true)
        }}
        onDelete={handleDeleteMortgage}
      />
    </div>
  )
}