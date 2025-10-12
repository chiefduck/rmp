// src/components/AutoCalling/ManualCallTrigger.tsx
import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Phone, User, Clock, AlertCircle } from 'lucide-react'
import { supabase, Client } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import BlandService from '../../lib/blandService'

interface ManualCallTriggerProps {
  isOpen: boolean
  onClose: () => void
  onCallInitiated?: () => void
}

export const ManualCallTrigger: React.FC<ManualCallTriggerProps> = ({
  isOpen,
  onClose,
  onCallInitiated
}) => {
  const { user } = useAuth()
  const { success, error: showError, info } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [callType, setCallType] = useState<'both' | 'client-only' | 'broker-only'>('client-only')
  const [callsRemaining, setCallsRemaining] = useState<number>(0)

  useEffect(() => {
    if (isOpen && user) {
      fetchClients()
      fetchCallsRemaining()
    }
  }, [isOpen, user])

  const fetchClients = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .not('phone', 'is', null)
        .is('deleted_at', null)
        .order('first_name', { ascending: true })
      
      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
      showError('Failed to load clients')
    }
  }

  const fetchCallsRemaining = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('calls_remaining')
        .eq('id', user.id)
        .single()
      
      if (error) throw error
      setCallsRemaining(data?.calls_remaining || 0)
    } catch (error) {
      console.error('Error fetching calls remaining:', error)
    }
  }

  const handleMakeCall = async () => {
    if (!selectedClientId) {
      showError('Please select a client')
      return
    }

    if (!user) {
      showError('Not authenticated')
      return
    }

    // Check if user has calls remaining
    if (callsRemaining <= 0) {
      showError('No calls remaining. Please upgrade your plan.')
      return
    }

    setLoading(true)
    
    try {
      info('Initiating call...')
      
      const result = await BlandService.makeCall({
        clientId: selectedClientId,
        userId: user.id,
        callType
      })

      if (result.success || result.brokerCallId || result.clientCallId) {
        success('Call initiated successfully!')
        
        // Show call IDs if available
        if (result.brokerCallId) {
          console.log('Broker call ID:', result.brokerCallId)
        }
        if (result.clientCallId) {
          console.log('Client call ID:', result.clientCallId)
        }
        
        // Update calls remaining
        setCallsRemaining(prev => Math.max(0, prev - (callType === 'both' ? 2 : 1)))
        
        onCallInitiated?.()
        onClose()
        
        // Reset form
        setSelectedClientId('')
        setCallType('client-only')
      } else {
        throw new Error(result.error || 'Call failed')
      }
      
    } catch (error: any) {
      console.error('Error making call:', error)
      showError(error.message || 'Failed to initiate call')
    } finally {
      setLoading(false)
    }
  }

  const selectedClient = clients.find(c => c.id === selectedClientId)

  const getCallCount = () => {
    if (callType === 'both') return 2
    return 1
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Call Client Now"
      size="md"
    >
      <div className="space-y-6">
        {/* Calls Remaining Warning */}
        {callsRemaining <= 10 && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            callsRemaining <= 0 
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          }`}>
            <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
              callsRemaining <= 0 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
            }`} />
            <div>
              <p className={`font-semibold ${
                callsRemaining <= 0 ? 'text-red-900 dark:text-red-100' : 'text-yellow-900 dark:text-yellow-100'
              }`}>
                {callsRemaining <= 0 ? 'No calls remaining!' : `Only ${callsRemaining} calls remaining`}
              </p>
              <p className={`text-sm mt-1 ${
                callsRemaining <= 0 ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'
              }`}>
                {callsRemaining <= 0 
                  ? 'Please upgrade your plan to continue making calls.' 
                  : 'Consider upgrading your plan for more calls.'}
              </p>
            </div>
          </div>
        )}

        {/* Client Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Client *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 appearance-none"
              disabled={loading}
            >
              <option value="">Choose a client...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.first_name} {client.last_name} - {client.phone}
                </option>
              ))}
            </select>
          </div>
          {clients.length === 0 && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              No clients with phone numbers found
            </p>
          )}
        </div>

        {/* Call Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Call Type *
          </label>
          <div className="space-y-3">
            <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              callType === 'client-only'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}>
              <input
                type="radio"
                name="callType"
                value="client-only"
                checked={callType === 'client-only'}
                onChange={(e) => setCallType(e.target.value as any)}
                className="mt-1"
                disabled={loading}
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  Client Only
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Call the client directly about rate opportunities (1 call)
                </div>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              callType === 'broker-only'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}>
              <input
                type="radio"
                name="callType"
                value="broker-only"
                checked={callType === 'broker-only'}
                onChange={(e) => setCallType(e.target.value as any)}
                className="mt-1"
                disabled={loading}
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  Broker Alert Only
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Alert yourself first, then decide whether to call client (1 call)
                </div>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              callType === 'both'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}>
              <input
                type="radio"
                name="callType"
                value="both"
                checked={callType === 'both'}
                onChange={(e) => setCallType(e.target.value as any)}
                className="mt-1"
                disabled={loading}
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  Both (Broker First, Then Client)
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Call you first with details, wait 2 minutes, then call client (2 calls)
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Selected Client Preview */}
        {selectedClient && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Call Preview
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Client:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedClient.first_name} {selectedClient.last_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedClient.phone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Loan Type:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedClient.loan_type}
                </span>
              </div>
              {selectedClient.target_rate && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Target Rate:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {selectedClient.target_rate}%
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-300 dark:border-gray-600">
                <span className="text-gray-600 dark:text-gray-400">Calls to use:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {getCallCount()} {getCallCount() === 1 ? 'call' : 'calls'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleMakeCall}
            loading={loading}
            disabled={!selectedClientId || callsRemaining <= 0}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <Phone className="w-4 h-4 mr-2" />
            {loading ? 'Initiating...' : 'Make Call Now'}
          </Button>
        </div>

        {/* Usage Info */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          {callsRemaining} {callsRemaining === 1 ? 'call' : 'calls'} remaining in your account
        </div>
      </div>
    </Modal>
  )
}