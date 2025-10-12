// src/pages/CRM.tsx - UPDATED with Pipeline Overview
import React, { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus, Archive, CheckCircle, Users, X } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { PipelineStats } from '../components/CRM/PipelineStats'
import { PipelineOverview } from '../components/CRM/PipelineOverview'
import { ActivePipelineSection } from '../components/CRM/ActivePipelineSection'
import { AddPipelineClientModal } from '../components/CRM/AddPipelineClientModal'
import { EditClientModal } from '../components/CRM/EditClientModal'
import { ClientDetailsModal } from '../components/CRM/ClientDetailsModal'
import { ClosingModal } from '../components/CRM/ClosingModal'
import { EditMortgageModal } from '../components/CRM/EditMortgageModal'
import { MortgageDetailsModal } from '../components/CRM/MortgageDetailsModal'
import { supabase, Client } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../hooks/useConfirm'
import { deleteClient } from '../utils/clientUtils'
import { RateService } from '../lib/rateService'

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
  refi_eligible_date?: string
  created_at: string
  updated_at: string
  client_name?: string
  phone?: string
  email?: string
  market_rate?: number
  savings_potential?: number
}

type ClientFilter = 'active' | 'closed' | 'archived' | 'all'
type InsightFilter = 'stale' | 'ready' | 'followup' | 'closing' | 'hot' | 'cold' | null

