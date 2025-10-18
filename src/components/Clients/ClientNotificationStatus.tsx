import React, { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { supabase, Client } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'

interface ClientNotificationStatusProps {
  client: Client
  onUpdate?: () => void
}

export function ClientNotificationStatus({ client, onUpdate }: ClientNotificationStatusProps) {
  const { success, error: showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [targetHit, setTargetHit] = useState(false)
  const [contacted, setContacted] = useState<string | null>(null)
  const [checkingRate, setCheckingRate] = useState(true)

  useEffect(() => {
    checkIfTargetHit()
    checkContactStatus()
  }, [client.id])

  const checkIfTargetHit = async () => {
    try {
      setCheckingRate(true)
      
      if (!client.target_rate) {
        setTargetHit(false)
        return
      }

      // Get client's mortgage info and current market rate
      const { data: mortgage, error: mortgageError } = await supabase
        .from('mortgages')
        .select('*')
        .eq('client_id', client.id)
        .single()

      if (mortgageError) {
        console.warn('No mortgage found for client:', client.id)
        setTargetHit(false)
        return
      }

      // Get current market rate for the client's loan type
      // Handle loan_type format like 'conventional_30yr', 'fha_30yr', 'va_30yr'
      let loanTypeForRateQuery = mortgage.loan_type || '30yr'
      
      // Extract the term part (e.g., '30yr' from 'conventional_30yr')
      if (loanTypeForRateQuery.includes('_')) {
        const parts = loanTypeForRateQuery.split('_')
        loanTypeForRateQuery = parts[parts.length - 1] // Get the last part (e.g., '30yr')
      }
      
      console.log('🔍 Looking for rate data with loan_type:', loanTypeForRateQuery, 'for mortgage:', mortgage)

      const { data: rateData, error: rateError } = await supabase
        .from('rate_history')
        .select('rate_value')
        .eq('loan_type', loanTypeForRateQuery)
        .order('rate_date', { ascending: false })
        .limit(1)
        .single()

      if (rateError || !rateData) {
        console.warn('No current rate data found')
        setTargetHit(false)
        return
      }

      // Check if current market rate is at or below target
      const currentMarketRate = rateData.rate_value
      setTargetHit(currentMarketRate <= client.target_rate)

    } catch (error) {
      console.error('Error checking target hit status:', error)
      setTargetHit(false)
    } finally {
      setCheckingRate(false)
    }
  }

  const checkContactStatus = async () => {
    try {
      // Check for broker_contacted_at field (may not exist in current schema)
      const { data: clientData, error } = await supabase
        .from('clients')
        .select('last_contact, notes')
        .eq('id', client.id)
        .single()

      if (!error && clientData) {
        // Use last_contact as a proxy for broker contact status
        setContacted(clientData.last_contact)
      }
    } catch (error) {
      console.warn('Error checking contact status:', error)
    }
  }

  const handleMarkContacted = async () => {
    // Confirmation dialog
    if (!confirm('Mark this client as contacted?')) return
    
    setLoading(true)
    try {
      // Update last_contact since broker_contacted_at may not exist
      const { error } = await supabase
        .from('clients')
        .update({ 
          last_contact: new Date().toISOString(),
          notes: `${client.notes || ''}\n[${new Date().toLocaleDateString()}] Manually marked as contacted by broker`.trim()
        })
        .eq('id', client.id)
      
      if (error) throw error
      
      // Update local state
      setContacted(new Date().toISOString())
      
      // Refresh UI
      success('Client marked as contacted')
      onUpdate?.()
    } catch (error: any) {
      console.error('Error marking client as contacted:', error)
      showError(error.message || 'Failed to mark client as contacted')
    } finally {
      setLoading(false)
    }
  }

  if (checkingRate) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">Checking rates...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {targetHit && (
        <Badge variant="success" className="text-xs">
          🎯 Target Hit
        </Badge>
      )}
      
      {contacted ? (
        <span className="text-xs text-gray-600 dark:text-gray-400">
          ✅ Contacted {formatDistanceToNow(new Date(contacted), { addSuffix: true })}
        </span>
      ) : targetHit ? (
        <>
          <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
            ⏳ Action needed
          </span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleMarkContacted}
            loading={loading}
            className="text-xs h-6 px-2 border-green-500 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
          >
            ✓ Mark Contacted
          </Button>
        </>
      ) : null}
    </div>
  )
}