import React, { createContext, useContext, useEffect } from 'react'

interface ThemeContextType {
  theme: 'dark'
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'dark' })

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always use dark mode
  const theme = 'dark' as const

  // Ensure dark class is always present on document root
  useEffect(() => {
    const root = document.documentElement
    root.classList.add('dark')
    
    // Clear any old theme from localStorage
    localStorage.removeItem('theme')
  }, [])

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  )
}