import React, { useState } from 'react'
import { User, TrendingUp, ArrowRight, ArrowLeft, DollarSign, FileText, CreditCard  } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface AddClientModalProps {
  isOpen: boolean
  onClose: () => void
  onClientAdded: () => void
}

type ClientType = 'new' | 'past' | null
type Step = 'choose-type' | 'new-client-form' | 'past-client-form'

export const AddClientModal: React.FC<AddClientModalProps> = ({
  isOpen,
  onClose,
  onClientAdded
}) => {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState<Step>('choose-type')
  const [clientType, setClientType] = useState<ClientType>(null)
  const [loading, setLoading] = useState(false)

  // Form data for new clients
  const [newClientData, setNewClientData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    loan_amount: '',
    loan_type: 'conventional',
    custom_loan_type: '',
    loan_term: '30yr',
    custom_loan_term: '',
    credit_score: '',
    target_rate: '',
    lender: '', // Add this
    notes: ''
  })

  // Form data for past clients (includes mortgage info)
  const [pastClientData, setPastClientData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    loan_amount: '',
    current_rate: '',
    target_rate: '',
    loan_type: 'conventional',
    custom_loan_type: '',
    loan_term: '30yr',
    custom_loan_term: '',
    lender: '',
    start_date: '',
    term_years: 30,
    notes: ''
  })

  const handleReset = () => {
    setCurrentStep('choose-type')
    setClientType(null)
    setNewClientData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      loan_amount: '',
      loan_type: 'conventional',
      custom_loan_type: '',
      loan_term: '30yr',
      custom_loan_term: '',
      credit_score: '',
      target_rate: '',
      lender: '',
      notes: ''
    })
    setPastClientData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      loan_amount: '',
      current_rate: '',
      target_rate: '',
      loan_type: 'conventional',
      custom_loan_type: '',
      loan_term: '30yr',
      custom_loan_term: '',
      lender: '',
      start_date: '',
      term_years: 30,
      notes: ''
    })
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const handleTypeSelection = (type: ClientType) => {
    setClientType(type)
    if (type === 'new') {
      setCurrentStep('new-client-form')
    } else if (type === 'past') {
      setCurrentStep('past-client-form')
    }
  }

  const handleNewClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Determine final loan type and term values
      const finalLoanType = newClientData.loan_type === 'other' ? newClientData.custom_loan_type.trim() : newClientData.loan_type
      const finalLoanTerm = newClientData.loan_term === 'other' ? newClientData.custom_loan_term.trim() : newClientData.loan_term
      
      // Combine loan type and term for storage
      const combinedLoanType = `${finalLoanType}_${finalLoanTerm}`

      const { error } = await supabase
  .from('clients')
  .insert({
    user_id: user?.id,
    broker_id: user?.id,
    first_name: newClientData.first_name,
    last_name: newClientData.last_name,
    email: newClientData.email,
    phone: newClientData.phone,
    loan_amount: parseFloat(newClientData.loan_amount) || null,
    loan_type: combinedLoanType,
    credit_score: parseInt(newClientData.credit_score) || null,
    target_rate: parseFloat(newClientData.target_rate) || null,
    lender: newClientData.lender,  // Add this line
    notes: newClientData.notes,
    current_stage: 'prospect',
    name: `${newClientData.first_name} ${newClientData.last_name}`.trim()
  })

      if (error) throw error

      onClientAdded()
      handleClose()
    } catch (error) {
      console.error('Error adding new client:', error)
      alert('Error adding client. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePastClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Determine final loan type and term values
      const finalLoanType = pastClientData.loan_type === 'other' ? pastClientData.custom_loan_type.trim() : pastClientData.loan_type
      const finalLoanTerm = pastClientData.loan_term === 'other' ? pastClientData.custom_loan_term.trim() : pastClientData.loan_term
      
      // Combine loan type and term for storage
      const combinedLoanType = `${finalLoanType}_${finalLoanTerm}`

      // First create the client with closed status
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: user?.id,
          broker_id: user?.id,
          first_name: pastClientData.first_name,
          last_name: pastClientData.last_name,
          email: pastClientData.email,
          phone: pastClientData.phone,
          loan_amount: parseFloat(pastClientData.loan_amount) || null,
          current_stage: 'closed',
          name: `${pastClientData.first_name} ${pastClientData.last_name}`.trim()
        })
        .select()
        .single()

      if (clientError) throw clientError

      // Then create the mortgage record
      const { error: mortgageError } = await supabase
        .from('mortgages')
        .insert({
          client_id: clientData.id,
          current_rate: parseFloat(pastClientData.current_rate),
          target_rate: parseFloat(pastClientData.target_rate),
          loan_amount: parseFloat(pastClientData.loan_amount),
          loan_type: combinedLoanType,
          term_years: pastClientData.term_years,
          start_date: pastClientData.start_date,
          lender: pastClientData.lender,
          notes: pastClientData.notes
        })

      if (mortgageError) throw mortgageError

      onClientAdded()
      handleClose()
    } catch (error) {
      console.error('Error adding past client:', error)
      alert('Error adding past client. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loanTypeOptions = [
    { value: 'conventional', label: 'Conventional' },
    { value: 'fha', label: 'FHA' },
    { value: 'va', label: 'VA' },
    { value: 'usda', label: 'USDA' },
    { value: 'jumbo', label: 'Jumbo' },
    { value: 'bank_statement', label: 'Bank Statement' },
    { value: 'asset_based', label: 'Asset-Based' },
    { value: 'non_qm', label: 'Non-QM' },
    { value: 'dscr', label: 'DSCR (Investment)' },
    { value: 'hard_money', label: 'Hard Money/Bridge' },
    { value: 'construction', label: 'Construction' },
    { value: 'land', label: 'Land/Lot' },
    { value: 'reverse', label: 'Reverse Mortgage' },
    { value: 'other', label: 'Other' }
  ]

  const loanTermOptions = [
    { value: '10yr', label: '10 Year Fixed' },
    { value: '15yr', label: '15 Year Fixed' },
    { value: '20yr', label: '20 Year Fixed' },
    { value: '25yr', label: '25 Year Fixed' },
    { value: '30yr', label: '30 Year Fixed' },
    { value: '40yr', label: '40 Year Fixed' },
    { value: 'io', label: 'Interest Only' },
    { value: 'arm', label: 'ARM (Adjustable)' },
    { value: 'other', label: 'Other' }
  ]

  const lenderOptions = [
    { value: '', label: 'Select Lender...' },
    { value: 'Wells Fargo', label: 'Wells Fargo' },
    { value: 'Chase Bank', label: 'Chase Bank' },
    { value: 'Bank of America', label: 'Bank of America' },
    { value: 'Quicken Loans', label: 'Quicken Loans' },
    { value: 'CitiMortgage', label: 'CitiMortgage' },
    { value: 'US Bank', label: 'US Bank' },
    { value: 'PNC Bank', label: 'PNC Bank' },
    { value: 'Other', label: 'Other' }
  ]

  const termOptions = [
    { value: '15', label: '15 Years' },
    { value: '20', label: '20 Years' },
    { value: '25', label: '25 Years' },
    { value: '30', label: '30 Years' }
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        currentStep === 'choose-type' ? 'Add Client' :
        currentStep === 'new-client-form' ? 'New Client - Active Pipeline' :
        'Past Client - Rate Monitor'
      }
      size="lg"
    >
      {/* Step 1: Choose Client Type */}
      {currentStep === 'choose-type' && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <p className="text-gray-600 dark:text-gray-400">
              What type of client would you like to add?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* New Client Option */}
            <button
              onClick={() => handleTypeSelection('new')}
              className="group p-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 text-left"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    New Client
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    Active pipeline prospect
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Add a new client to your active pipeline. They'll start in the "Prospect" stage and you can move them through your sales process.
              </p>
              <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                Add to Pipeline <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </button>

            {/* Past Client Option */}
            <button
              onClick={() => handleTypeSelection('past')}
              className="group p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl hover:border-green-300 dark:hover:border-green-600 transition-all duration-200 text-left"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                    Past Client
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Closed loan monitoring
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Add a client with an existing closed loan. They'll go directly to Rate Monitor for refinancing opportunity tracking.
              </p>
              <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                Add to Rate Monitor <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: New Client Form */}
      {currentStep === 'new-client-form' && (
        <form onSubmit={handleNewClientSubmit} className="space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <button
              type="button"
              onClick={() => setCurrentStep('choose-type')}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              This client will start in the "Prospect" stage
            </span>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Personal Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="First Name"
                  value={newClientData.first_name}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, first_name: e.target.value }))}
                  required
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                />
                <Input
                  label="Last Name"
                  value={newClientData.last_name}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, last_name: e.target.value }))}
                  required
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                />
                <Input
                  label="Email"
                  type="email"
                  value={newClientData.email}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={newClientData.phone}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))}
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-100 dark:border-green-800">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">Loan Preferences</h3>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
  label="Loan Amount"
  type="number"
  value={newClientData.loan_amount}
  onChange={(e) => setNewClientData(prev => ({ ...prev, loan_amount: e.target.value }))}
  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
