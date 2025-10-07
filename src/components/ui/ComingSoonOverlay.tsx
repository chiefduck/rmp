// src/components/ui/ComingSoonOverlay.tsx
import React from 'react'
import { Sparkles, Calendar, Bell } from 'lucide-react'

interface ComingSoonOverlayProps {
  title: string
  description: string
  features?: string[]
  estimatedDate?: string
}

export const ComingSoonOverlay: React.FC<ComingSoonOverlayProps> = ({
  title,
  description,
  features = [],
  estimatedDate
}) => {
  return (
    <div className="absolute inset-0 z-50 backdrop-blur-md bg-gray-900/40 flex items-center justify-center p-4">
      <div className="relative max-w-2xl w-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-1 shadow-2xl">
        <div className="bg-gray-900 rounded-3xl p-8 md:p-12">
          {/* Animated Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl animate-pulse">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-xs font-bold">✨</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {title}
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed max-w-xl mx-auto">
              {description}
            </p>
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 text-center">
                What's Coming
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <span className="text-gray-200 text-sm leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estimated Date */}
          {estimatedDate && (
            <div className="flex items-center justify-center space-x-2 mb-8">
              <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-400/30">
                <Calendar className="w-4 h-4 text-blue-300" />
                <span className="text-sm font-medium text-blue-200">
                  Estimated Launch: {estimatedDate}
                </span>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="text-center">
            <button className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Bell className="w-5 h-5" />
              <span>Notify Me When Ready</span>
            </button>
            <p className="text-xs text-gray-400 mt-4">
              We'll send you an email when this feature launches
            </p>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-8 left-8 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
          <div className="absolute bottom-8 right-8 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
        </div>
      </div>
    </div>
  )
}