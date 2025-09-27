import React, { useState } from 'react'
import { CheckCircle, DollarSign, Calendar, Building, Percent } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Client } from '../../lib/supabase'

interface ClosingModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client | null
  onConfirm: (mortgageData: any) => void
}

export const ClosingModal: React.FC<ClosingModalProps> = ({
  isOpen,
  onClose,
  client,
  onConfirm
}) => {
  const [formData, setFormData] = useState({
    current_rate: client?.target_rate || '',
    target_rate: '',
    loan_amount: client?.loan_amount || '',
    term_years: 30,
    start_date: new Date().toISOString().split('T')[0],
    lender: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await onConfirm({
        ...formData,
        current_rate: parseFloat(formData.current_rate.toString()),
        target_rate: parseFloat(formData.target_rate.toString()) || parseFloat(formData.current_rate.toString()),
        loan_amount: parseFloat(formData.loan_amount.toString()),
        term_years: parseInt(formData.term_years.toString())
      })
    } catch (error) {
      console.error('Error closing loan:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

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

  if (!client) return null

  const clientName = `${client.first_name} ${client.last_name}`.trim()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🎉 Closing Loan"
      size="lg"
    >
      <div className="space-y-6">
        {/* Success Header */}
        <div className="text-center bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Congratulations! 🎉
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            You're closing <strong>{clientName}'s</strong> loan! This will move them to Rate Monitor for future refinancing opportunities.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Loan Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Final Interest Rate (%)"
              type="number"
              step="0.01"
              min="0"
              max="20"
              value={formData.current_rate}
              onChange={(e) => handleInputChange('current_rate', e.target.value)}
              required
              icon={<Percent className="w-4 h-4" />}
              placeholder="6.50"
            />

            <Input
              label="Target Rate for Refi (%)"
              type="number"
              step="0.01"
              min="0"
              max="20"
              value={formData.target_rate}
              onChange={(e) => handleInputChange('target_rate', e.target.value)}
              icon={<Percent className="w-4 h-4" />}
              placeholder="Same as final rate"
            />

            <Input
              label="Final Loan Amount"
              type="number"
              min="0"
              value={formData.loan_amount}
              onChange={(e) => handleInputChange('loan_amount', e.target.value)}
              required
              icon={<DollarSign className="w-4 h-4" />}
              placeholder="450000"
            />

            <Select
              label="Loan Term"
              value={formData.term_years.toString()}
              onChange={(e) => handleInputChange('term_years', e.target.value)}
              options={termOptions}
            />

            <Input
              label="Closing Date"
              type="date"
              value={formData.start_date}
              onChange={(e) => handleInputChange('start_date', e.target.value)}
              required
              icon={<Calendar className="w-4 h-4" />}
            />

            <Select
              label="Lender"
              value={formData.lender}
              onChange={(e) => handleInputChange('lender', e.target.value)}
              options={lenderOptions}
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Closing Notes (Optional)
            </label>
            <textarea
              className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200 px-4 py-3"
              rows={3}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any special notes about this closing..."
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <Building className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  What happens next?
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Client moves to <strong>Rate Monitor</strong> section</li>
                  <li>• You'll be notified of future refinancing opportunities</li>
                  <li>• All client history and notes are preserved</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              className="flex-1"
            >
              {loading ? 'Closing Loan...' : 'Complete Closing'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}