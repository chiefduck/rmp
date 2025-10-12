// src/components/AutoCalling/CallDetailModal.tsx - NO COST DISPLAY
import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Phone, Clock, CheckCircle, XCircle, Download, Play, Pause, User, MessageSquare, Sparkles, Zap } from 'lucide-react'
import { CallLogEntry } from '../../lib/blandService'
import BlandService from '../../lib/blandService'

interface CallDetailModalProps {
  isOpen: boolean
  onClose: () => void
  call: CallLogEntry | null
}

export const CallDetailModal: React.FC<CallDetailModalProps> = ({
  isOpen,
  onClose,
  call
}) => {
  const [loading, setLoading] = useState(false)
  const [fullTranscript, setFullTranscript] = useState<string>('')
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [emotion, setEmotion] = useState<string>('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (call && isOpen) {
      loadCallDetails()
    }
    
    return () => {
      if (audioElement) {
        audioElement.pause()
        audioElement.src = ''
      }
    }
  }, [call, isOpen])

  const loadCallDetails = async () => {
    if (!call) return
    
    setLoading(true)
    try {
      // Use transcript from database first (webhook already populated it)
      if (call.transcript) {
        setFullTranscript(call.transcript)
      } else if (call.bland_call_id) {
        // Only fetch from API if not in database
        try {
          const transcript = await BlandService.getTranscript(call.bland_call_id)
          setFullTranscript(transcript)
        } catch (error) {
          console.error('Failed to load transcript:', error)
          setFullTranscript('Transcript not available yet')
        }
      } else {
        setFullTranscript('Transcript not available yet')
      }

      // Load recording URL
      if (call.recording_url) {
        setAudioUrl(call.recording_url)
      } else if (call.bland_call_id) {
        try {
          const url = await BlandService.getRecording(call.bland_call_id)
          setAudioUrl(url)
        } catch (error) {
          console.error('Failed to load recording:', error)
        }
      }

      // Load emotion analysis
      if (call.bland_call_id) {
        try {
          const emotionData = await BlandService.analyzeEmotions(call.bland_call_id)
          setEmotion(emotionData.emotion)
        } catch (error) {
          console.error('Failed to analyze emotions:', error)
        }
      }

    } catch (error) {
      console.error('Error loading call details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlayPause = () => {
    if (!audioUrl) return

    if (!audioElement) {
      const audio = new Audio(audioUrl)
      audio.addEventListener('ended', () => setIsPlaying(false))
      setAudioElement(audio)
      audio.play()
      setIsPlaying(true)
    } else {
      if (isPlaying) {
        audioElement.pause()
        setIsPlaying(false)
      } else {
        audioElement.play()
        setIsPlaying(true)
      }
    }
  }

  const handleDownloadRecording = () => {
    if (!audioUrl) return
    window.open(audioUrl, '_blank')
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'failed':
      case 'no-answer':
        return <XCircle className="w-6 h-6 text-red-500" />
      default:
        return <Phone className="w-6 h-6 text-blue-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'failed':
      case 'no-answer':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      case 'voicemail':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
    }
  }

  const getEmotionColor = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'happy':
      case 'excited':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'angry':
      case 'frustrated':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      case 'sad':
      case 'disappointed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  if (!call) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Call Details" size="xl">
      <div className="space-y-6">
        {/* Header - Call Status */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              {getStatusIcon(call.call_status)}
              <div>
                <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {call.client_name}
                </h2>
                <p className="text-blue-600 dark:text-blue-300">
                  {call.phone_number}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(call.call_status)}`}>
                    {call.call_status.replace('-', ' ').toUpperCase()}
                  </span>
                  {call.call_type === 'broker' && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                      BROKER CALL
                    </span>
                  )}
                  {call.call_type === 'client' && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300">
                      CLIENT CALL
                    </span>
                  )}
                  {emotion && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEmotionColor(emotion)} flex items-center gap-1`}>
                      <Sparkles className="w-3 h-3" />
                      {emotion}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right text-sm text-blue-600 dark:text-blue-400">
              <div>{new Date(call.created_at).toLocaleDateString()}</div>
              <div>{new Date(call.created_at).toLocaleTimeString()}</div>
            </div>
          </div>
        </div>

        {/* Call Metrics - NO COST */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Duration</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {call.call_duration ? formatDuration(call.call_duration) : 'N/A'}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Type</span>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100 capitalize">
              {call.call_type}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Credit</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              1
            </div>
          </div>
        </div>

        {/* Audio Player */}
        {audioUrl && (
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Call Recording
            </h3>
            <div className="flex items-center gap-4">
              <Button
                onClick={handlePlayPause}
                variant="outline"
                className="bg-white dark:bg-gray-800"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 mr-2" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {isPlaying ? 'Pause' : 'Play'} Recording
              </Button>
              <Button
                onClick={handleDownloadRecording}
                variant="outline"
                className="bg-white dark:bg-gray-800"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        )}

        {/* Transcript - Simple Version */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Call Transcript
          </h3>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading transcript...</p>
            </div>
          ) : fullTranscript && fullTranscript !== 'Transcript not available yet' ? (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                  {fullTranscript}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No transcript available
              </h4>
              <p className="text-gray-500 dark:text-gray-400">
                Transcript will be available after the call completes
              </p>
            </div>
          )}
        </div>

        {/* Timeline */}
        {call.completed_at && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Call Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Initiated:</span>{' '}
                  {new Date(call.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Completed:</span>{' '}
                  {new Date(call.completed_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Call ID */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="text-xs text-gray-500 dark:text-gray-500">
            Call ID: {call.bland_call_id || call.id}
          </div>
        </div>
      </div>
    </Modal>
  )
}