export const CRM: React.FC = () => {
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  
  const [activeClients, setActiveClients] = useState<Client[]>([])
  const [closedClients, setClosedClients] = useState<Client[]>([])
  const [archivedClients, setArchivedClients] = useState<Client[]>([])
  const [closedMortgages, setClosedMortgages] = useState<Mortgage[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<ClientFilter>('active')
  const [insightFilter, setInsightFilter] = useState<InsightFilter>(null)
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showClosingModal, setShowClosingModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const [showEditMortgageModal, setShowEditMortgageModal] = useState(false)
  const [showMortgageDetailsModal, setShowMortgageDetailsModal] = useState(false)
  const [selectedMortgage, setSelectedMortgage] = useState<Mortgage | null>(null)

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [activeData, closedData, archivedData, mortgagesData] = await Promise.all([
        supabase.from('clients').select('*').eq('user_id', user?.id).eq('status', 'active').is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('clients').select('*').eq('user_id', user?.id).eq('status', 'closed').is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('clients').select('*').eq('user_id', user?.id).eq('status', 'archived').is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('mortgages').select(`*, clients!inner(first_name, last_name, email, phone, user_id)`).eq('clients.user_id', user?.id).order('created_at', { ascending: false })
      ])

      if (activeData.error) throw activeData.error
      if (closedData.error) throw closedData.error
      if (archivedData.error) throw archivedData.error

      if (mortgagesData.error) {
        console.error('Error fetching mortgages:', mortgagesData.error)
        setClosedMortgages([])
      } else {
        const transformedMortgages = await Promise.all(
          mortgagesData.data?.map(async mortgage => {
            const loanTypeField = mortgage.loan_type || mortgage.clients?.loan_type || '30yr'
            let loanType = 'conventional'
            const typeText = loanTypeField.toLowerCase()
            
            if (typeText.includes('fha')) loanType = 'fha'
            else if (typeText.includes('va')) loanType = 'va'
            else if (typeText.includes('jumbo')) loanType = 'jumbo'
            else if (typeText.includes('arm')) loanType = 'arm'
            
            const termYears = mortgage.term_years || 30
            const marketRate = await RateService.getMarketRate(loanType, termYears)
            
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

      setActiveClients(activeData.data || [])
      setClosedClients(closedData.data || [])
      setArchivedClients(archivedData.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      showError('Failed to load pipeline data. Please refresh the page.')
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

  const handleArchiveClient = async (client: Client) => {
    const clientName = `${client.first_name} ${client.last_name}`.trim()
    
    const confirmed = await confirm({
      title: 'Archive Client',
      message: `Archive ${clientName}?\n\nArchived clients are removed from active pipeline and rate monitoring, but you can still view their history.`,
      confirmText: 'Archive',
      variant: 'warning'
    })
    
    if (!confirmed) return

    try {
      const { error } = await supabase.from('clients').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', client.id)
      if (error) throw error
      success(`${clientName} archived successfully`)
      await fetchData()
    } catch (error) {
      console.error('Error archiving client:', error)
      showError('Failed to archive client. Please try again.')
    }
  }

  const handleRestoreClient = async (client: Client) => {
    const clientName = `${client.first_name} ${client.last_name}`.trim()
    
    const confirmed = await confirm({
      title: 'Restore Client',
      message: `Restore ${clientName} to active pipeline?`,
      confirmText: 'Restore',
      variant: 'info'
    })
    
    if (!confirmed) return

    try {
      const { error } = await supabase.from('clients').update({ status: 'active', current_stage: 'prospect', updated_at: new Date().toISOString() }).eq('id', client.id)
      if (error) throw error
      success(`${clientName} restored to active pipeline`)
      await fetchData()
    } catch (error) {
      console.error('Error restoring client:', error)
      showError('Failed to restore client. Please try again.')
    }
  }

  const updateClientStage = async (clientId: string, newStage: string, previousStage: string) => {
    if (newStage === 'closing') {
      const client = activeClients.find(c => c.id === clientId)
      if (client) {
        setSelectedClient(client)
        setShowClosingModal(true)
        return
      }
    }
  
    setActiveClients(prev => prev.map(client => client.id === clientId ? { ...client, current_stage: newStage as any } : client))
    
    try {
      // 🔥 UPDATED: Now auto-updates last_contact timestamp
      const { error } = await supabase
        .from('clients')
        .update({ 
          current_stage: newStage,
          last_contact: new Date().toISOString(), // ← AUTO UPDATE CONTACT
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)
        
      if (error) throw error
      
      // Log the stage change note
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
        
      success('Client stage updated successfully')
    } catch (error) {
      console.error('Error updating stage:', error)
      showError('Failed to update client stage')
      fetchData()
    }
  }

  const handleClientClosing = async (mortgageData: any) => {
    if (!selectedClient) return

    try {
      await supabase.from('clients').update({ status: 'closed', current_stage: 'closed', updated_at: new Date().toISOString() }).eq('id', selectedClient.id)
      await supabase.from('mortgages').insert({ client_id: selectedClient.id, ...mortgageData })
      await supabase.from('client_notes').insert({ client_id: selectedClient.id, user_id: user?.id, note: `Loan closed with ${mortgageData.lender} at ${mortgageData.current_rate}%. Refi eligible: ${mortgageData.refi_eligible_date}`, note_type: 'stage_change', previous_stage: selectedClient.current_stage, new_stage: 'closed' })
      success('Client loan closed successfully!')
      await fetchData()
      setShowClosingModal(false)
      setSelectedClient(null)
    } catch (error) {
      console.error('Error closing client:', error)
      showError('Failed to close client loan. Please try again.')
    }
  }

  const handleDeleteClient = async (client: Client) => {
    const clientName = `${client.first_name} ${client.last_name}`.trim()
    
    const confirmed = await confirm({
      title: 'Delete Client',
      message: `Are you sure you want to delete ${clientName}?\n\nThis will permanently remove:\n• Client information\n• All notes and activity\n• This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger'
    })
    
    if (!confirmed) return

    try {
      const successResult = await deleteClient(client.id)
      if (successResult) {
        setActiveClients(prev => prev.filter(c => c.id !== client.id))
        setClosedClients(prev => prev.filter(c => c.id !== client.id))
        setArchivedClients(prev => prev.filter(c => c.id !== client.id))
        if (selectedClient?.id === client.id) {
          setSelectedClient(null)
          setShowEditModal(false)
          setShowDetailsModal(false)
        }
        success(`${clientName} deleted successfully`)
      } else {
        showError(`Failed to delete ${clientName}. Please try again.`)
      }
    } catch (error) {
      console.error('Error in delete handler:', error)
      showError(`An error occurred while deleting ${clientName}. Please try again.`)
    }
  }

  const handleDeleteMortgage = async (mortgage: Mortgage) => {
    const confirmed = await confirm({
      title: 'Delete Mortgage',
      message: `Are you sure you want to delete ${mortgage.client_name}'s mortgage?\n\nThis will remove it from rate monitoring and cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger'
    })
    
    if (!confirmed) return
    
    try {
      const { error } = await supabase.from('mortgages').delete().eq('id', mortgage.id)
      if (error) throw error
      setClosedMortgages(prev => prev.filter(m => m.id !== mortgage.id))
      if (selectedMortgage?.id === mortgage.id) {
        setSelectedMortgage(null)
        setShowEditMortgageModal(false)
        setShowMortgageDetailsModal(false)
      }
      success('Mortgage deleted successfully')
    } catch (error) {
      console.error('Error deleting mortgage:', error)
      showError('Failed to delete mortgage. Please try again.')
      fetchData()
    }
  }

  // Handle insight filter clicks
  const handleInsightFilterClick = (filterType: InsightFilter) => {
    // Toggle filter if clicking same one
    if (insightFilter === filterType) {
      setInsightFilter(null)
      return
    }
    
    // Switch to active tab if not already there
    if (activeFilter !== 'active') {
      setActiveFilter('active')
    }
    
    setInsightFilter(filterType)
  }

  // Calculate days since last contact
  const getDaysSinceContact = (lastContact?: string): number => {
    if (!lastContact) return 999
    const lastContactDate = new Date(lastContact)
    const today = new Date()
    const diffTime = today.getTime() - lastContactDate.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Apply insight filters to active clients
  const getFilteredByInsight = (clients: Client[]): Client[] => {
    if (!insightFilter) return clients

    switch (insightFilter) {
      case 'stale':
        return clients.filter(c => {
          const stages = ['new', 'prospect']
          const daysSince = getDaysSinceContact(c.last_contact)
          return stages.includes(c.current_stage || '') && daysSince >= 14
        })
      
      case 'ready':
        return clients.filter(c => {
          const stages = ['qualified']
          const daysSince = getDaysSinceContact(c.last_contact)
          return stages.includes(c.current_stage || '') && daysSince <= 7
        })
      
      case 'followup':
        return clients.filter(c => {
          const stages = ['application']
          const daysSince = getDaysSinceContact(c.last_contact)
          return stages.includes(c.current_stage || '') && daysSince >= 7
        })
      
      case 'closing':
        return clients.filter(c => c.current_stage === 'closing')
      
      case 'hot':
        return clients.filter(c => {
          const daysSince = getDaysSinceContact(c.last_contact)
          const goodStages = ['qualified', 'application', 'closing']
          return daysSince <= 7 && goodStages.includes(c.current_stage || '')
        })
      
      case 'cold':
        return clients.filter(c => {
          const daysSince = getDaysSinceContact(c.last_contact)
          return daysSince >= 30
        })
      
      default:
        return clients
    }
  }

  const getFilteredClients = () => {
    let clients: Client[]
    
    switch (activeFilter) {
      case 'active':
        clients = activeClients
        break
      case 'closed':
        clients = closedClients
        break
      case 'archived':
        clients = archivedClients
        break
      case 'all':
        clients = [...activeClients, ...closedClients, ...archivedClients]
        break
      default:
        clients = activeClients
    }

    // Apply insight filter if active
    if (insightFilter && activeFilter === 'active') {
      clients = getFilteredByInsight(clients)
    }

    return clients
  }

  const filterTabs = useMemo(() => [
    { id: 'active', label: 'Active', icon: Users, count: activeClients.length, color: 'blue' },
    { id: 'closed', label: 'Closed', icon: CheckCircle, count: closedClients.length, color: 'green' },
    { id: 'archived', label: 'Archived', icon: Archive, count: archivedClients.length, color: 'purple' },
    { id: 'all', label: 'All', icon: null, count: activeClients.length + closedClients.length + archivedClients.length, color: 'indigo' }
  ], [activeClients.length, closedClients.length, archivedClients.length])

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
    <>
      <ConfirmDialog />
      <div className="space-y-6 md:space-y-8 pb-20 md:pb-6 p-4 md:p-0">
        {/* Header - Mobile Optimized */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Pipeline Management
          </h1>
          <p className="text-sm md:text-base text-gray-400">
            Active pipeline and rate monitoring dashboard
          </p>
          <div className="mt-4">
            <Button onClick={() => setShowAddModal(true)} className="w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </div>
        </div>

        {/* NEW: Pipeline Overview - Only show for active clients */}
        {activeFilter === 'active' && (
          <PipelineOverview 
            clients={activeClients}
            onFilterClick={handleInsightFilterClick}
            onViewClient={(client) => {
              setSelectedClient(client)
              setShowDetailsModal(true)
            }}
          />
        )}

        {/* Active Insight Filter Badge */}
        {insightFilter && activeFilter === 'active' && (
          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                Filtering by: <strong className="capitalize">{insightFilter}</strong>
              </span>
            </div>
            <button
              onClick={() => setInsightFilter(null)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats Overview - Mobile Responsive */}
        <PipelineStats activeClients={activeClients} closedMortgages={closedMortgages} />

        {/* Filter Tabs - Mobile Scrollable */}
        <div className="backdrop-blur-sm bg-gray-800/60 border border-gray-700/50 rounded-xl md:rounded-2xl p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-4 mb-6 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            {filterTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveFilter(tab.id as ClientFilter)
                  setInsightFilter(null) // Clear insight filter when changing tabs
                }}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  activeFilter === tab.id
                    ? `bg-${tab.color}-600 text-white`
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {tab.icon && <tab.icon className="w-4 h-4" />}
                <span className="text-sm md:text-base">{tab.label} ({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Pipeline Section */}
          <ActivePipelineSection 
            clients={getFilteredClients()}
            onEditClient={(c) => { setSelectedClient(c); setShowEditModal(true) }}
            onViewDetails={(c) => { setSelectedClient(c); setShowDetailsModal(true) }}
            onDeleteClient={handleDeleteClient}
            onUpdateStage={updateClientStage}
            onArchiveClient={handleArchiveClient}
            onRestoreClient={handleRestoreClient}
            showArchiveButton={activeFilter === 'active' || activeFilter === 'closed'}
            showRestoreButton={activeFilter === 'archived'}
          />
        </div>

        {/* MODALS */}
        <AddPipelineClientModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onClientAdded={fetchData} />
        <EditClientModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedClient(null) }} onClientUpdated={fetchData} client={selectedClient} />
        <ClientDetailsModal isOpen={showDetailsModal} onClose={() => { setShowDetailsModal(false); setSelectedClient(null) }} client={selectedClient} onEdit={() => { setShowDetailsModal(false); setShowEditModal(true) }} />
        <ClosingModal isOpen={showClosingModal} onClose={() => { setShowClosingModal(false); setSelectedClient(null) }} client={selectedClient} onConfirm={handleClientClosing} />
        <EditMortgageModal isOpen={showEditMortgageModal} onClose={() => { setShowEditMortgageModal(false); setSelectedMortgage(null) }} mortgage={selectedMortgage} onMortgageUpdated={fetchData} />
        <MortgageDetailsModal isOpen={showMortgageDetailsModal} onClose={() => { setShowMortgageDetailsModal(false); setSelectedMortgage(null) }} mortgage={selectedMortgage} onEdit={(m) => { setShowMortgageDetailsModal(false); setSelectedMortgage(m); setShowEditMortgageModal(true) }} onDelete={handleDeleteMortgage} />
      </div>
    </>
  )
}