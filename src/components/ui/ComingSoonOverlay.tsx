import React from 'react'
import { Sparkles, Calendar, Bell, X } from 'lucide-react'

interface ComingSoonOverlayProps {
  title: string
  description: string
  features?: string[]
  estimatedDate?: string
  onClose?: () => void
}

export const ComingSoonOverlay: React.FC<ComingSoonOverlayProps> = ({
  title,
  description,
  features = [],
  estimatedDate,
  onClose
}) => {
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && onClose) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 backdrop-blur-sm bg-gray-900/60 flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div 
        className="relative max-w-2xl w-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl md:rounded-3xl p-[2px] shadow-2xl my-4 animate-in fade-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gray-900 rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 max-h-[90vh] overflow-y-auto relative">
          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 md:top-4 md:right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors z-10 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Animated Icon */}
          <div className="flex justify-center mb-6 mt-8">
            <div className="relative">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl animate-pulse">
                <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-xs font-bold">✨</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4 leading-tight">
              {title}
            </h2>
            <p className="text-base md:text-lg text-gray-300 leading-relaxed max-w-xl mx-auto">
              {description}
            </p>
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div className="mb-6 md:mb-8">
              <h3 className="text-xs md:text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 text-center">
                What's Coming
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/10"
                  >
                    <div className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <span className="text-gray-200 text-sm md:text-base leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estimated Date */}
          {estimatedDate && (
            <div className="flex items-center justify-center mb-6 md:mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-400/30">
                <Calendar className="w-4 h-4 text-blue-300" />
                <span className="text-sm font-medium text-blue-200">
                  Launch: {estimatedDate}
                </span>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="text-center">
            <button className="inline-flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 min-h-[48px] md:min-h-[56px]">
              <Bell className="w-5 h-5" />
              <span>Notify Me When Ready</span>
            </button>
            <p className="text-xs md:text-sm text-gray-400 mt-4">
              We'll send you an email when this feature launches
            </p>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-4 left-4 w-16 h-16 md:w-24 md:h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-4 right-4 w-20 h-20 md:w-32 md:h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>
      </div>
    </div>
  )
}