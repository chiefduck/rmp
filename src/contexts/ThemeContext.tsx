import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

interface ThemeContextType {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, updateProfile } = useAuth()
  
  // Initialize theme from localStorage or system preference
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  // Apply theme to document immediately when theme changes
  useEffect(() => {
    const root = document.documentElement
    
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme)
    
    console.log('Theme applied:', theme, 'Classes:', root.classList.toString())
  }, [theme])

  // Sync with profile theme when available
  useEffect(() => {
    if (profile?.theme && profile.theme !== theme) {
      setTheme(profile.theme)
    }
  }, [profile?.theme])

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    console.log('Toggling theme from', theme, 'to', newTheme)
    
    setTheme(newTheme)
    
    // Save to profile if available
    if (profile && updateProfile) {
      try {
        await updateProfile({ theme: newTheme })
        console.log('Theme saved to profile:', newTheme)
      } catch (error) {
        console.error('Failed to save theme preference:', error)
      }
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}