// src/components/CRM/ClientDetailsModal.tsx - WITH MANUAL LOG CONTACT
import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { User, Phone, Mail, DollarSign, Calendar, MessageSquare, Plus, X, Edit, Trash2, Clock } from 'lucide-react'
import { Client, ClientNote } from '../../lib/supabase'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext' // ← ADD THIS IMPORT

interface ClientDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client | null
  onEdit: () => void
}

export const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({
  isOpen,
  onClose,
  client,
  onEdit
}) => {
  const { user } = useAuth()
  const { success: showSuccess, error: showError } = useToast() // ← ADD THIS
  const [notes, setNotes] = useState<ClientNote[]>([])
  const [loading, setLoading] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)
  const [loggingContact, setLoggingContact] = useState(false) // ← ADD THIS

  useEffect(() => {
    if (client && isOpen) {
      fetchNotes()
      setNewNote('')
    }
  }, [client, isOpen])

  useEffect(() => {
    if (!isOpen) {
      setNewNote('')
    }
  }, [isOpen])

  const fetchNotes = async () => {
    if (!client) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('client_notes')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  // 🔥 NEW: Manual Log Contact Function (with note creation)
  const handleLogContact = async () => {
    if (!client || !user) return
    
    setLoggingContact(true)
    try {
      // Update last_contact timestamp
      const { error: updateError } = await supabase
        .from('clients')
        .update({ 
          last_contact: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', client.id)
      
      if (updateError) throw updateError
      
      // Create a note to track the manual contact log
      const { error: noteError } = await supabase
        .from('client_notes')
        .insert({
          client_id: client.id,
          user_id: user.id,
          note: 'Manual contact logged',
          note_type: 'general'
        })
      
      if (noteError) throw noteError
      
      // Update local client object
      if (client) {
        client.last_contact = new Date().toISOString()
      }
      
      // Refresh notes to show the new one
      await fetchNotes()
      
      showSuccess('Contact logged successfully! ✓')
    } catch (error) {
      console.error('Error logging contact:', error)
      showError('Failed to log contact. Please try again.')
    } finally {
      setLoggingContact(false)
    }
  }

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!client || !user || !newNote.trim()) return

    setAddingNote(true)
    try {
      const { error } = await supabase
        .from('client_notes')
        .insert({
          client_id: client.id,
          user_id: user.id,
          note: newNote.trim(),
          note_type: 'general'
        })

      if (error) throw error
      
      setNewNote('')
      await fetchNotes()
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Error adding note. Please try again.')
    } finally {
      setAddingNote(false)
    }
  }

  const deleteNote = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return
    }

    setDeletingNoteId(noteId)
    try {
      const { error } = await supabase
        .from('client_notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error
      
      setNotes(prev => prev.filter(note => note.id !== noteId))
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Failed to delete note. Please try again.')
    } finally {
      setDeletingNoteId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount?: number) => {
    return amount ? new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount) : 'N/A'
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'prospect': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'qualified': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'application': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
      case 'processing': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
      case 'closing': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'closed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'stage_change': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'call': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'email': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
      case 'meeting': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
      case 'follow_up': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
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

  if (!client) return null

  const clientName = `${client.first_name} ${client.last_name}`.trim()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Client Details & History" size="xl">
      <div className="space-y-6">
        {/* Header - Matches MortgageDetailsModal */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white font-bold text-base sm:text-lg">
                  {clientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100 truncate">
                  {clientName}
                </h2>
                <p className="text-sm sm:text-base text-blue-600 dark:text-blue-300 truncate">
                  {formatLoanTypeDisplay(client.loan_type)} • {client.lender || 'No lender set'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStageColor(client.current_stage)}`}>
                    {client.current_stage}
                  </span>
                  {client.credit_score && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      Credit: {client.credit_score}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 🔥 UPDATED: Action Buttons - Added Log Contact */}
            <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`tel:${client.phone}`)}
                className="flex-1 sm:flex-none bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:border-green-800 dark:text-green-300 min-h-[44px]"
              >
                <Phone className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Call</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`mailto:${client.email}`)}
                className="flex-1 sm:flex-none bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300 min-h-[44px]"
              >
                <Mail className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Email</span>
              </Button>
              
              {/* 🔥 NEW: Log Contact Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogContact}
                loading={loggingContact}
                className="flex-1 sm:flex-none bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:border-orange-800 dark:text-orange-300 min-h-[44px]"
              >
                <Clock className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Log Contact</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="min-h-[44px]"
              >
                <Edit className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Client Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Contact</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Email</label>
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                  {client.email || 'Not provided'}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Phone</label>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {client.phone || 'Not provided'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
            <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">Loan Details</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-purple-600 dark:text-purple-400">Loan Amount</label>
                <p className="font-semibold text-purple-900 dark:text-purple-100">
                  {formatCurrency(client.loan_amount)}
                </p>
              </div>
              <div>
                <label className="text-xs text-purple-600 dark:text-purple-400">Lender</label>
                <p className="font-semibold text-purple-900 dark:text-purple-100">
                  {client.lender || 'Not set'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Rate Info</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-blue-600 dark:text-blue-400">Target Rate</label>
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  {client.target_rate ? `${client.target_rate}%` : 'Not set'}
                </p>
              </div>
              <div>
                <label className="text-xs text-blue-600 dark:text-blue-400">Credit Score</label>
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  {client.credit_score || 'Not set'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">Activity</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-green-600 dark:text-green-400">Last Contact</label>
                <p className="font-semibold text-green-900 dark:text-green-100 text-sm">
                  {client.last_contact ? new Date(client.last_contact).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}
                </p>
              </div>
              <div>
                <label className="text-xs text-green-600 dark:text-green-400">Total Notes</label>
                <p className="font-semibold text-green-900 dark:text-green-100">
                  {notes.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <MessageSquare className="w-6 h-6 mr-3" />
              Notes & Activity
            </h3>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {notes.length} {notes.length === 1 ? 'note' : 'notes'}
              </span>
            </div>
          </div>

          {/* Add Note */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-6 mb-6">
            <form onSubmit={addNote} className="space-y-4">
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
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading notes...</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No notes yet</h4>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto px-4">
                  Start tracking your communication with this client by adding your first note above.
                </p>
              </div>
            ) : (
              notes.map((note, index) => (
                <div key={note.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${getNoteTypeColor(note.note_type)}`}>
                          {note.note_type.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(note.created_at)}
                        </span>
                        {index === 0 && (
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                            Latest
                          </span>
                        )}
                      </div>

                      {note.note_type === 'stage_change' && note.previous_stage && note.new_stage && (
                        <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Stage Change:</strong> {note.previous_stage} → {note.new_stage}
                          </p>
                        </div>
                      )}

                      <p className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap break-words">
                        {note.note}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => deleteNote(note.id)}
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
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}