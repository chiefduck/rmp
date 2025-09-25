import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = false 
}) => {
  return (
    <div className={`
      bg-white dark:bg-gray-800 
      rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700
      ${hover ? 'hover:shadow-lg hover:scale-[1.02] transition-all duration-200' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`p-6 pb-4 ${className}`}>
    {children}
  </div>
)

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`px-6 pb-6 ${className}`}>
    {children}
  </div>
)

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <h3 className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${className}`}>
    {children}
  </h3>
)