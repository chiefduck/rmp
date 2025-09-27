import React, { useState, useEffect } from 'react'
import { User, DollarSign, Phone, Mail, CreditCard, Target, FileText, ArrowRight, ArrowLeft, Sparkles, Save, Building } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { supabase, Client } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface EditClientModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client | null
  onClientUpdated: () => void
}

type Step = 'personal' | 'financial' | 'notes'

export const EditClientModal: React.FC<EditClientModalProps> = ({
  isOpen,
  onClose,
  client,
  onClientUpdated
}) => {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState<Step>('personal')
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    loan_amount: '',
    loan_type: 'conventional',
    custom_loan_type: '',
    loan_term: '30yr',
    custom_loan_term: '',
    credit_score: '',
    target_rate: '',
    lender: '', // Add lender field
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (client) {
      // Handle loan type parsing from combined format or legacy data
      const standardLoanTypes = ['conventional', 'fha', 'va', 'usda', 'jumbo', 'bank_statement', 'asset_based', 'non_qm', 'dscr', 'hard_money', 'construction', 'land', 'reverse']
      const standardLoanTerms = ['10yr', '15yr', '20yr', '25yr', '30yr', '40yr', 'io', 'arm']
      
      let loanType = 'conventional'
      let loanTerm = '30yr'
      let customLoanType = ''
      let customLoanTerm = ''
      
      if (client.loan_type) {
        // Check if it's in combined format (e.g., "conventional_30yr")
        if (client.loan_type.includes('_')) {
          const parts = client.loan_type.split('_')
          const typePart = parts[0]
          const termPart = parts[1]
          
          if (standardLoanTypes.includes(typePart)) {
            loanType = typePart
          } else {
            loanType = 'other'
            customLoanType = typePart
          }
          
          if (standardLoanTerms.includes(termPart)) {
            loanTerm = termPart
          } else {
            loanTerm = 'other'
            customLoanTerm = termPart
          }
        } else {
          // Legacy single value - could be type or term
          if (standardLoanTypes.includes(client.loan_type)) {
            loanType = client.loan_type
          } else if (standardLoanTerms.includes(client.loan_type)) {
            loanTerm = client.loan_type
            loanType = 'conventional'
          } else {
            loanType = 'other'
            customLoanType = client.loan_type
          }
        }
      }
      
      setFormData({
        first_name: client.first_name || '',
        last_name: client.last_name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        zip: client.zip || '',
        loan_amount: client.loan_amount?.toString() || '',
        loan_type: loanType,
        custom_loan_type: customLoanType,
        loan_term: loanTerm,
        custom_loan_term: customLoanTerm,
        credit_score: client.credit_score?.toString() || '',
        target_rate: client.target_rate?.toString() || '',
        lender: client.lender || '', // Add lender field
        notes: client.notes || ''
      })
      setHasChanges(false)
      setCurrentStep('personal')
      setErrors({})
    }
  }, [client])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      return newData
    })
    setHasChanges(true)
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateStep = (step: Step): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 'personal') {
      if (!formData.first_name.trim()) newErrors.first_name = 'First name is required'
      if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required'
      if (!formData.email.trim()) newErrors.email = 'Email is required'
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 'personal') setCurrentStep('financial')
      else if (currentStep === 'financial') setCurrentStep('notes')
    }
  }

  const handlePrevStep = () => {
    if (currentStep === 'notes') setCurrentStep('financial')
    else if (currentStep === 'financial') setCurrentStep('personal')
  }

  const handleSubmit = async () => {
    if (!client || !validateStep(currentStep)) return

    setLoading(true)
    try {
      // Determine final loan type and term values
      const finalLoanType = formData.loan_type === 'other' ? formData.custom_loan_type.trim() : formData.loan_type
      const finalLoanTerm = formData.loan_term === 'other' ? formData.custom_loan_term.trim() : formData.loan_term
      
      // Combine loan type and term for storage (maintaining backward compatibility)
      const combinedLoanType = `${finalLoanType}_${finalLoanTerm}`

      const { error } = await supabase
    .from('clients')
    .update({
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      zip: formData.zip.trim(),
      loan_amount: formData.loan_amount ? parseFloat(formData.loan_amount) : null,
      loan_type: combinedLoanType,
      credit_score: formData.credit_score ? parseInt(formData.credit_score) : null,
      target_rate: formData.target_rate ? parseFloat(formData.target_rate) : null,
      lender: formData.lender.trim(), // Add lender field
      notes: formData.notes.trim(),
      name: `${formData.first_name.trim()} ${formData.last_name.trim()}`,
      updated_at: new Date().toISOString()
    })
    .eq('id', client.id)

      if (error) throw error

      // Add update note
      await supabase
        .from('client_notes')
        .insert({
          client_id: client.id,
          user_id: user?.id,
          note: 'Client information updated',
          note_type: 'general'
        })

      onClientUpdated()
      onClose()
    } catch (error) {
      console.error('Error updating client:', error)
      alert('Error updating client. Please try again.')
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

  const steps = [
    { id: 'personal', title: 'Personal Info', icon: User, color: 'from-blue-500 to-blue-600' },
    { id: 'financial', title: 'Financial Details', icon: DollarSign, color: 'from-green-500 to-green-600' },
    { id: 'notes', title: 'Notes & Review', icon: FileText, color: 'from-purple-500 to-purple-600' }
  ]

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)
  const currentStepData = steps[currentStepIndex]

  if (!client) return null

  const clientName = `${client.first_name} ${client.last_name}`.trim()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
    >
      <div className="relative">
        {/* Premium Header with Gradient */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 rounded-t-2xl p-8 mb-8 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl transform translate-x-16 -translate-y-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl transform -translate-x-12 translate-y-12" />
          
          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Edit Client Profile</h2>
                <p className="text-blue-100">{clientName}</p>
              </div>
            </div>
            
            {/* Step Progress */}
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300
                    ${currentStep === step.id 
                      ? 'bg-white/20 backdrop-blur-sm text-white scale-105' 
                      : index < currentStepIndex 
                        ? 'bg-white/10 text-white' 
                        : 'text-blue-200'
                    }
                  `}>
                    <step.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-blue-200 mx-2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="px-8 pb-8">
          {/* Personal Information Step */}
          {currentStep === 'personal' && (
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
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    error={errors.first_name}
                    required
                    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                  />
                  <Input
                    label="Last Name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    error={errors.last_name}
                    required
                    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                  />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">Contact Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    error={errors.email}
                    required
                    icon={<Mail className="w-4 h-4" />}
                    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    icon={<Phone className="w-4 h-4" />}
                    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                  />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-100 dark:border-green-800">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">Address (Optional)</h3>
                </div>
                
                <div className="space-y-4">
                  <Input
                    label="Street Address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="City"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                    />
                    <Input
                      label="State"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                    />
                    <Input
                      label="ZIP Code"
                      value={formData.zip}
                      onChange={(e) => handleInputChange('zip', e.target.value)}
                      className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Financial Information Step */}
          {currentStep === 'financial' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-100 dark:border-green-800">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">Loan Details</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Loan Amount"
                      type="number"
                      min="0"
                      value={formData.loan_amount}
                      onChange={(e) => handleInputChange('loan_amount', e.target.value)}
                      icon={<DollarSign className="w-4 h-4" />}
                      className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                      placeholder="450000"
                    />
                    <Input
                      label="Locked Rate (%)"
                      type="number"
                      step="0.01"
                      min="0"
                      max="20"
                      value={formData.target_rate}
                      onChange={(e) => handleInputChange('target_rate', e.target.value)}
                      icon={<Target className="w-4 h-4" />}
                      className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                      placeholder="6.50"
                    />
                     <Input
                       label="Lender"
                        value={formData.lender}
                        onChange={(e) => handleInputChange('lender', e.target.value)}
                        icon={<Building className="w-4 h-4" />}
                        className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                       placeholder="Wells Fargo"
                       />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Select
                        label="Loan Type"
                        value={formData.loan_type}
                        onChange={(e) => handleInputChange('loan_type', e.target.value)}
                        options={loanTypeOptions}
                        className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                      />
                      
                      {formData.loan_type === 'other' && (
                        <Input
                          label="Specify Loan Type"
                          value={formData.custom_loan_type}
                          onChange={(e) => handleInputChange('custom_loan_type', e.target.value)}
                          placeholder="e.g., Portfolio, Private Lender"
                          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                        />
                      )}
                    </div>

                    <div className="space-y-4">
                      <Select
                        label="Loan Term"
                        value={formData.loan_term}
                        onChange={(e) => handleInputChange('loan_term', e.target.value)}
                        options={loanTermOptions}
                        className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                      />
                      
                      {formData.loan_term === 'other' && (
                        <Input
                          label="Specify Loan Term"
                          value={formData.custom_loan_term}
                          onChange={(e) => handleInputChange('custom_loan_term', e.target.value)}
                          placeholder="e.g., 7/1 ARM, 5/1 ARM"
                          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Financial Profile</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                <Input
    label="Credit Score"
    type="number"
    min="300"
    max="850"
    value={formData.credit_score}
    onChange={(e) => handleInputChange('credit_score', e.target.value)}
    icon={<CreditCard className="w-4 h-4" />}
    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    placeholder="750"
  />
                </div>
              </div>
            </div>
          )}

          {/* Notes & Review Step */}
          {currentStep === 'notes' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">Additional Notes</h3>
                </div>
                
                <textarea
                  className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-purple-500 focus:ring-purple-500 transition-colors duration-200 px-4 py-3 min-h-[120px]"
                  rows={5}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Add any additional notes about this client, their preferences, or important details..."
                />
              </div>

              {/* Summary Review */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Review Changes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Name:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {formData.first_name} {formData.last_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Email:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {formData.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Loan Type:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {formData.loan_type === 'other' ? formData.custom_loan_type : formData.loan_type.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Loan Term:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {formData.loan_term === 'other' ? formData.custom_loan_term : formData.loan_term.replace('yr', ' Year').replace('io', 'Interest Only').replace('arm', 'ARM')}
                    </span>
                  </div>
                  {formData.loan_amount && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Loan Amount:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                        ${parseInt(formData.loan_amount).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {formData.credit_score && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Credit Score:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                        {formData.credit_score}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-3">
              {currentStepIndex > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevStep}
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-gray-300 dark:border-gray-600"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
              <Button
                variant="outline"
                onClick={onClose}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-gray-300 dark:border-gray-600"
              >
                Cancel
              </Button>
            </div>

            <div className="flex space-x-3">
              {currentStepIndex < steps.length - 1 ? (
                <Button
                  onClick={handleNextStep}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={!hasChanges}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}