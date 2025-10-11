// src/utils/formatters.ts

/**
 * Format a date object to a readable string with time
 * @param date - Date object to format
 * @returns Formatted string like "Oct 11, 2025, 2:30 PM"
 */
export const formatDateTime = (date: Date): string => {
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    })
  }
  
  /**
   * Format a date string to readable format
   * @param dateString - ISO date string
   * @returns Formatted string like "Oct 11, 2025"
   */
  export const formatDateOnly = (dateString: string): string => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }
  
  /**
   * Format a number as currency
   * @param amount - Number to format
   * @returns Formatted string like "$1,234.56"
   */
  export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  /**
   * Format a number as currency with cents
   * @param amount - Number to format
   * @returns Formatted string like "$1,234.56"
   */
  export const formatCurrencyWithCents = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }
  
  /**
   * Format a percentage
   * @param value - Percentage value
   * @param decimals - Number of decimal places (default: 2)
   * @returns Formatted string like "5.25%"
   */
  export const formatPercent = (value: number, decimals: number = 2): string => {
    return `${value.toFixed(decimals)}%`
  }
  
  /**
   * Format a phone number
   * @param phone - Phone number string
   * @returns Formatted string like "(555) 123-4567"
   */
  export const formatPhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`
    }
    return phone
  }
  
  /**
   * Get relative time string
   * @param date - Date to compare
   * @returns String like "2 days ago" or "in 3 hours"
   */
  export const getRelativeTime = (date: Date | string): string => {
    const now = new Date()
    const then = typeof date === 'string' ? new Date(date) : date
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
  
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    
    return formatDateOnly(then.toISOString().split('T')[0])
  }
  
  /**
   * Truncate text with ellipsis
   * @param text - Text to truncate
   * @param maxLength - Maximum length
   * @returns Truncated string
   */
  export const truncate = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + '...'
  }