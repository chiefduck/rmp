import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, Phone, Mail, DollarSign, Clock, 
  Target, AlertCircle, Loader2, RefreshCw, Zap,
  ChevronRight, Calendar, TrendingDown, Home, Repeat
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'
import { getTopOpportunities, OpportunityScore } from '../lib/opportunityService'
import { supabase } from '../lib/supabase'

type TabType = 'all' | 'purchase' | 'refi'

export const OpportunityFinder: React.FC = () => {
  const { user } = useAuth()
  const [opportunities, setOpportunities] = useState<OpportunityScore[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [callingClient, setCallingClient] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState<TabType>('all')

  useEffect(() => {
    if (user) {
      loadOpportunities()
    }
  }, [user])

  const loadOpportunities = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const opportunities = await getTopOpportunities(user.id, 50)
      setOpportunities(opportunities)
      setLastRefresh(new Date())
    } catch (error: any) {
      console.error('Error loading opportunities:', error)
      
      if (error.message?.includes('rate') || error.message?.includes('scraper')) {
        showMessage('error', '⚠️ No market rate data available. Go to Rate Monitor and click "Refresh Rates" first.')
      } else {
        showMessage('error', 'Failed to load opportunities')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadOpportunities()
    setRefreshing(false)
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const makeCall = async (opportunity: OpportunityScore) => {
    if (!user) return
    
    const confirmed = confirm(
      `Call ${opportunity.clientName}?\n\n` +
      `💰 Potential savings: $${Math.round(opportunity.savingsMonthly)}/month\n` +
      `📞 Phone: ${opportunity.phone}\n\n` +
      `The AI will call them in ~30 seconds.`
    )
    
    if (!confirmed) return
    
    try {
      setCallingClient(opportunity.clientId)
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-call`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            clientId: opportunity.clientId,
            userId: user.id,
            callType: 'client-only'
          })
        }
      )
      
      const result = await response.json()
      
      if (result.success) {
        showMessage('success', `✅ Calling ${opportunity.clientName}!`)
        
        await supabase
          .from('clients')
          .update({ last_contact: new Date().toISOString() })
          .eq('id', opportunity.clientId)
        
        setTimeout(() => loadOpportunities(), 2000)
      } else {
        showMessage('error', `❌ Failed: ${result.error}`)
      }
    } catch (error: any) {
      showMessage('error', error.message || 'Failed to initiate call')
    } finally {
      setCallingClient(null)
    }
  }

  const sendEmail = (opportunity: OpportunityScore) => {
    const subject = encodeURIComponent(`Great News About Current Rates`)
    const body = encodeURIComponent(
      `Hi ${opportunity.clientName.split(' ')[0]},\n\n` +
      `I wanted to reach out because there's an opportunity you should know about.\n\n` +
      `Current market rates are favorable, and I'd love to discuss how this could benefit you.\n\n` +
      `Do you have time for a quick call this week?\n\n` +
      `Best regards`
    )
    
    window.location.href = `mailto:${opportunity.email}?subject=${subject}&body=${body}`
  }

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'from-red-500 to-red-600'
      case 'high': return 'from-orange-500 to-orange-600'
      case 'medium': return 'from-yellow-500 to-yellow-600'
      case 'low': return 'from-green-500 to-green-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getUrgencyBadge = (level: string) => {
    switch (level) {
      case 'critical': return { emoji: '🔥', label: 'CALL NOW', color: 'bg-red-100 text-red-700 border-red-300' }
      case 'high': return { emoji: '⚡', label: 'HIGH PRIORITY', color: 'bg-orange-100 text-orange-700 border-orange-300' }
      case 'medium': return { emoji: '📊', label: 'FOLLOW UP', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' }
      case 'low': return { emoji: '📈', label: 'TOUCH BASE', color: 'bg-green-100 text-green-700 border-green-300' }
      default: return { emoji: '📋', label: 'REVIEW', color: 'bg-gray-100 text-gray-700 border-gray-300' }
    }
  }

  // Determine if client is purchase or refi based on current_stage
  const isPurchaseClient = (stage: string) => {
    const purchaseStages = ['new', 'qualified', 'application', 'contacted']
    return purchaseStages.includes(stage?.toLowerCase())
  }

  // Filter opportunities by tab
  const filteredOpportunities = opportunities.filter(opp => {
    if (activeTab === 'all') return true
    if (activeTab === 'purchase') return isPurchaseClient(opp.pipelineStage)
    if (activeTab === 'refi') return !isPurchaseClient(opp.pipelineStage)
    return true
  })

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6 pb-20 md:pb-6 px-2 md:px-0">
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600"></div>
          <div className="relative backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-8 text-white">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-sm rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold drop-shadow-sm">Smart Call List</h1>
                <p className="text-sm md:text-base text-white/90">Loading your priorities...</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-6 px-2 md:px-0">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600"></div>
        <div className="relative backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl md:rounded-3xl p-4 md:p-6 text-white">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-sm rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div>
                  <h1 className="text-xl md:text-3xl font-bold drop-shadow-sm">Your Daily Call Plan</h1>
                  <p className="text-sm md:text-base text-white/90">AI-ranked by best opportunity to close</p>
                </div>
              </div>
              
              <Button 
                onClick={handleRefresh} 
                variant="secondary"
                disabled={refreshing}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 flex-shrink-0"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            {/* Value Proposition */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4 border border-white/20">
              <div className="flex items-start gap-2">
                <Zap className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm leading-relaxed">
                  <strong>Stop guessing who to call.</strong> We analyze your entire pipeline every 15 minutes and rank clients by: potential value 💰, urgency ⏰, and likelihood to close 🎯. Start at #1 and work your way down.
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-white/70 text-xs">
              <Clock className="w-4 h-4" />
              Updated: {lastRefresh.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`relative backdrop-blur-sm rounded-xl p-3 md:p-4 border ${
          message.type === 'success' 
            ? 'bg-green-50/60 border-green-200/50' 
            : 'bg-red-50/60 border-red-200/50'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <Zap className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <p className={`text-sm md:text-base ${
              message.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === 'all'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-white/60 text-gray-700 hover:bg-white'
          }`}
        >
          All Clients ({opportunities.length})
        </button>
        <button
          onClick={() => setActiveTab('purchase')}
          className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'purchase'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white/60 text-gray-700 hover:bg-white'
          }`}
        >
          <Home className="w-4 h-4" />
          Purchase ({opportunities.filter(o => isPurchaseClient(o.pipelineStage)).length})
        </button>
        <button
          onClick={() => setActiveTab('refi')}
          className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'refi'
              ? 'bg-green-600 text-white shadow-lg'
              : 'bg-white/60 text-gray-700 hover:bg-white'
          }`}
        >
          <Repeat className="w-4 h-4" />
          Refinance ({opportunities.filter(o => !isPurchaseClient(o.pipelineStage)).length})
        </button>
      </div>

      {/* Empty State */}
      {filteredOpportunities.length === 0 ? (
        <div className="relative backdrop-blur-sm bg-white/60 border border-white/20 rounded-xl md:rounded-2xl p-8 md:p-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
              {activeTab === 'all' ? 'No Clients Yet' : `No ${activeTab === 'purchase' ? 'Purchase' : 'Refinance'} Clients`}
            </h3>
            <p className="text-gray-600 mb-6 text-sm md:text-base leading-relaxed">
              Add clients to your CRM with their loan details and target rates. Our AI will automatically rank them and tell you exactly who to call each day.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Quick Start:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Go to CRM and add a few clients</li>
                <li>Enter loan amount and target rate</li>
                <li>Come back here - we'll rank them for you!</li>
              </ol>
            </div>
            
            <Button onClick={() => window.location.href = '/crm'} size="lg">
              Add Your First Client →
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { 
                label: 'Call Now', 
                count: filteredOpportunities.filter(o => o.urgencyLevel === 'critical').length,
                emoji: '🔥',
                color: 'from-red-500 to-red-600'
              },
              { 
                label: 'High Priority', 
                count: filteredOpportunities.filter(o => o.urgencyLevel === 'high').length,
                emoji: '⚡',
                color: 'from-orange-500 to-orange-600'
              },
              { 
                label: 'Follow Up', 
                count: filteredOpportunities.filter(o => o.urgencyLevel === 'medium').length,
                emoji: '📊',
                color: 'from-yellow-500 to-yellow-600'
              },
              { 
                label: 'Touch Base', 
                count: filteredOpportunities.filter(o => o.urgencyLevel === 'low').length,
                emoji: '📈',
                color: 'from-green-500 to-green-600'
              }
            ].map((stat, index) => (
              <div key={index} className="relative overflow-hidden rounded-xl">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10`}></div>
                <div className="relative backdrop-blur-sm bg-white/60 border border-white/20 rounded-xl p-3 md:p-4">
                  <div className="text-2xl mb-1">{stat.emoji}</div>
                  <div className="text-2xl md:text-3xl font-bold text-gray-900">{stat.count}</div>
                  <div className="text-xs md:text-sm text-gray-600">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Opportunities List */}
          <div className="space-y-3">
            {filteredOpportunities.map((opportunity, index) => {
              const badge = getUrgencyBadge(opportunity.urgencyLevel)
              
              return (
                <div 
                  key={opportunity.clientId}
                  className="relative overflow-hidden rounded-xl md:rounded-2xl group"
                >
                  {/* Urgency gradient bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${getUrgencyColor(opportunity.urgencyLevel)}`}></div>
                  
                  <div className="relative backdrop-blur-sm bg-white/60 border border-white/20 rounded-xl md:rounded-2xl p-4 md:p-6 pl-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Rank Badge */}
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          #{index + 1}
                        </div>
                        
                        {/* Client Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">
                            {opportunity.clientName}
                          </h3>
                          
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {opportunity.phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {opportunity.email}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Urgency Badge */}
                      <div className={`px-4 py-2 rounded-lg border-2 font-bold text-sm whitespace-nowrap ${badge.color} flex items-center gap-2`}>
                        <span>{badge.emoji}</span>
                        <span>{badge.label}</span>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="bg-white/50 rounded-lg p-3 border border-gray-200">
                        <div className="text-xs text-gray-600 mb-1">Score</div>
                        <div className="text-2xl font-bold text-purple-600">{opportunity.score}</div>
                      </div>
                      
                      <div className="bg-white/50 rounded-lg p-3 border border-gray-200">
                        <div className="text-xs text-gray-600 mb-1">Loan Amount</div>
                        <div className="text-lg font-bold text-gray-900">${(opportunity.loanAmount / 1000).toFixed(0)}K</div>
                      </div>
                      
                      <div className="bg-white/50 rounded-lg p-3 border border-gray-200">
                        <div className="text-xs text-gray-600 mb-1">Last Contact</div>
                        <div className="text-lg font-bold text-gray-900">
                          {opportunity.daysSinceContact === 999 ? 'Never' : `${opportunity.daysSinceContact}d ago`}
                        </div>
                      </div>
                      
                      <div className="bg-white/50 rounded-lg p-3 border border-gray-200">
                        <div className="text-xs text-gray-600 mb-1">Stage</div>
                        <div className="text-lg font-bold text-gray-900 capitalize">{opportunity.pipelineStage}</div>
                      </div>
                    </div>

                    {/* AI Reasoning */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-2">
                        <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-semibold text-blue-900 mb-2">Why call {opportunity.clientName.split(' ')[0]} now:</div>
                          <ul className="space-y-1 text-sm text-blue-800">
                            {opportunity.reasoning.map((reason, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* What To Say */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-2">
                        <Phone className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-semibold text-purple-900 mb-1">Opening Line:</div>
                          <p className="text-sm text-purple-800 italic">"{opportunity.callRecommendation}"</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={() => makeCall(opportunity)}
                        disabled={callingClient === opportunity.clientId}
                        loading={callingClient === opportunity.clientId}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {callingClient === opportunity.clientId ? 'Calling...' : 'AI Call Now'}
                      </Button>
                      
                      <Button
                        onClick={() => sendEmail(opportunity)}
                        variant="outline"
                        className="flex-1"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                      
                      <Button
                        onClick={() => window.location.href = `/crm?client=${opportunity.clientId}`}
                        variant="outline"
                      >
                        View CRM
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Help Section */}
      {filteredOpportunities.length > 0 && (
        <div className="relative backdrop-blur-sm bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 md:p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-3">🎯 How To Use This</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="font-bold mb-1">1. Start at #1</div>
                  <div>Highest score = Best opportunity. Work top to bottom.</div>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="font-bold mb-1">2. Read "Why call now"</div>
                  <div>Understand the opportunity before calling.</div>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="font-bold mb-1">3. Use the opening line</div>
                  <div>We wrote it for you - just read it!</div>
                </div>
              </div>
              <p className="mt-3 text-xs text-blue-700">💡 This list updates every 15 minutes as rates change. Check it each morning to plan your day.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}