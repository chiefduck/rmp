import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  Phone, 
  Settings, 
  CreditCard,
  Home,
  Moon,
  Sun,
  LogOut,
  X // ADDED: Import the 'X' icon for the close button
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'

// ADDED: An optional 'onClose' function to the props
interface SidebarProps {
  className?: string
  onClose?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '', onClose }) => {
  const { signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const navigation = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/rates', label: 'Rate Monitor', icon: BarChart3 },
    { path: '/crm', label: 'CRM', icon: Users },
    { path: '/ai-assistant', label: 'AI Assistant', icon: MessageSquare },
    { path: '/calling', label: 'Auto Calling', icon: Phone },
    { path: '/billing', label: 'Billing', icon: CreditCard },
    { path: '/settings', label: 'Settings', icon: Settings }
  ]

  return (
    <div className={`
      bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
      flex flex-col h-full ${className}
    `}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            {/* The text part of the logo is now wrapped to hide on collapsed desktop sidebar if you ever add that feature */}
            <div className="overflow-hidden">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Rate Monitor Pro
              </h1>
              <p className="text-xs text-gray-500">Enterprise Edition</p>
            </div>
          </div>

          {/* ADDED: Mobile Close Button */}
          {/* This button only appears if the 'onClose' function is provided (i.e., on mobile) */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-2 text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close sidebar"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose} // ADDED: Clicking a link also closes the mobile menu
              className={({ isActive }) => `
                w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left
                transition-all duration-200 group
                ${isActive ? 'text-white shadow-lg' : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'}
              `}
              style={({ isActive }) => ( isActive ? { background: 'linear-gradient(to right, #2563eb, #4f46e5)' } : {})}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          <span className="font-medium">
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </button>
        
        <button
          onClick={() => signOut()}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  )
}