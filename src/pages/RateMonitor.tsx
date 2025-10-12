// src/pages/RateMonitor.tsx - ULTRA CLEAN VERSION
import React, { useState } from 'react'
import { RefreshCw, Activity, Clock, Plus } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { RateCardsGridSkeleton, ClientCardsGridSkeleton } from '../components/ui/Skeletons'
import HistoricalRateChart from '../components/RateMonitor/HistoricalRateChart'
import { MonitoringOverview } from '../components/RateMonitor/MonitoringOverview'
import { AddMonitoringClientModal } from '../components/RateMonitor/AddMonitoringClientModal'
import { RateDetailModal } from '../components/RateMonitor/RateDetailModal'
import { RateCard } from '../components/RateMonitor/RateCard'
import { RateComparison } from '../components/RateMonitor/RateComparison'
import { RateAlertsSection } from '../components/RateMonitor/RateAlertsSection'
import { RateMonitorCard } from '../components/RateMonitor/RateMonitorCard'
import { EditMortgageModal } from '../components/CRM/EditMortgageModal'
import { MortgageDetailsModal } from '../components/CRM/MortgageDetailsModal'
import { useRateData, MortgageData, RateDisplayData } from '../hooks/useRateData'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { formatDateTime } from '../utils/formatters'
import { SUCCESS_MESSAGES } from '../utils/constants'

export const RateMonitor: React.FC = () => {
  const { user } = useAuth()
  const { info } = useToast()
  
  // Use custom hook for all data management
  const {
    rates,
    mortgages,
    alerts,
    loading,
    initialLoading,
    lastRefresh,
    dataLastUpdated,
    fetchAll,
    refreshRates
  } = useRateData(user?.id)
  
  // UI State
  const [showAlerts, setShowAlerts] = useState(true)
  const [showComparison, setShowComparison] = useState(false)
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showRateDetailModal, setShowRateDetailModal] = useState(false)
  const [selectedMortgage, setSelectedMortgage] = useState<MortgageData | null>(null)
  const [selectedRate, setSelectedRate] = useState<RateDisplayData | null>(null)

  const handleDeleteMortgage = async (mortgage: MortgageData) => {
    if (!confirm(`Delete ${mortgage.client_name}'s mortgage?\n\nThis cannot be undone.`)) return
    
    try {
      const { error } = await supabase.from('mortgages').delete().eq('id', mortgage.id)
      if (error) throw error
      
      info(SUCCESS_MESSAGES.MORTGAGE_DELETED)
      fetchAll()
      
      if (selectedMortgage?.id === mortgage.id) {
        setSelectedMortgage(null)
        setShowEditModal(false)
        setShowDetailsModal(false)
      }
    } catch (error) {
      console.error('Error deleting:', error)
      info('Failed to delete mortgage')
    }
  }

  // Show initial loading state
  if (initialLoading) {
    return (
      <div className="space-y-4 md:space-y-6 overflow-x-hidden pb-20 md:pb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Rate Monitor
            </h1>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="h-12 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        </div>
        <RateCardsGridSkeleton />
        <ClientCardsGridSkeleton count={3} />
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 overflow-x-hidden pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Rate Monitor
          </h1>
          <div className="flex flex-wrap gap-2 text-xs md:text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Last: {formatDateTime(lastRefresh)}
            </span>
            {dataLastUpdated && (
              <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
                Data: {new Date(dataLastUpdated + 'T00:00:00').toLocaleDateString()}
              </span>
            )}
            <span className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live
            </span>
          </div>
        </div>
        <Button onClick={refreshRates} loading={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Add Client Button */}
      <div className="flex justify-center">
        <Button 
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all px-8 py-3"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          <span className="font-semibold">Add Closed Client to Monitor</span>
        </Button>
      </div>

      {/* Rate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {rates.map(rate => (
          <div 
            key={rate.loan_type}
            onClick={() => {
              setSelectedRate(rate)
              setShowRateDetailModal(true)
            }}
          >
            <RateCard rate={rate} />
          </div>
        ))}
      </div>

      {/* Monitoring Overview */}
      {mortgages.length > 0 && (
        <MonitoringOverview
          mortgages={mortgages}
          currentMarketRate={rates.find(r => r.loan_type === 'conventional')?.rate || 6.5}
          onViewMortgage={(m) => {
            setSelectedMortgage(m)
            setShowDetailsModal(true)
          }}
        />
      )}

      {/* Monitored Clients */}
      {mortgages.length > 0 && (
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Monitored Clients
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-green-500/30 to-transparent" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mortgages.map(mortgage => (
              <RateMonitorCard 
                key={mortgage.id} 
                mortgage={mortgage}
                onEdit={(m) => {
                  setSelectedMortgage(m)
                  setShowEditModal(true)
                }}
                onViewDetails={(m) => {
                  setSelectedMortgage(m)
                  setShowDetailsModal(true)
                }}
                onDelete={handleDeleteMortgage}
              />
            ))}
          </div>
        </div>
      )}

      {/* Historical Rate Chart */}
      <HistoricalRateChart 
        height={300} 
        variant="full" 
        title="Historical Rate Analytics" 
        className="shadow-lg" 
      />

      {/* Rate Alerts */}
      <RateAlertsSection
        alerts={alerts}
        isExpanded={showAlerts}
        onToggle={() => setShowAlerts(!showAlerts)}
      />

      {/* Rate Comparison Table */}
      <RateComparison
        rates={rates}
        isExpanded={showComparison}
        onToggle={() => setShowComparison(!showComparison)}
      />

      {/* Modals */}
      <AddMonitoringClientModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onClientAdded={fetchAll} 
      />
      
      <RateDetailModal
        isOpen={showRateDetailModal}
        onClose={() => {
          setShowRateDetailModal(false)
          setSelectedRate(null)
        }}
        rate={selectedRate}
      />
      
      <EditMortgageModal 
        isOpen={showEditModal} 
        onClose={() => {
          setShowEditModal(false)
          setSelectedMortgage(null)
        }} 
        mortgage={selectedMortgage} 
        onMortgageUpdated={fetchAll} 
      />
      
      <MortgageDetailsModal 
        isOpen={showDetailsModal} 
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedMortgage(null)
        }} 
        mortgage={selectedMortgage} 
        onEdit={(m) => {
          setShowDetailsModal(false)
          setSelectedMortgage(m)
          setShowEditModal(true)
        }} 
        onDelete={handleDeleteMortgage} 
      />
    </div>
  )
}