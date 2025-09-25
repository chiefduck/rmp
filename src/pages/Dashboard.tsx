import React, { useState, useEffect } from 'react'
import { Users, TrendingDown, Phone, Mail, DollarSign, Target } from 'lucide-react'
import { StatsCard } from '../components/Dashboard/StatsCard'
import { RateChart } from '../components/Dashboard/RateChart'
import { RecentActivity } from '../components/Dashboard/RecentActivity'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalClients: 0,
    activeOpportunities: 0,
    callsMade: 12,
    emailsSent: 48,
    pipelineValue: 2450000,
    conversionRate: 34.5
  })

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return

      try {
        // Fetch client count
        const { count: clientCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        // Fetch active opportunities (qualified + application stages)
        const { count: opportunityCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('current_stage', ['qualified', 'application'])

        // Calculate pipeline value
        const { data: pipelineData } = await supabase
          .from('clients')
          .select('loan_amount')
          .eq('user_id', user.id)
          .not('loan_amount', 'is', null)

        const pipelineValue = pipelineData?.reduce((sum, client) => sum + (client.loan_amount || 0), 0) || 0

        setStats(prev => ({
          ...prev,
          totalClients: clientCount || 0,
          activeOpportunities: opportunityCount || 0,
          pipelineValue
        }))
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      }
    }

    fetchStats()
  }, [user])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back! 👋
        </h1>
        <p className="text-blue-100 text-lg">
          Here's what's happening with your mortgage business today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Total Clients"
          value={stats.totalClients}
          change="+3 this week"
          changeType="positive"
          icon={Users}
          gradient="from-blue-600 to-indigo-600"
        />
        
        <StatsCard
          title="Active Opportunities"
          value={stats.activeOpportunities}
          change="+2 since yesterday"
          changeType="positive"
          icon={Target}
          gradient="from-green-600 to-emerald-600"
        />
        
        <StatsCard
          title="Pipeline Value"
          value={formatCurrency(stats.pipelineValue)}
          change="+12% from last month"
          changeType="positive"
          icon={DollarSign}
          gradient="from-purple-600 to-pink-600"
        />
        
        <StatsCard
          title="Calls Made Today"
          value={stats.callsMade}
          change="Automated by AI"
          changeType="neutral"
          icon={Phone}
          gradient="from-orange-600 to-red-600"
        />
        
        <StatsCard
          title="Emails Sent"
          value={stats.emailsSent}
          change="This week"
          changeType="neutral"
          icon={Mail}
          gradient="from-cyan-600 to-blue-600"
        />
        
        <StatsCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          change="+2.3% improvement"
          changeType="positive"
          icon={TrendingDown}
          gradient="from-indigo-600 to-purple-600"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RateChart />
        <RecentActivity />
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
            <Users className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Add Client</span>
          </button>
          
          <button className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
            <Phone className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-900 dark:text-green-300">Start Calling</span>
          </button>
          
          <button className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
            <TrendingDown className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-300">View Rates</span>
          </button>
          
          <button className="flex flex-col items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
            <Mail className="w-8 h-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-orange-900 dark:text-orange-300">Send Update</span>
          </button>
        </div>
      </div>
    </div>
  )
}