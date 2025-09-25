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
  LogOut
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'

interface SidebarProps {
  className?: string
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
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
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Rate Monitor Pro
            </h1>
            <p className="text-xs text-gray-500">Enterprise Edition</p>
          </div>
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
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left
                transition-all duration-200 group
              `}
              style={({ isActive }) => ({
                background: isActive 
                  ? 'linear-gradient(to right, #2563eb, #4f46e5)' 
                  : 'transparent',
                color: isActive ? 'white' : undefined,
                boxShadow: isActive ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : undefined
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`} />
                  <span className="font-medium">{item.label}</span>
                </>
              )}
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