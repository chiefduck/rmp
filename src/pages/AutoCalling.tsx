import React from 'react'
import { ComingSoonOverlay } from '../components/ui/ComingSoonOverlay'

export const AutoCalling: React.FC = () => {
  return (
    <div className="relative min-h-screen">
      {/* Coming Soon Overlay */}
      <ComingSoonOverlay
        title="Auto Calling Coming Soon! 📞"
        description="We're developing an advanced AI-powered calling system that will automatically reach out to clients when their target rates are hit, maximizing your conversion opportunities."
        features={[
          'Automatic calls when target rates are reached',
          'AI voice agent with natural conversation flow',
          'Smart call scheduling based on client time zones',
          'Voicemail detection and personalized messages',
          'Real-time call transcription and notes',
          'Automatic CRM updates and follow-up tasks',
          'Call analytics and performance tracking',
          'Compliance with TCPA and Do Not Call regulations'
        ]}
        estimatedDate="Q4 2025"
      />
    </div>
  )
}