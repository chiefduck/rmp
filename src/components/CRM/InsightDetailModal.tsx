
// src/components/CRM/InsightDetailModal.tsx - Dark Modern UI
import React, { useRef, useEffect } from 'react'
import { X, TrendingUp, Clock, DollarSign, AlertCircle, User, Mail, Phone } from 'lucide-react'

interface Client {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  current_stage: string
  loan_amount?: number
  last_contact?: string
  days_since_contact?: number
}

interface InsightDetailModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  clients: Client[]
  icon: 'alert' | 'trending' | 'clock' | 'dollar'
  color: 'red' | 'green' | 'yellow' | 'blue' | 'purple'
  onViewClient?: (client: Client) => void
}

export const InsightDetailModal: React.FC<InsightDetailModalProps> = ({
  isOpen, onClose, title, description, clients, icon, color, onViewClient
}) => {
  const modalRef = useRef<HTMLDivElement>(null)

  const colorMap = {
    red: 'from-red-500 to-red-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600'
  }
  
  const stageColors: Record<string, string> = {
    prospect: 'bg-gray-800 text-gray-300',
    qualified: 'bg-blue-900/30 text-blue-300',
    application: 'bg-purple-900/30 text-purple-300',
    processing: 'bg-yellow-900/30 text-yellow-300',
    underwriting: 'bg-orange-900/30 text-orange-300',
    clear_to_close: 'bg-green-900/30 text-green-300'
  }
  
  const DynamicIcon = ({ className }: { className: string }) => {
    switch (icon) {
      case 'alert': return <AlertCircle className={className} />
      case 'trending': return <TrendingUp className={className} />
      case 'clock': return <Clock className={className} />
      case 'dollar': return <DollarSign className={className} />
      default: return null
    }
  }

  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose()
    }
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const formatStage = (stage: string) => 
    stage.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const formatCurrency = (amount?: number) => 
    amount ? `${amount.toLocaleString()}` : 'Not set'
  const formatDate = (dateString?: string) => 
    dateString ? new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        <div className={`bg-gradient-to-r ${colorMap[color]} p-6 text-white relative`}>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <DynamicIcon className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">{title}</h2>
              <p className="text-white/90 text-sm">{description}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <User className="w-4 h-4" />
            <span className="font-semibold">{clients.length}</span>
            <span className="opacity-90">Client{clients.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {clients.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <DynamicIcon className="w-10 h-10 text-gray-500" />
              </div>
              <p className="text-gray-400 text-lg">No clients in this category</p>
            </div>
          ) : (
            <div className="space-y-4">
              {clients.map((client) => (
                <div key={client.id} className="bg-gray-800/50 rounded-xl p-5 hover:bg-gray-800 transition-all border border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-100 mb-2">
                        {client.first_name} {client.last_name}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${stageColors[client.current_stage] || stageColors.prospect}`}>
                          {formatStage(client.current_stage)}
                        </span>
                        {client.days_since_contact !== undefined && (
                          <span className="text-sm text-gray-400">
                            {client.days_since_contact} days since contact
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300 truncate">{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">{client.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300 font-semibold">{formatCurrency(client.loan_amount)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">Last: {formatDate(client.last_contact)}</span>
                    </div>
                  </div>
                  {onViewClient && (
                    <button
                      onClick={() => onViewClient(client)}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-sm font-semibold transition-all shadow-lg"
                    >
                      View Full Details
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-800 p-4 bg-gray-800/50">
          <button onClick={onClose} className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm font-semibold transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}