/>

<Input
  label="Locked Rate (%)"
  type="number"
  step="0.01"
  value={newClientData.target_rate}
  onChange={(e) => setNewClientData(prev => ({ ...prev, target_rate: e.target.value }))}
  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
/>

<Input
  label="Lender"
  value={newClientData.lender}
  onChange={(e) => setNewClientData(prev => ({ ...prev, lender: e.target.value }))}
  placeholder="Enter lender name..."
  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
/>

<Input
  label="Credit Score"
  type="number"
  min="300"
  max="850"
  value={newClientData.credit_score}
  onChange={(e) => setNewClientData(prev => ({ ...prev, credit_score: e.target.value }))}
  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
/>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Select
                      label="Loan Type"
                      value={newClientData.loan_type}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, loan_type: e.target.value }))}
                      options={loanTypeOptions}
                      className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                    />
                    
                    {newClientData.loan_type === 'other' && (
                      <Input
                        label="Specify Loan Type"
                        value={newClientData.custom_loan_type}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, custom_loan_type: e.target.value }))}
                        placeholder="e.g., Portfolio, Private Lender"
                        className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                      />
                    )}
                  </div>

                  <div className="space-y-4">
                    <Select
                      label="Loan Term"
                      value={newClientData.loan_term}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, loan_term: e.target.value }))}
                      options={loanTermOptions}
                      className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                    />
                    
                    {newClientData.loan_term === 'other' && (
                      <Input
                        label="Specify Loan Term"
                        value={newClientData.custom_loan_term}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, custom_loan_term: e.target.value }))}
                        placeholder="e.g., 7/1 ARM, 5/1 ARM"
                        className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">Financial Profile</h3>
              </div>
              
              <div className="space-y-4">
                <Input
                  label="Credit Score"
                  type="number"
                  min="300"
                  max="850"
                  value={newClientData.credit_score}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, credit_score: e.target.value }))}
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-colors duration-200 px-4 py-3"
                    rows={3}
                    value={newClientData.notes}
                    onChange={(e) => setNewClientData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes about this client..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep('choose-type')}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              loading={loading}
              className="flex-1"
            >
              Add to Pipeline
            </Button>
          </div>
        </form>
      )}
      
