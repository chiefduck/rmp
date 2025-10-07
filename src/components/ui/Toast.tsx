import React, { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  id: string
  type: ToastType
  message: string
  duration?: number
  onClose: (id: string) => void
}

export const Toast: React.FC<ToastProps> = ({ id, type, message, duration = 5000, onClose }) => {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => onClose(id), 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-900/90',
          border: 'border-green-700',
          icon: <CheckCircle className="w-5 h-5 text-green-400" />,
          text: 'text-green-100'
        }
      case 'error':
        return {
          bg: 'bg-red-900/90',
          border: 'border-red-700',
          icon: <AlertCircle className="w-5 h-5 text-red-400" />,
          text: 'text-red-100'
        }
      case 'warning':
        return {
          bg: 'bg-yellow-900/90',
          border: 'border-yellow-700',
          icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
          text: 'text-yellow-100'
        }
      case 'info':
      default:
        return {
          bg: 'bg-blue-900/90',
          border: 'border-blue-700',
          icon: <Info className="w-5 h-5 text-blue-400" />,
          text: 'text-blue-100'
        }
    }
  }

  const styles = getTypeStyles()

  return (
    <div
      className={`${styles.bg} ${styles.border} border backdrop-blur-md rounded-xl p-4 shadow-2xl min-w-[320px] max-w-[480px] transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}
    >
      <div className="flex items-start gap-3">
        {styles.icon}
        <p className={`flex-1 ${styles.text} font-medium leading-relaxed`}>{message}</p>
        <button
          onClick={() => {
            setIsExiting(true)
            setTimeout(() => onClose(id), 300)
          }}
          className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastContainerProps {
  toasts: Toast[]
  onClose: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      <div className="flex flex-col gap-3 pointer-events-auto">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </div>
    </div>
  )
}