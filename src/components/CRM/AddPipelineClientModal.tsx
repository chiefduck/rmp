// src/components/CRM/AddPipelineClientModal.tsx
// Simplified modal for adding ACTIVE pipeline clients only (CRM page)

import React, { useState } from 'react'
import { User, DollarSign, FileText, CreditCard } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface AddPipelineClientModalProps {
  isOpen: boolean
  onClose: () => void
  onClientAdded: () => void
}

export const AddPipelineClientModal: React.FC<AddPipelineClientModalProps> = ({ 
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
    loan_type: 'conventional',
    custom_loan_type: '',
    loan_term: '30yr',
    custom_loan_term: '',
    credit_score: '',
    target_rate: '',
    lender: '',
    notes: ''
  })

  const handleReset = () => {
    setFormData({
      first_name: '', last_name: '', email: '', phone: '', loan_amount: '',
      loan_type: 'conventional', custom_loan_type: '', loan_term: '30yr',
      custom_loan_term: '', credit_score: '', target_rate: '', lender: '', notes: ''
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

      const { error } = await supabase.from('clients').insert({
        user_id: user?.id,
        broker_id: user?.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        loan_amount: formData.loan_amount ? parseFloat(formData.loan_amount) : null,
        loan_type: `${finalLoanType}_${finalLoanTerm}`,
        credit_score: formData.credit_score ? parseInt(formData.credit_score) : null,
        target_rate: formData.target_rate ? parseFloat(formData.target_rate) : null,
        lender: formData.lender,
        notes: formData.notes,
        current_stage: 'prospect',
        status: 'active',
        name: `${formData.first_name} ${formData.last_name}`.trim(),
        last_contact: new Date().toISOString() // Auto-set on creation
      })

      if (error) throw error

      onClientAdded()
      handleClose()
    } catch (error) {
      console.error('Error adding pipeline client:', error)
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

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Add Pipeline Client" 
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              Personal Information
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
            />
          </div>
        </div>

        {/* Loan Details */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-100 dark:border-green-800">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
              Loan Preferences
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Loan Amount"
                type="number"
                value={formData.loan_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, loan_amount: e.target.value }))}
                placeholder="450000"
              />
              <Input
                label="Target Rate (%)"
                type="number"
                step="0.01"
                value={formData.target_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, target_rate: e.target.value }))}
                placeholder="6.50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Lender (Optional)"
                value={formData.lender}
                onChange={(e) => setFormData(prev => ({ ...prev, lender: e.target.value }))}
                placeholder="Current or preferred lender"
              />
              <Input
                label="Credit Score"
                type="number"
                min="300"
                max="850"
                value={formData.credit_score}
                onChange={(e) => setFormData(prev => ({ ...prev, credit_score: e.target.value }))}
                placeholder="750"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <Select
                  label="Loan Type"
                  value={formData.loan_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, loan_type: e.target.value }))}
                  options={loanTypeOptions}
                />
                {formData.loan_type === 'other' && (
                  <Input
                    label="Specify Loan Type"
                    value={formData.custom_loan_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, custom_loan_type: e.target.value }))}
                    placeholder="e.g., Portfolio, Private Lender"
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
                  />
                )}
              </div>
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
              Notes (Optional)
            </h3>
          </div>
          
          <textarea
            className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors px-4 py-3 text-sm min-h-[100px]"
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Any additional notes about this client..."
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
            className="flex-1"
          >
            Add to Pipeline
          </Button>
        </div>
      </form>
    </Modal>
  )
}