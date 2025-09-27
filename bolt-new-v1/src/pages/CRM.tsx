import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Users, DollarSign } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card'
import { ClientCard } from '../components/CRM/ClientCard'
import { AddClientModal } from '../components/CRM/AddClientModal'
import { supabase, Client } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export const CRM: React.FC = () => {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [loanTypeFilter, setLoanTypeFilter] = useState('all')

  useEffect(() => {
    fetchClients()
  }, [user])

  const fetchClients = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm)
    
    const matchesStage = stageFilter === 'all' || client.current_stage === stageFilter
    const matchesLoanType = loanTypeFilter === 'all' || client.loan_type === loanTypeFilter

    return matchesSearch && matchesStage && matchesLoanType
  })

  const stageOptions = [
    { value: 'all', label: 'All Stages' },
    { value: 'prospect', label: 'Prospect' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'application', label: 'Application' },
    { value: 'closed', label: 'Closed' }
  ]

  const loanTypeOptions = [
    { value: 'all', label: 'All Loan Types' },
    { value: '30yr', label: '30-Year Fixed' },
    { value: 'fha', label: 'FHA Loan' },
    { value: 'va', label: 'VA Loan' },
    { value: '15yr', label: '15-Year Fixed' }
  ]

  const getStageCount = (stage: string) => {
    return clients.filter(client => client.current_stage === stage).length
  }

  const getTotalPipelineValue = () => {
    return clients.reduce((total, client) => total + (client.loan_amount || 0), 0)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            CRM
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your client pipeline and relationships
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Pipeline Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Prospects</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {getStageCount('prospect')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Qualified</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {getStageCount('qualified')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Application</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {getStageCount('application')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Closed</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {getStageCount('closed')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pipeline</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(getTotalPipelineValue()).replace(/\.\d{2}$/, '')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
            <Select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              options={stageOptions}
            />
            <Select
              value={loanTypeFilter}
              onChange={(e) => setLoanTypeFilter(e.target.value)}
              options={loanTypeOptions}
            />
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Client Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading clients...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {clients.length === 0 ? 'No clients yet' : 'No clients match your filters'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {clients.length === 0 
                ? 'Get started by adding your first client to the system.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {clients.length === 0 && (
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Client
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={() => {
                // Handle client click - could open edit modal
              }}
            />
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onClientAdded={fetchClients}
      />
    </div>
  )
}