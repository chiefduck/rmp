import React, { useState, useEffect } from 'react'
import { MessageSquare, Calendar, DollarSign, TrendingUp, Phone, Mail, Edit, Trash2, Plus, X } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
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
  loan_type?: string
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

interface ClientNote {
  id: string
  note: string
  note_type: string
  created_at: string
  previous_stage?: string
  new_stage?: string
}

interface MortgageDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  mortgage: Mortgage | null
  onEdit: (mortgage: Mortgage) => void
  onDelete: (mortgage: Mortgage) => void
}

export const MortgageDetailsModal: React.FC<MortgageDetailsModalProps> = ({
  isOpen,
  onClose,
  mortgage,
  onEdit,
  onDelete
}) => {
  const { user } = useAuth()
  const [clientNotes, setClientNotes] = useState<ClientNote[]>([])
  const [loading, setLoading] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)

  useEffect(() => {
    if (mortgage && isOpen) {
      fetchClientNotes()
    }
  }, [mortgage, isOpen])

  const fetchClientNotes = async () => {
    if (!mortgage) return

    try {
      const { data, error } = await supabase
        .from('client_notes')
        .select('*')
        .eq('client_id', mortgage.client_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setClientNotes(data || [])
    } catch (error) {
      console.error('Error fetching client notes:', error)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim() || !mortgage) return

    setAddingNote(true)
    try {
      const { error } = await supabase
        .from('client_notes')
        .insert({
          client_id: mortgage.client_id,
          user_id: user?.id,
          note: newNote.trim(),
          note_type: 'general'
        })

      if (error) throw error

      setNewNote('')
      fetchClientNotes()
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Error adding note. Please try again.')
    } finally {
      setAddingNote(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this note? This action cannot be undone.')
    if (!confirmed) return

    setDeletingNoteId(noteId)
    try {
      const { error } = await supabase
        .from('client_notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error
      
      setClientNotes(prev => prev.filter(note => note.id !== noteId))
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Error deleting note. Please try again.')
    } finally {
      setDeletingNoteId(null)
    }
  }

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'stage_change': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'call': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'email': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
      case 'meeting': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getOpportunityStatus = (currentRate: number, targetRate: number, monthlySavings: number) => {
    if (monthlySavings >= 300) {
      return {
        text: 'Excellent Opportunity',
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      }
    } else if (monthlySavings >= 150) {
      return {
        text: 'Good Opportunity',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      }
    } else if (monthlySavings >= 50) {
      return {
        text: 'Monitor Rates',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      }
    } else {
      return {
        text: 'Not Worth Pursuing',
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
      }
    }
  }

  const formatLoanTypeDisplay = (loanType?: string) => {
    if (!loanType) return 'N/A'
    
    if (loanType.includes('_')) {
      const [type, term] = loanType.split('_')
      const formattedType = type.toUpperCase()
      const formattedTerm = term.replace('yr', ' Year').replace('io', 'Interest Only').replace('arm', 'ARM')
      return `${formattedType} ${formattedTerm}`
    }
    return loanType.toUpperCase()
  }

  if (!mortgage) return null

  const currentMonthlyPayment = calculateMonthlyPayment(mortgage.loan_amount, mortgage.current_rate, mortgage.term_years)
  const targetMonthlyPayment = calculateMonthlyPayment(mortgage.loan_amount, mortgage.target_rate, mortgage.term_years)
  const potentialSavings = currentMonthlyPayment - targetMonthlyPayment
  const opportunityStatus = getOpportunityStatus(mortgage.current_rate, mortgage.target_rate, potentialSavings)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mortgage Details & History"
      size="xl"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white font-bold text-base sm:text-lg">
                  {mortgage.client_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100 truncate">
                  {mortgage.client_name}
                </h2>
                <p className="text-sm sm:text-base text-green-600 dark:text-green-300 truncate">
                  {formatLoanTypeDisplay(mortgage.loan_type)} • {mortgage.lender} • {mortgage.term_years}-Year Loan
                </p>
                <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 mt-1">
                  Closed: {formatDate(mortgage.start_date)}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`tel:${mortgage.phone}`)}
                className="flex-1 sm:flex-none bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:border-green-800 dark:text-green-300 min-h-[44px]"
              >
                <Phone className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Call</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`mailto:${mortgage.email}`)}
                className="flex-1 sm:flex-none bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300 min-h-[44px]"
              >
                <Mail className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Email</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(mortgage)}
                className="min-h-[44px]"
              >
                <Edit className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(mortgage)}
                className="min-h-[44px]"
              >
                <Trash2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mortgage Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Current Loan Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Current Loan</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Loan Amount</label>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(mortgage.loan_amount)}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Interest Rate</label>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {mortgage.current_rate}%
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">P&I Payment*</label>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(currentMonthlyPayment)}
                </p>
              </div>
            </div>
          </div>

          {/* Target Refi Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Target Refinance</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-blue-600 dark:text-blue-400">Target Rate</label>
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  {mortgage.target_rate}%
                </p>
              </div>
              <div>
                <label className="text-xs text-blue-600 dark:text-blue-400">New P&I Payment*</label>
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  {formatCurrency(targetMonthlyPayment)}
                </p>
              </div>
              <div>
                <label className="text-xs text-blue-600 dark:text-blue-400">Market Rate</label>
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  {mortgage.market_rate || 'N/A'}%
                </p>
              </div>
            </div>
          </div>

          {/* Refi Eligibility */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
            <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">Refi Eligibility</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-purple-600 dark:text-purple-400">Eligible Date</label>
                <p className="font-semibold text-purple-900 dark:text-purple-100">
                  {mortgage.refi_eligible_date 
                    ? formatDate(mortgage.refi_eligible_date)
                    : 'Not set'
                  }
                </p>
              </div>
              <div>
                <label className="text-xs text-purple-600 dark:text-purple-400">Status</label>
                <p className="font-semibold text-purple-900 dark:text-purple-100">
                  {(() => {
                    if (!mortgage.refi_eligible_date) return 'Unknown'
                    const today = new Date()
                    const refiDate = new Date(mortgage.refi_eligible_date)
                    const daysUntil = Math.ceil((refiDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    
                    if (daysUntil <= 0) return '✅ Eligible Now'
                    if (daysUntil <= 30) return `⏰ ${daysUntil} days`
                    return `📅 ${daysUntil} days`
                  })()}
                </p>
              </div>
            </div>
          </div>

          {/* Savings Opportunity */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">Potential Savings*</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-green-600 dark:text-green-400">Monthly Savings</label>
                <p className="font-semibold text-green-900 dark:text-green-100">
                  {formatCurrency(Math.max(0, potentialSavings))}
                </p>
              </div>
              <div>
                <label className="text-xs text-green-600 dark:text-green-400">Annual Savings</label>
                <p className="font-semibold text-green-900 dark:text-green-100">
                  {formatCurrency(Math.max(0, potentialSavings) * 12)}
                </p>
              </div>
              <div>
                <label className="text-xs text-green-600 dark:text-green-400">Opportunity Status</label>
                <div className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${opportunityStatus.color}`}>
                  {opportunityStatus.text}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3">
          <p className="text-xs text-yellow-800 dark:text-yellow-300">
            *Estimated Principal & Interest payments only. Does not include taxes, insurance, PMI, or closing costs. 
            Actual savings may vary based on loan terms, fees, and market conditions.
          </p>
        </div>

        {/* Notes Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <MessageSquare className="w-6 h-6 mr-3" />
              Client Notes & Activity
            </h3>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {clientNotes.length} {clientNotes.length === 1 ? 'note' : 'notes'}
              </span>
            </div>
          </div>

          {/* Add New Note */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-6 mb-6">
            <form onSubmit={handleAddNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add New Note
                </label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a detailed note about this client, communication log, or important update..."
                  className="block w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200 px-4 py-3 min-h-[100px] text-base"
                  rows={4}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={addingNote}
                  disabled={!newNote.trim()}
                  size="sm"
                  className="min-h-[44px]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </form>
          </div>

          {/* Notes List */}
          <div className="space-y-4">
            {clientNotes.map((note, index) => (
              <div key={note.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${getNoteTypeColor(note.note_type)}`}>
                        {note.note_type.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDateTime(note.created_at)}
                      </span>
                      {index === 0 && (
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                          Latest
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900 dark:text-gray-100 leading-relaxed break-words">
                      {note.note}
                    </p>
                    {note.previous_stage && note.new_stage && (
                      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <strong>Stage Change:</strong> {note.previous_stage} → {note.new_stage}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Delete Note Button */}
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    disabled={deletingNoteId === note.id}
                    className="flex-shrink-0 p-2 sm:p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Delete note"
                  >
                    {deletingNoteId === note.id ? (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}

            {clientNotes.length === 0 && (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No notes yet</h4>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto px-4">
                  Start tracking your communication with this client by adding your first note above. 
                  Include call logs, meeting summaries, or important updates.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}