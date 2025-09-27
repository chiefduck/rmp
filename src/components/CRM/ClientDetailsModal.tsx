import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import { User, Phone, Mail, DollarSign, Calendar, MessageSquare, Plus, Trash2 } from 'lucide-react'
import { Client, ClientNote } from '../../lib/supabase'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

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
  const [notes, setNotes] = useState<ClientNote[]>([])
  const [loading, setLoading] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  useEffect(() => {
    if (client && isOpen) {
      fetchNotes()
      setNewNote('') // Clear note input when modal opens
    }
  }, [client, isOpen])

  // Clear note input when modal closes
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

  const addNote = async () => {
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
    } finally {
      setAddingNote(false)
    }
  }

  const deleteNote = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('client_notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error
      
      // Remove from local state immediately
      setNotes(prev => prev.filter(note => note.id !== noteId))
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Failed to delete note. Please try again.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
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
      case 'closed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'stage_change': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
      case 'call': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'email': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'meeting': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
      case 'follow_up': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  if (!client) return null

  const clientName = `${client.first_name} ${client.last_name}`.trim()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Client Details" size="xl">
      <div className="space-y-6">
        {/* Client Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {clientName}
              </h2>
              <div className="flex items-center space-x-4 mt-1">
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStageColor(client.current_stage)}`}>
                  {client.current_stage}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {client.loan_type.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          <Button onClick={onEdit}>
            Edit Client
          </Button>
        </div>

        {/* Client Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {client.email || 'Not provided'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {client.phone || 'Not provided'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Loan Amount</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(client.loan_amount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Target Rate</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {client.target_rate ? `${client.target_rate}%` : 'Not set'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Notes & Activity</span>
            </h3>
          </div>

          {/* Add Note */}
          <div className="mb-6">
            <div className="flex space-x-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note about this client..."
                rows={3}
                className="flex-1 rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
              />
              <Button
                onClick={addNote}
                loading={addingNote}
                disabled={!newNote.trim()}
                className="self-start"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Note
              </Button>
            </div>
          </div>

          {/* Notes List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading notes...</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No notes yet. Add the first note above.</p>
              </div>
            ) : (
              notes.map((note) => (
                <Card key={note.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium capitalize ${getNoteTypeColor(note.note_type)}`}>
                          {note.note_type.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(note.created_at)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNote(note.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 h-10 w-10"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                    
                    {note.note_type === 'stage_change' && note.previous_stage && note.new_stage && (
                      <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                        Stage changed from <span className="font-medium">{note.previous_stage}</span> to <span className="font-medium">{note.new_stage}</span>
                      </div>
                    )}
                    
                    <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {note.note}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}