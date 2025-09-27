import React, { useState, useEffect } from 'react'
import { Edit, DollarSign, Percent, Calendar, Building, TrendingUp, ArrowRight, ArrowLeft, Sparkles, Save } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

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
  created_at: string
  updated_at: string
  client_name?: string
  phone?: string
  email?: string
  market_rate?: number
  savings_potential?: number
}

interface EditMortgageModalProps {
  isOpen: boolean
  onClose: () => void
  mortgage: Mortgage | null
  onMortgageUpdated: () => void
}

type Step = 'rates' | 'details' | 'review'

export const EditMortgageModal: React.FC<EditMortgageModalProps> = ({
  isOpen,
  onClose,
  mortgage,
  onMortgageUpdated
}) => {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState<Step>('rates')
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const [formData, setFormData] = useState({
    current_rate: '',
    target_rate: '',
    loan_amount: '',
    loan_type: 'conventional',
    custom_loan_type: '',
    loan_term: '30yr',
    custom_loan_term: '',
    term_years: 30,
    start_date: '',
    lender: '',
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (mortgage) {
      // Handle loan type parsing from combined format or legacy data
      const standardLoanTypes = ['conventional', 'fha', 'va', 'usda', 'jumbo', 'bank_statement', 'asset_based', 'non_qm', 'dscr', 'hard_money', 'construction', 'land', 'reverse']
      const standardLoanTerms = ['10yr', '15yr', '20yr', '25yr', '30yr', '40yr', 'io', 'arm']
      
      let loanType = 'conventional'
      let loanTerm = '30yr'
      let customLoanType = ''
      let customLoanTerm = ''
      
      if (mortgage.loan_type) {
        // Check if it's in combined format (e.g., "conventional_30yr")
        if (mortgage.loan_type.includes('_')) {
          const parts = mortgage.loan_type.split('_')
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
          if (standardLoanTypes.includes(mortgage.loan_type)) {
            loanType = mortgage.loan_type
          } else if (standardLoanTerms.includes(mortgage.loan_type)) {
            loanTerm = mortgage.loan_type
            loanType = 'conventional'
          } else {
            loanType = 'other'
            customLoanType = mortgage.loan_type
          }
        }
      }
      
      setFormData({
        current_rate: mortgage.current_rate.toString(),
        target_rate: mortgage.target_rate.toString(),
        loan_amount: mortgage.loan_amount.toString(),
        loan_type: loanType,
        custom_loan_type: customLoanType,
        loan_term: loanTerm,
        custom_loan_term: customLoanTerm,
        term_years: mortgage.term_years,
        start_date: mortgage.start_date,
        lender: mortgage.lender,
        notes: mortgage.notes || ''
      })
      setHasChanges(false)
      setCurrentStep('rates')
      setErrors({})
    }
  }, [mortgage])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setHasChanges(true)
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateStep = (step: Step): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 'rates') {
      if (!formData.current_rate || parseFloat(formData.current_rate) <= 0) {
        newErrors.current_rate = 'Current rate is required'
      }
      if (!formData.target_rate || parseFloat(formData.target_rate) <= 0) {
        newErrors.target_rate = 'Target rate is required'
      }
      if (!formData.loan_amount || parseFloat(formData.loan_amount) <= 0) {
        newErrors.loan_amount = 'Loan amount is required'
      }
      if (formData.loan_type === 'other' && !formData.custom_loan_type.trim()) {
        newErrors.custom_loan_type = 'Please specify the loan type'
      }
      if (formData.loan_term === 'other' && !formData.custom_loan_term.trim()) {
        newErrors.custom_loan_term = 'Please specify the loan term'
      }
    }

    if (step === 'details') {
      if (!formData.lender.trim()) {
        newErrors.lender = 'Lender is required'
      }
      if (!formData.start_date) {
        newErrors.start_date = 'Closing date is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 'rates') setCurrentStep('details')
      else if (currentStep === 'details') setCurrentStep('review')
    }
  }

  const handlePrevStep = () => {
    if (currentStep === 'review') setCurrentStep('details')
    else if (currentStep === 'details') setCurrentStep('rates')
  }

  const handleSubmit = async () => {
    if (!mortgage || !validateStep(currentStep)) return

    setLoading(true)

    try {
      // Determine final loan type and term values
      const finalLoanType = formData.loan_type === 'other' ? formData.custom_loan_type.trim() : formData.loan_type
      const finalLoanTerm = formData.loan_term === 'other' ? formData.custom_loan_term.trim() : formData.loan_term
      
      // Combine loan type and term for storage
      const combinedLoanType = `${finalLoanType}_${finalLoanTerm}`

      const { error } = await supabase
        .from('mortgages')
        .update({
          current_rate: parseFloat(formData.current_rate),
          target_rate: parseFloat(formData.target_rate),
          loan_amount: parseFloat(formData.loan_amount),
          loan_type: combinedLoanType,
          term_years: formData.term_years,
          start_date: formData.start_date,
          lender: formData.lender,
          notes: formData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', mortgage.id)

      if (error) throw error

      // Add update note to client_notes
      await supabase
        .from('client_notes')
        .insert({
          client_id: mortgage.client_id,
          user_id: user?.id,
          note: `Mortgage details updated - Rate: ${formData.current_rate}%, Lender: ${formData.lender}`,
          note_type: 'general'
        })

      onMortgageUpdated()
      onClose()
    } catch (error) {
      console.error('Error updating mortgage:', error)
      alert('Error updating mortgage. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // CORRECT mortgage payment calculation
  const calculateMonthlyPayment = (principal: number, annualRate: number, termYears: number) => {
    const monthlyRate = annualRate / 100 / 12
    const numPayments = termYears * 12
    
    if (monthlyRate === 0) return principal / numPayments
    
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
           (Math.pow(1 + monthlyRate, numPayments) - 1)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
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

  const steps = [
    { id: 'rates', title: 'Rates & Amount', icon: Percent, color: 'from-green-500 to-green-600' },
    { id: 'details', title: 'Loan Details', icon: Building, color: 'from-blue-500 to-blue-600' },
    { id: 'review', title: 'Review & Save', icon: TrendingUp, color: 'from-purple-500 to-purple-600' }
  ]

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)

  // Calculate live savings preview
  const currentRate = parseFloat(formData.current_rate) || 0
  const targetRate = parseFloat(formData.target_rate) || 0
  const loanAmount = parseFloat(formData.loan_amount) || 0

  const currentPayment = loanAmount > 0 && currentRate > 0 ? calculateMonthlyPayment(loanAmount, currentRate, formData.term_years) : 0
  const targetPayment = loanAmount > 0 && targetRate > 0 ? calculateMonthlyPayment(loanAmount, targetRate, formData.term_years) : 0
  const monthlySavings = Math.max(0, currentPayment - targetPayment)

  if (!mortgage) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
    >
      <div className="relative">
        {/* Premium Header with Gradient */}
        <div className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 rounded-t-2xl p-8 mb-8 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 animate-pulse" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl transform translate-x-16 -translate-y-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl transform -translate-x-12 translate-y-12" />
          
          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Edit Mortgage Details</h2>
                <p className="text-green-100">{mortgage.client_name}</p>
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
                        : 'text-green-200'
                    }
                  `}>
                    <step.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-green-200 mx-2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="px-8 pb-8">
          {/* Rates & Amount Step */}
          {currentStep === 'rates' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-100 dark:border-green-800">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <Percent className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">Interest Rates</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
  label="Current Interest Rate (%)"
  type="number"
  step="0.01"
  min="0"
  max="20"
  value={formData.current_rate}
  onChange={(e) => handleInputChange('current_rate', e.target.value)}
  error={errors.current_rate}
  required
  icon={<Percent className="w-4 h-4" />}
  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
/>

<Input
  label="Target Refi Rate (%)"
  type="number"
  step="0.01"
  min="0"
  max="20"
  value={formData.target_rate}
  onChange={(e) => handleInputChange('target_rate', e.target.value)}
  error={errors.target_rate}
  required
  icon={<Percent className="w-4 h-4" />}
  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
/>

<Input
  label="Loan Amount"
  type="number"
  min="0"
  value={formData.loan_amount}
  onChange={(e) => handleInputChange('loan_amount', e.target.value)}
  error={errors.loan_amount}
  required
  icon={<DollarSign className="w-4 h-4" />}
  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
/>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Loan Details</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <Select
    label="Loan Type"
    value={formData.loan_type}
    onChange={(e) => handleInputChange('loan_type', e.target.value)}
    options={loanTypeOptions}
    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
  />
  
  <Select
    label="Loan Term"
    value={formData.loan_term}
    onChange={(e) => handleInputChange('loan_term', e.target.value)}
    options={loanTermOptions}
    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
  />
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
  {formData.loan_type === 'other' && (
    <Input
      label="Specify Loan Type"
      value={formData.custom_loan_type}
      onChange={(e) => handleInputChange('custom_loan_type', e.target.value)}
      error={errors.custom_loan_type}
      required
      placeholder="e.g., USDA, LAND, REVERSE"
      className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
    />
  )}
  
  {formData.loan_term === 'other' && (
    <Input
      label="Specify Loan Term"
      value={formData.custom_loan_term}
      onChange={(e) => handleInputChange('custom_loan_term', e.target.value)}
      error={errors.custom_loan_term}
      required
      placeholder="e.g., 7/1 ARM, 5/1 ARM"
      className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
    />
  )}
</div>
              </div>

              {/* Live Savings Preview */}
              {monthlySavings > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">Live Savings Preview</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 backdrop-blur-sm">
                      <span className="text-gray-600 dark:text-gray-400">Monthly Savings</span>
                      <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        {formatCurrency(monthlySavings)}
                      </div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 backdrop-blur-sm">
                      <span className="text-gray-600 dark:text-gray-400">Annual Savings</span>
                      <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        {formatCurrency(monthlySavings * 12)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loan Details Step */}
          {currentStep === 'details' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Building className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Lender Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Lender Name"
                    value={formData.lender}
                    onChange={(e) => handleInputChange('lender', e.target.value)}
                    error={errors.lender}
                    required
                    icon={<Building className="w-4 h-4" />}
                    placeholder="Enter lender name..."
                    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                  />
                  <Input
                    label="Closing Date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    error={errors.start_date}
                    required
                    icon={<Calendar className="w-4 h-4" />}
                    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                  />
                </div>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                    <Edit className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Additional Notes</h3>
                </div>
                
                <textarea
                  className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200 px-4 py-3 min-h-[120px]"
                  rows={5}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Add any additional notes about this mortgage, special terms, or important details..."
                />
              </div>
            </div>
          )}

          {/* Review & Save Step */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">Review Mortgage Updates</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm">
                      <label className="text-sm text-gray-600 dark:text-gray-400">Current Rate</label>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formData.current_rate}%</p>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm">
                      <label className="text-sm text-gray-600 dark:text-gray-400">Target Rate</label>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formData.target_rate}%</p>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm">
                      <label className="text-sm text-gray-600 dark:text-gray-400">Loan Amount</label>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(parseFloat(formData.loan_amount))}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm">
                      <label className="text-sm text-gray-600 dark:text-gray-400">Lender</label>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formData.lender}</p>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm">
                      <label className="text-sm text-gray-600 dark:text-gray-400">Loan Type</label>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {formData.loan_type === 'other' ? formData.custom_loan_type : formData.loan_type.toUpperCase()}
                      </p>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm">
                      <label className="text-sm text-gray-600 dark:text-gray-400">Loan Product</label>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {formData.loan_term === 'other' ? formData.custom_loan_term : formData.loan_term.replace('yr', ' Year').replace('io', 'Interest Only').replace('arm', 'ARM')}
                      </p>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm">
                      <label className="text-sm text-gray-600 dark:text-gray-400">Term</label>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formData.term_years} Years</p>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm">
                      <label className="text-sm text-gray-600 dark:text-gray-400">Monthly Savings</label>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(monthlySavings)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Final Disclaimer */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  *Estimated Principal & Interest payments only. Does not include taxes, insurance, PMI, or closing costs. 
                  Actual savings may vary based on loan terms, fees, and market conditions.
                </p>
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
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
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