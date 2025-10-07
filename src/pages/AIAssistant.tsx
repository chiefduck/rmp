import React from 'react'
import { ComingSoonOverlay } from '../components/ui/ComingSoonOverlay'

export const AIAssistant: React.FC = () => {
  return (
    <div className="relative min-h-screen">
      {/* Blurred Background Content */}
      <div className="space-y-6 opacity-40 pointer-events-none">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">AI Assistant</h1>
            <p className="text-gray-600 dark:text-gray-400">Intelligent email and communication automation</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">✉️</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Smart Email Templates</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">AI-generated personalized emails</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Auto Responses</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Automated client communication</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Sentiment Analysis</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Understand client responses</p>
          </div>
        </div>
      </div>

      {/* Coming Soon Overlay */}
      <ComingSoonOverlay
        title="AI Assistant Coming Soon! 🤖"
        description="We're building an intelligent AI assistant that will automate your email communications, generate personalized messages, and help you engage with clients more effectively."
        features={[
          'AI-powered email generation with personalized content',
          'Smart response suggestions based on client history',
          'Automated follow-up sequences and reminders',
          'Sentiment analysis to gauge client interest',
          'Multi-channel communication (email, SMS, WhatsApp)',
          'Integration with your CRM for seamless workflow'
        ]}
        estimatedDate="Q4 2025"
      />
    </div>
  )
}