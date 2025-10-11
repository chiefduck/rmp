// src/utils/calculations.ts

/**
 * Calculate monthly mortgage payment
 * @param principal - Loan amount
 * @param annualRate - Annual interest rate (as percentage, e.g., 6.5)
 * @param termYears - Loan term in years
 * @returns Monthly payment amount
 */
export const calculateMonthlyPayment = (
    principal: number,
    annualRate: number,
    termYears: number
  ): number => {
    const monthlyRate = annualRate / 100 / 12
    const numPayments = termYears * 12
    
    if (monthlyRate === 0) return principal / numPayments
    
    const payment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
      (Math.pow(1 + monthlyRate, numPayments) - 1)
    
    return Math.round(payment)
  }
  
  /**
   * Calculate monthly savings from refinancing
   * @param loanAmount - Current loan amount
   * @param currentRate - Current interest rate
   * @param newRate - New interest rate after refi
   * @param termYears - Loan term in years
   * @returns Monthly savings amount
   */
  export const calculateMonthlySavings = (
    loanAmount: number,
    currentRate: number,
    newRate: number,
    termYears: number = 30
  ): number => {
    if (currentRate <= newRate) return 0
    
    const currentPayment = calculateMonthlyPayment(loanAmount, currentRate, termYears)
    const newPayment = calculateMonthlyPayment(loanAmount, newRate, termYears)
    
    return Math.round(currentPayment - newPayment)
  }
  
  /**
   * Calculate lifetime savings from refinancing
   * @param monthlySavings - Monthly savings amount
   * @param termYears - Remaining loan term
   * @returns Total lifetime savings
   */
  export const calculateLifetimeSavings = (
    monthlySavings: number,
    termYears: number = 30
  ): number => {
    return monthlySavings * termYears * 12
  }
  
  /**
   * Calculate total interest paid over life of loan
   * @param principal - Loan amount
   * @param annualRate - Annual interest rate
   * @param termYears - Loan term in years
   * @returns Total interest paid
   */
  export const calculateTotalInterest = (
    principal: number,
    annualRate: number,
    termYears: number
  ): number => {
    const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termYears)
    const totalPaid = monthlyPayment * termYears * 12
    return Math.round(totalPaid - principal)
  }
  
  /**
   * Calculate break-even point for refinancing
   * @param closingCosts - Total closing costs
   * @param monthlySavings - Monthly savings from refi
   * @returns Number of months to break even
   */
  export const calculateBreakEvenMonths = (
    closingCosts: number,
    monthlySavings: number
  ): number => {
    if (monthlySavings <= 0) return Infinity
    return Math.ceil(closingCosts / monthlySavings)
  }
  
  /**
   * Calculate loan-to-value ratio
   * @param loanAmount - Current loan amount
   * @param homeValue - Current home value
   * @returns LTV ratio as percentage
   */
  export const calculateLTV = (
    loanAmount: number,
    homeValue: number
  ): number => {
    if (homeValue === 0) return 0
    return (loanAmount / homeValue) * 100
  }
  
  /**
   * Calculate equity in home
   * @param homeValue - Current home value
   * @param loanAmount - Current loan amount
   * @returns Equity amount
   */
  export const calculateEquity = (
    homeValue: number,
    loanAmount: number
  ): number => {
    return Math.max(0, homeValue - loanAmount)
  }
  
  /**
   * Estimate typical closing costs
   * @param loanAmount - New loan amount
   * @returns Estimated closing costs (2-5% of loan)
   */
  export const estimateClosingCosts = (loanAmount: number): number => {
    // Typically 2-5% of loan amount, we'll use 3%
    return Math.round(loanAmount * 0.03)
  }