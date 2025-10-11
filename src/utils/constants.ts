// src/utils/constants.ts

/**
 * Loan type labels for display
 */
export const LOAN_TYPE_LABELS: Record<string, string> = {
    conventional: '30-Year Fixed',
    '15yr': '15-Year Fixed',
    fha: 'FHA Loan',
    va: 'VA Loan',
    jumbo: 'Jumbo Loan',
    arm: 'Adjustable Rate'
  }
  
  /**
   * Loan type descriptions
   */
  export const LOAN_TYPE_DESCRIPTIONS: Record<string, string> = {
    conventional: 'Standard fixed-rate mortgage for qualified borrowers with good credit',
    '15yr': 'Shorter term with higher monthly payments but less interest paid overall',
    fha: 'Government-backed loan with lower down payment requirements',
    va: 'Zero down payment loan for eligible veterans and service members',
    jumbo: 'For loan amounts exceeding conforming loan limits',
    arm: 'Variable interest rate that adjusts periodically'
  }
  
  /**
   * Pipeline stage labels
   */
  export const PIPELINE_STAGES: Record<string, string> = {
    prospect: 'Prospect',
    qualified: 'Qualified',
    application: 'Application',
    processing: 'Processing',
    underwriting: 'Underwriting',
    clear_to_close: 'Clear to Close',
    closed: 'Closed',
    dead: 'Dead'
  }
  
  /**
   * Pipeline stage colors for badges
   */
  export const STAGE_COLORS: Record<string, string> = {
    prospect: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    qualified: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    application: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    underwriting: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    clear_to_close: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    closed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    dead: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  }
  
  /**
   * Contact temperature thresholds (in days)
   */
  export const CONTACT_THRESHOLDS = {
    STALE: 14, // No contact in 14+ days
    COLD: 30, // No contact in 30+ days
    HOT: 7 // Contact within 7 days
  }
  
  /**
   * Rate monitoring thresholds
   */
  export const RATE_THRESHOLDS = {
    TARGET_PROXIMITY: 0.25, // Within 0.25% of target
    STALE_MONITORING: 60, // 60+ days without action
    SIGNIFICANT_CHANGE: 0.1 // 0.1% change is significant
  }
  
  /**
   * Refresh intervals (in milliseconds)
   */
  export const REFRESH_INTERVALS = {
    RATES: 15 * 60 * 1000, // 15 minutes
    CLIENTS: 5 * 60 * 1000, // 5 minutes
    ALERTS: 10 * 60 * 1000 // 10 minutes
  }
  
  /**
   * UI Configuration
   */
  export const UI_CONFIG = {
    CARDS_PER_PAGE: 12,
    MAX_RECENT_CLIENTS: 5,
    MAX_ALERTS_DISPLAY: 5,
    DEBOUNCE_SEARCH_MS: 300
  }
  
  /**
   * Validation rules
   */
  export const VALIDATION = {
    MIN_LOAN_AMOUNT: 50000,
    MAX_LOAN_AMOUNT: 10000000,
    MIN_RATE: 0.1,
    MAX_RATE: 20,
    MIN_TERM_YEARS: 5,
    MAX_TERM_YEARS: 40
  }
  
  /**
   * Date formats
   */
  export const DATE_FORMATS = {
    DISPLAY: 'MMM d, yyyy',
    DISPLAY_WITH_TIME: 'MMM d, yyyy h:mm a',
    ISO: 'yyyy-MM-dd',
    INPUT: 'yyyy-MM-dd'
  }
  
  /**
   * Success messages
   */
  export const SUCCESS_MESSAGES = {
    CLIENT_ADDED: 'Client added successfully!',
    CLIENT_UPDATED: 'Client updated successfully!',
    CLIENT_DELETED: 'Client deleted successfully!',
    MORTGAGE_ADDED: 'Mortgage added to monitoring!',
    MORTGAGE_UPDATED: 'Mortgage details updated!',
    MORTGAGE_DELETED: 'Mortgage removed from monitoring',
    RATES_REFRESHED: '✅ Rates updated successfully!',
    NOTE_ADDED: 'Note added successfully!'
  }
  
  /**
   * Error messages
   */
  export const ERROR_MESSAGES = {
    GENERIC: 'Something went wrong. Please try again.',
    NETWORK: 'Network error. Check your connection.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    NOT_FOUND: 'The requested resource was not found.',
    VALIDATION: 'Please check your input and try again.'
  }