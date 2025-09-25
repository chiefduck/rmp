import React, { useState } from 'react'
import { Phone, Play, Pause, Settings, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Switch } from '../components/ui/Switch'

export const AutoCalling: React.FC = () => {
  const [autoCallingEnabled, setAutoCallingEnabled] = useState(true)
  const [callQueueActive, setCallQueueActive] = useState(false)

  const callQueue = [
    { 
      id: '1', 
      clientName: 'Sarah Johnson', 
      targetRate: 6.95, 
      currentRate: 6.89, 
      loanType: 'FHA', 
      status: 'ready',
      estimatedTime: '2:30 PM'
    },
    { 
      id: '2', 
      clientName: 'Mike Chen', 
      targetRate: 7.10, 
      currentRate: 7.05, 
      loanType: '30yr', 
      status: 'ready',
      estimatedTime: '2:35 PM'
    },
    { 
      id: '3', 
      clientName: 'Lisa Rodriguez', 
      targetRate: 6.80, 
      currentRate: 6.75, 
      loanType: 'VA', 
      status: 'scheduled',
      estimatedTime: '3:00 PM'
    }
  ]

  const recentCalls = [
    {
      id: '1',
      clientName: 'John Smith',
      result: 'Connected',
      duration: '3:45',
      outcome: 'Interested - Scheduled follow-up',
      timestamp: '1:45 PM',
      status: 'success'
    },
    {
      id: '2',
      clientName: 'Emma Davis',
      result: 'Voicemail',
      duration: '0:30',
      outcome: 'Left callback message',
      timestamp: '1:20 PM',
      status: 'partial'
    },
    {
      id: '3',
      clientName: 'Robert Wilson',
      result: 'No Answer',
      duration: '0:00',
      outcome: 'Will retry in 2 hours',
      timestamp: '12:55 PM',
      status: 'failed'
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'partial': return <Clock className="w-4 h-4 text-yellow-600" />
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
      case 'partial': return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
      case 'failed': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
      default: return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Auto Calling
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered automated calling when target rates are reached
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Call Settings
          </Button>
          <Button 
            onClick={() => setCallQueueActive(!callQueueActive)}
            variant={callQueueActive ? 'danger' : 'primary'}
          >
            {callQueueActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {callQueueActive ? 'Pause Queue' : 'Start Queue'}
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <Phone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Calls Today</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">24</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Connected</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">18</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">In Queue</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">3</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">75%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Auto Calling Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Auto Calling</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically call clients when their target rates are reached
                </p>
              </div>
              <Switch 
                checked={autoCallingEnabled} 
                onChange={setAutoCallingEnabled}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Calling Hours
                </label>
                <select className="w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  <option>9:00 AM - 6:00 PM</option>
                  <option>8:00 AM - 8:00 PM</option>
                  <option>10:00 AM - 5:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time Zone
                </label>
                <select className="w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  <option>Eastern Time</option>
                  <option>Central Time</option>
                  <option>Pacific Time</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Attempts
                </label>
                <select className="w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  <option>3 attempts</option>
                  <option>5 attempts</option>
                  <option>2 attempts</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Call Queue</span>
              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                callQueueActive 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
              }`}>
                {callQueueActive ? 'Active' : 'Paused'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {callQueue.map((call, index) => (
                <div key={call.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {call.clientName}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Target: {call.targetRate}% • Current: {call.currentRate}% • {call.loanType}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {call.estimatedTime}
                    </p>
                    <p className={`text-xs px-2 py-1 rounded capitalize ${
                      call.status === 'ready' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                    }`}>
                      {call.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Calls */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCalls.map((call) => (
                <div key={call.id} className={`p-4 rounded-xl border ${getStatusColor(call.status)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(call.status)}
                      <h4 className="font-medium">{call.clientName}</h4>
                    </div>
                    <span className="text-sm">{call.timestamp}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>{call.result} • {call.duration}</span>
                  </div>
                  
                  <p className="text-sm mt-2">{call.outcome}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call Scripts */}
      <Card>
        <CardHeader>
          <CardTitle>AI Call Scripts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                Rate Drop Alert Script
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-400">
                "Hi [Client Name], this is an automated call from [Your Name] at [Company]. 
                Great news! The interest rate for your [Loan Type] loan has dropped to [Current Rate]%, 
                which meets your target rate of [Target Rate]%. This is a great opportunity to move forward 
                with your application. I'll be calling you personally within the next hour to discuss next steps. 
                If you'd like to speak with me immediately, please call [Your Phone]. Thank you!"
              </p>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <h4 className="font-medium text-green-900 dark:text-green-300 mb-2">
                Follow-up Script
              </h4>
              <p className="text-sm text-green-800 dark:text-green-400">
                "Hi [Client Name], this is a follow-up call from [Your Name]. I wanted to check in 
                about your mortgage application status and see if you have any questions. The rates 
                we discussed are still available, but they may not last long. Please call me back 
                at [Your Phone] when you have a moment. Thanks!"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}