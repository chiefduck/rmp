import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Archive, CheckCircle, Users } from 'lucide-react'
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

export const CRM: React.FC = () => {
  const { user } = useAuth()
  const [activeClients, setActiveClients] = useState<Client[]>([])
  const [closedClients, setClosedClients] = useState<Client[]>([])
  const [archivedClients, setArchivedClients] = useState<Client[]>([])
  const [closedMortgages, setClosedMortgages] = useState<Mortgage[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<ClientFilter>('active')
  
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
    if (!window.confirm(`Archive ${clientName}?\n\nArchived clients are removed from active pipeline and rate monitoring, but you can still view their history.`)) return

    try {
      const { error } = await supabase.from('clients').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', client.id)
      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('Error archiving client:', error)
      alert('Error archiving client. Please try again.')
    }
  }

  const handleRestoreClient = async (client: Client) => {
    const clientName = `${client.first_name} ${client.last_name}`.trim()
    if (!window.confirm(`Restore ${clientName} to active pipeline?`)) return

    try {
      const { error } = await supabase.from('clients').update({ status: 'active', current_stage: 'prospect', updated_at: new Date().toISOString() }).eq('id', client.id)
      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('Error restoring client:', error)
      alert('Error restoring client. Please try again.')
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
      const { error } = await supabase.from('clients').update({ current_stage: newStage, updated_at: new Date().toISOString() }).eq('id', clientId)
      if (error) throw error
      await supabase.from('client_notes').insert({ client_id: clientId, user_id: user?.id, note: `Stage changed from ${previousStage} to ${newStage}`, note_type: 'stage_change', previous_stage: previousStage, new_stage: newStage })
    } catch (error) {
      console.error('Error updating stage:', error)
      fetchData()
    }
  }

  const handleClientClosing = async (mortgageData: any) => {
    if (!selectedClient) return

    try {
      await supabase.from('clients').update({ status: 'closed', current_stage: 'closed', updated_at: new Date().toISOString() }).eq('id', selectedClient.id)
      await supabase.from('mortgages').insert({ client_id: selectedClient.id, ...mortgageData })
      await supabase.from('client_notes').insert({ client_id: selectedClient.id, user_id: user?.id, note: `Loan closed with ${mortgageData.lender} at ${mortgageData.current_rate}%. Refi eligible: ${mortgageData.refi_eligible_date}`, note_type: 'stage_change', previous_stage: selectedClient.current_stage, new_stage: 'closed' })
      await fetchData()
      setShowClosingModal(false)
      setSelectedClient(null)
    } catch (error) {
      console.error('Error closing client:', error)
      alert('Error closing client. Please try again.')
    }
  }

  const handleDeleteClient = async (client: Client) => {
    const clientName = `${client.first_name} ${client.last_name}`.trim()
    if (!window.confirm(`Are you sure you want to delete ${clientName}?\n\nThis will permanently remove:\n• Client information\n• All notes and activity\n• This action cannot be undone.`)) return

    try {
      const success = await deleteClient(client.id)
      if (success) {
        setActiveClients(prev => prev.filter(c => c.id !== client.id))
        setClosedClients(prev => prev.filter(c => c.id !== client.id))
        setArchivedClients(prev => prev.filter(c => c.id !== client.id))
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

  const handleDeleteMortgage = async (mortgage: Mortgage) => {
    if (!window.confirm(`Are you sure you want to delete ${mortgage.client_name}'s mortgage?\n\nThis will remove it from rate monitoring and cannot be undone.`)) return
    
    try {
      const { error } = await supabase.from('mortgages').delete().eq('id', mortgage.id)
      if (error) throw error
      setClosedMortgages(prev => prev.filter(m => m.id !== mortgage.id))
      if (selectedMortgage?.id === mortgage.id) {
        setSelectedMortgage(null)
        setShowEditMortgageModal(false)
        setShowMortgageDetailsModal(false)
      }
    } catch (error) {
      console.error('Error deleting mortgage:', error)
      alert('Error deleting mortgage. Please try again.')
      fetchData()
    }
  }

  const getFilteredClients = () => {
    switch (activeFilter) {
      case 'active': return activeClients
      case 'closed': return closedClients
      case 'archived': return archivedClients
      case 'all': return [...activeClients, ...closedClients, ...archivedClients]
      default: return activeClients
    }
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

      {/* Stats Overview - Mobile Responsive */}
      <PipelineStats activeClients={activeClients} closedMortgages={closedMortgages} />

      {/* Rate Monitor Section - Only show for active filter */}
      {activeFilter === 'active' && (
        <RateMonitorSection 
          mortgages={closedMortgages}
          onEditMortgage={(m) => { setSelectedMortgage(m); setShowEditMortgageModal(true) }}
          onViewMortgageDetails={(m) => { setSelectedMortgage(m); setShowMortgageDetailsModal(true) }}
          onDeleteMortgage={handleDeleteMortgage}
        />
      )}

      {/* Filter Tabs - Mobile Scrollable */}
      <div className="backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-xl md:rounded-2xl p-4 md:p-6">
        <div className="flex items-center gap-2 md:gap-4 mb-6 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as ClientFilter)}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                activeFilter === tab.id
                  ? `bg-${tab.color}-600 text-white`
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
      <AddClientModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onClientAdded={fetchData} />
      <EditClientModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedClient(null) }} onClientUpdated={fetchData} client={selectedClient} />
      <ClientDetailsModal isOpen={showDetailsModal} onClose={() => { setShowDetailsModal(false); setSelectedClient(null) }} client={selectedClient} onEdit={() => { setShowDetailsModal(false); setShowEditModal(true) }} />
      <ClosingModal isOpen={showClosingModal} onClose={() => { setShowClosingModal(false); setSelectedClient(null) }} client={selectedClient} onConfirm={handleClientClosing} />
      <EditMortgageModal isOpen={showEditMortgageModal} onClose={() => { setShowEditMortgageModal(false); setSelectedMortgage(null) }} mortgage={selectedMortgage} onMortgageUpdated={fetchData} />
      <MortgageDetailsModal isOpen={showMortgageDetailsModal} onClose={() => { setShowMortgageDetailsModal(false); setSelectedMortgage(null) }} mortgage={selectedMortgage} onEdit={(m) => { setShowMortgageDetailsModal(false); setSelectedMortgage(m); setShowEditMortgageModal(true) }} onDelete={handleDeleteMortgage} />
    </div>
  )
}