{/* Step 3: Past Client Form */}
{currentStep === 'past-client-form' && (
        <form onSubmit={handlePastClientSubmit} className="space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <button
              type="button"
              onClick={() => setCurrentStep('choose-type')}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              This client will go directly to Rate Monitor
            </span>
          </div>

          <div className="space-y-6">
            {/* Client Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Client Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="First Name"
                  value={pastClientData.first_name}
                  onChange={(e) => setPastClientData(prev => ({ ...prev, first_name: e.target.value }))}
                  required
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                />
                <Input
                  label="Last Name"
                  value={pastClientData.last_name}
                  onChange={(e) => setPastClientData(prev => ({ ...prev, last_name: e.target.value }))}
                  required
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                />
                <Input
                  label="Email"
                  type="email"
                  value={pastClientData.email}
                  onChange={(e) => setPastClientData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={pastClientData.phone}
                  onChange={(e) => setPastClientData(prev => ({ ...prev, phone: e.target.value }))}
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Mortgage Info */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-100 dark:border-green-800">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">Existing Mortgage Details</h3>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Loan Amount"
                    type="number"
                    value={pastClientData.loan_amount}
                    onChange={(e) => setPastClientData(prev => ({ ...prev, loan_amount: e.target.value }))}
                    required
                    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                  />
                  <Input
                    label="Lender Name"
                    value={pastClientData.lender}
                    onChange={(e) => setPastClientData(prev => ({ ...prev, lender: e.target.value }))}
                    required
                    placeholder="Enter lender name..."
                    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
  label="Current Rate (%)"
  type="number"
  step="0.01"
  value={pastClientData.current_rate}
  onChange={(e) => setPastClientData(prev => ({ ...prev, current_rate: e.target.value }))}
  required
  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
/>

<Input
  label="Target Refi Rate (%)"
  type="number"
  step="0.01"
  value={pastClientData.target_rate}
  onChange={(e) => setPastClientData(prev => ({ ...prev, target_rate: e.target.value }))}
  required
  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
/>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Select
                      label="Loan Type"
                      value={pastClientData.loan_type}
                      onChange={(e) => setPastClientData(prev => ({ ...prev, loan_type: e.target.value }))}
                      options={loanTypeOptions}
                      required
                      className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                    />
                    
                    {pastClientData.loan_type === 'other' && (
                      <Input
                        label="Specify Loan Type"
                        value={pastClientData.custom_loan_type}
                        onChange={(e) => setPastClientData(prev => ({ ...prev, custom_loan_type: e.target.value }))}
                        placeholder="e.g., Portfolio, Private Lender"
                        required
                        className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                      />
                    )}
                  </div>

                  <div className="space-y-4">
                    <Select
                      label="Loan Term"
                      value={pastClientData.loan_term}
                      onChange={(e) => setPastClientData(prev => ({ ...prev, loan_term: e.target.value }))}
                      options={loanTermOptions}
                      className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                    />
                    
                    {pastClientData.loan_term === 'other' && (
                      <Input
                        label="Specify Loan Term"
                        value={pastClientData.custom_loan_term}
                        onChange={(e) => setPastClientData(prev => ({ ...prev, custom_loan_term: e.target.value }))}
                        placeholder="e.g., 7/1 ARM, 5/1 ARM"
                        required
                        className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Closing Date"
                    type="date"
                    value={pastClientData.start_date}
                    onChange={(e) => setPastClientData(prev => ({ ...prev, start_date: e.target.value }))}
                    required
                    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                  />
                  <Select
                    label="Mortgage Term (Years)"
                    value={pastClientData.term_years.toString()}
                    onChange={(e) => setPastClientData(prev => ({ ...prev, term_years: parseInt(e.target.value) }))}
                    options={termOptions}
                    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Additional Notes</h3>
              </div>
              
              <textarea
                className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-green-500 focus:ring-green-500 transition-colors duration-200 px-4 py-3 min-h-[120px]"
                rows={5}
                value={pastClientData.notes}
                onChange={(e) => setPastClientData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes about this mortgage, special terms, or important details..."
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep('choose-type')}
              className="flex-1 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-gray-300 dark:border-gray-600"
            >
              Back
            </Button>
            <Button
              type="submit"
              loading={loading}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Add to Rate Monitor
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}