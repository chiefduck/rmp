// src/components/RateMonitor/AddMonitoringClientModal.tsx
// Simplified modal for adding CLOSED clients to rate monitoring (Rate Monitor page)

import React, { useState } from 'react'
import { TrendingUp, DollarSign, User, FileText, Calendar } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface AddMonitoringClientModalProps {
  isOpen: boolean
  onClose: () => void
  onClientAdded: () => void
}

export const AddMonitoringClientModal: React.FC<AddMonitoringClientModalProps> = ({ 
  isOpen, 
  onClose, 
  onClientAdded 
}) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
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
    setFormData({
      first_name: '', last_name: '', email: '', phone: '', loan_amount: '',
      current_rate: '', target_rate: '', loan_type: 'conventional',
      custom_loan_type: '', loan_term: '30yr', custom_loan_term: '',
      lender: '', start_date: '', term_years: 30, notes: ''
    })
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const finalLoanType = formData.loan_type === 'other' 
        ? formData.custom_loan_type.trim() 
        : formData.loan_type
      const finalLoanTerm = formData.loan_term === 'other' 
        ? formData.custom_loan_term.trim() 
        : formData.loan_term

      // Create client record (closed status)
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: user?.id,
          broker_id: user?.id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          loan_amount: formData.loan_amount ? parseFloat(formData.loan_amount) : null,
          current_stage: 'closed',
          status: 'closed',
          name: `${formData.first_name} ${formData.last_name}`.trim(),
          last_contact: new Date().toISOString()
        })
        .select()
        .single()

      if (clientError) throw clientError

      // Create mortgage record for monitoring
      const { error: mortgageError } = await supabase
        .from('mortgages')
        .insert({
          client_id: clientData.id,
          current_rate: parseFloat(formData.current_rate),
          target_rate: parseFloat(formData.target_rate),
          loan_amount: parseFloat(formData.loan_amount),
          loan_type: `${finalLoanType}_${finalLoanTerm}`,
          term_years: formData.term_years,
          start_date: formData.start_date,
          lender: formData.lender,
          notes: formData.notes
        })

      if (mortgageError) throw mortgageError

      onClientAdded()
      handleClose()
    } catch (error) {
      console.error('Error adding monitoring client:', error)
      alert('Error adding client. Please try again.')
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
      title="Add Closed Client to Monitoring" 
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Information */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              Client Information
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.first_name}
              onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              required
            />
            <Input
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              required
            />
          </div>
        </div>

        {/* Mortgage Details */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-100 dark:border-green-800">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
              Existing Mortgage Details
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Loan Amount"
                type="number"
                value={formData.loan_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, loan_amount: e.target.value }))}
                required
                placeholder="450000"
              />
              <Input
                label="Lender Name"
                value={formData.lender}
                onChange={(e) => setFormData(prev => ({ ...prev, lender: e.target.value }))}
                required
                placeholder="Bank name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Current Rate (%)"
                type="number"
                step="0.01"
                value={formData.current_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, current_rate: e.target.value }))}
                required
                placeholder="7.25"
              />
              <Input
                label="Target Refi Rate (%)"
                type="number"
                step="0.01"
                value={formData.target_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, target_rate: e.target.value }))}
                required
                placeholder="6.50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <Select
                  label="Loan Type"
                  value={formData.loan_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, loan_type: e.target.value }))}
                  options={loanTypeOptions}
                  required
                />
                {formData.loan_type === 'other' && (
                  <Input
                    label="Specify Loan Type"
                    value={formData.custom_loan_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, custom_loan_type: e.target.value }))}
                    placeholder="e.g., Portfolio, Private Lender"
                    required
                  />
                )}
              </div>

              <div className="space-y-4">
                <Select
                  label="Loan Term"
                  value={formData.loan_term}
                  onChange={(e) => setFormData(prev => ({ ...prev, loan_term: e.target.value }))}
                  options={loanTermOptions}
                />
                {formData.loan_term === 'other' && (
                  <Input
                    label="Specify Loan Term"
                    value={formData.custom_loan_term}
                    onChange={(e) => setFormData(prev => ({ ...prev, custom_loan_term: e.target.value }))}
                    placeholder="e.g., 7/1 ARM, 5/1 ARM"
                    required
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Closing Date *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  required
                  className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-green-500 focus:ring-green-500 px-4 py-3 text-sm"
                />
              </div>
              <Select
                label="Mortgage Term (Years)"
                value={formData.term_years.toString()}
                onChange={(e) => setFormData(prev => ({ ...prev, term_years: parseInt(e.target.value) }))}
                options={termOptions}
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Additional Notes
            </h3>
          </div>
          
          <textarea
            className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-green-500 focus:ring-green-500 transition-colors px-4 py-3 text-sm min-h-[100px]"
            rows={4}
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Any additional notes about this mortgage, special terms, or important details..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            loading={loading}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            Add to Rate Monitor
          </Button>
        </div>
      </form>
    </Modal>
  )
}