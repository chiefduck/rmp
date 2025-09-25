import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface AddClientModalProps {
  isOpen: boolean
  onClose: () => void
  onClientAdded: () => void
}

export const AddClientModal: React.FC<AddClientModalProps> = ({
  isOpen,
  onClose,
  onClientAdded
}) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    target_rate: '',
    loan_amount: '',
    loan_type: '30yr',
    credit_score: '',
    current_stage: 'prospect',
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          target_rate: formData.target_rate ? parseFloat(formData.target_rate) : null,
          loan_amount: formData.loan_amount ? parseFloat(formData.loan_amount) : null,
          loan_type: formData.loan_type as any,
          credit_score: formData.credit_score ? parseInt(formData.credit_score) : null,
          current_stage: formData.current_stage as any,
          notes: formData.notes || null
        })

      if (error) throw error

      onClientAdded()
      onClose()
      setFormData({
        name: '',
        email: '',
        phone: '',
        target_rate: '',
        loan_amount: '',
        loan_type: '30yr',
        credit_score: '',
        current_stage: 'prospect',
        notes: ''
      })
    } catch (error) {
      console.error('Error adding client:', error)
    } finally {
      setLoading(false)
    }
  }

  const loanTypeOptions = [
    { value: '30yr', label: '30-Year Fixed' },
    { value: 'fha', label: 'FHA Loan' },
    { value: 'va', label: 'VA Loan' },
    { value: '15yr', label: '15-Year Fixed' }
  ]

  const stageOptions = [
    { value: 'prospect', label: 'Prospect' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'application', label: 'Application' },
    { value: 'closed', label: 'Closed' }
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Client" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Target Rate (%)"
            type="number"
            step="0.001"
            value={formData.target_rate}
            onChange={(e) => setFormData({ ...formData, target_rate: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Loan Amount ($)"
            type="number"
            value={formData.loan_amount}
            onChange={(e) => setFormData({ ...formData, loan_amount: e.target.value })}
          />
          <Input
            label="Credit Score"
            type="number"
            value={formData.credit_score}
            onChange={(e) => setFormData({ ...formData, credit_score: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Loan Type"
            value={formData.loan_type}
            onChange={(e) => setFormData({ ...formData, loan_type: e.target.value })}
            options={loanTypeOptions}
          />
          <Select
            label="Current Stage"
            value={formData.current_stage}
            onChange={(e) => setFormData({ ...formData, current_stage: e.target.value })}
            options={stageOptions}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Add Client
          </Button>
        </div>
      </form>
    </Modal>
  )
}