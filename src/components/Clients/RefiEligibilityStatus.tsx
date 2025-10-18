import React, { useState, useEffect } from 'react'
import { format, differenceInDays } from 'date-fns'
import { Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { supabase, Client } from '../../lib/supabase'

interface Mortgage {
  id: string
  client_id: string
  refi_eligible_date?: string
  loan_type: string
  loan_amount: number
  start_date: string
  lender: string
}

interface RefiEligibilityStatusProps {
  client: Client
  compact?: boolean
}

export function RefiEligibilityStatus({ client, compact = false }: RefiEligibilityStatusProps) {
  const [mortgage, setMortgage] = useState<Mortgage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMortgageData()
  }, [client.id])

  const fetchMortgageData = async () => {
    try {
      setLoading(true)
      
      const { data: mortgageData, error } = await supabase
        .from('mortgages')
        .select('id, client_id, refi_eligible_date, loan_type, loan_amount, start_date, lender')
        .eq('client_id', client.id)
        .single()

      console.log('📊 Fetched mortgage data for client:', client.id, mortgageData)
      console.log('📅 Refi eligible date:', mortgageData?.refi_eligible_date)

      if (error) {
        console.warn('No mortgage found for client:', client.id, error)
        setMortgage(null)
        return
      }

      setMortgage(mortgageData)
    } catch (error) {
      console.error('Error fetching mortgage data:', error)
      setMortgage(null)
    } finally {
      setLoading(false)
    }
  }

  const getRefiStatus = () => {
    if (!mortgage?.refi_eligible_date || mortgage.refi_eligible_date === null || mortgage.refi_eligible_date === '') {
      console.log('🚫 No refi eligible date found for mortgage:', mortgage?.id)
      return {
        status: 'not_set',
        text: 'Not Set',
        icon: AlertCircle,
        badgeVariant: 'secondary' as const,
        textColor: 'text-gray-600 dark:text-gray-400'
      }
    }
    
    try {
      const today = new Date()
      const refiDate = new Date(mortgage.refi_eligible_date)
      
      // Check if date is valid
      if (isNaN(refiDate.getTime())) {
        console.error('🚫 Invalid refi eligible date:', mortgage.refi_eligible_date)
        return {
          status: 'not_set',
          text: 'Invalid Date',
          icon: AlertCircle,
          badgeVariant: 'error' as const,
          textColor: 'text-red-600 dark:text-red-400'
        }
      }
      
      const daysUntilEligible = differenceInDays(refiDate, today)
      console.log('📅 Refi status calculation:', {
        today: today.toISOString(),
        refiDate: refiDate.toISOString(),
        daysUntilEligible
      })
      
      if (daysUntilEligible <= 0) {
        return {
          status: 'eligible',
          text: 'Eligible Now',
          icon: CheckCircle,
          badgeVariant: 'success' as const,
          textColor: 'text-green-600 dark:text-green-400'
        }
      } else if (daysUntilEligible <= 30) {
        return {
          status: 'soon',
          text: `Eligible in ${daysUntilEligible} day${daysUntilEligible === 1 ? '' : 's'}`,
          icon: Clock,
          badgeVariant: 'warning' as const,
          textColor: 'text-yellow-600 dark:text-yellow-400'
        }
      } else {
        return {
          status: 'waiting',
          text: `Eligible in ${daysUntilEligible} days`,
          icon: Calendar,
          badgeVariant: 'secondary' as const,
          textColor: 'text-gray-600 dark:text-gray-400'
        }
      }
    } catch (error) {
      console.error('🚫 Error calculating refi status:', error)
      return {
        status: 'not_set',
        text: 'Error',
        icon: AlertCircle,
        badgeVariant: 'error' as const,
        textColor: 'text-red-600 dark:text-red-400'
      }
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-50/50 dark:bg-gray-700/50 rounded-lg p-3 backdrop-blur-sm">
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium">Refi Eligibility</span>
        </div>
        <div className="mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">Loading...</span>
        </div>
      </div>
    )
  }

  if (!mortgage) {
    return (
      <div className="bg-gray-50/50 dark:bg-gray-700/50 rounded-lg p-3 backdrop-blur-sm">
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium">Refi Eligibility</span>
        </div>
        <div className="mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">No mortgage data</span>
        </div>
      </div>
    )
  }

  const refiStatus = getRefiStatus()
  const StatusIcon = refiStatus.icon

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-gray-700/60 to-gray-700/40 rounded-lg p-2.5 border border-gray-600/50 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide truncate">
            Refi Eligible
          </span>
          <Badge variant={refiStatus.badgeVariant} className="flex items-center gap-1 text-xs shrink-0">
            <StatusIcon className="w-3 h-3" />
            {refiStatus.text}
          </Badge>
        </div>
        {mortgage.refi_eligible_date && (
          <div className="mt-1">
            <span className={`text-xs font-medium ${refiStatus.textColor}`}>
              {format(new Date(mortgage.refi_eligible_date), 'MMM d, yyyy')}
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-gray-50/50 dark:bg-gray-700/50 rounded-lg p-3 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium">Refi Eligibility</span>
        </div>
        
        <Badge variant={refiStatus.badgeVariant} className="flex items-center gap-1 text-xs">
          <StatusIcon className="w-3 h-3" />
          {refiStatus.text}
        </Badge>
      </div>
      
      {mortgage.refi_eligible_date && (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Eligible Date:
          </span>
          <span className={`text-xs font-medium ${refiStatus.textColor}`}>
            {format(new Date(mortgage.refi_eligible_date), 'MMM d, yyyy')}
          </span>
        </div>
      )}
    </div>
  )
}