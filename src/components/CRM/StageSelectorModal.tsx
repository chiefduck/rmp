// src/components/CRM/StageSelectorModal.tsx - NEW FILE
import React from 'react'
import { X, CheckCircle } from 'lucide-react'

interface Stage {
  id: string
  label: string
  color: string
  description: string
}

interface StageSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  currentStage: string
  clientName: string
  onSelectStage: (stageId: string) => void
}

const stages: Stage[] = [
  { 
    id: 'prospect', 
    label: 'Prospect', 
    color: 'from-blue-500 to-blue-600',
    description: 'Initial contact made'
  },
  { 
    id: 'qualified', 
    label: 'Qualified', 
    color: 'from-yellow-500 to-orange-500',
    description: 'Pre-approved & ready'
  },
  { 
    id: 'application', 
    label: 'Application', 
    color: 'from-orange-500 to-red-500',
    description: 'Application submitted'
  },
  { 
    id: 'processing', 
    label: 'Processing', 
    color: 'from-purple-500 to-purple-600',
    description: 'Underwriting in progress'
  },
  { 
    id: 'closing', 
    label: 'Closing', 
    color: 'from-green-500 to-green-600',
    description: 'Ready to close'
  }
]

export const StageSelectorModal: React.FC<StageSelectorModalProps> = ({
  isOpen,
  onClose,
  currentStage,
  clientName,
  onSelectStage
}) => {
  if (!isOpen) return null

  const handleSelectStage = (stageId: string) => {
    if (stageId !== currentStage) {
      onSelectStage(stageId)
    }
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden animate-slide-up">
        <div className="bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl max-h-[70vh] overflow-hidden flex flex-col">
          {/* Header - EVEN SMALLER */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 pb-4 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-white mb-0.5">Move Client</h2>
                <p className="text-blue-100 text-xs truncate">{clientName}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0 ml-2"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Stage Cards - Scrollable with TIGHTER SPACING */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {stages.map((stage) => {
              const isCurrent = stage.id === currentStage
              
              return (
                <button
                  key={stage.id}
                  onClick={() => handleSelectStage(stage.id)}
                  disabled={isCurrent}
                  className={`w-full text-left transition-all duration-200 rounded-xl overflow-hidden ${
                    isCurrent 
                      ? 'opacity-60 cursor-not-allowed' 
                      : 'hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  <div className={`bg-gradient-to-r ${stage.color} p-4 relative`}>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-bold text-white">
                        {stage.label}
                      </h3>
                      {isCurrent && (
                        <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                          <span className="text-xs font-medium text-white">Current</span>
                        </div>
                      )}
                    </div>
                    <p className="text-white/90 text-xs">{stage.description}</p>
                    
                    {/* Decorative gradient overlay */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  </div>
                </button>
              )
            })}
          </div>

          {/* Footer with cancel button - SMALLER */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  )
}