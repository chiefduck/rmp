// src/components/AutoCalling/CallAnalyticsCharts.tsx - Visual Analytics Dashboard
import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Clock, DollarSign, Target, Phone, Info, HelpCircle } from 'lucide-react';

interface CallLogEntry {
  id: string;
  call_status: string;
  call_type: 'broker' | 'client';
  call_duration?: number;
  cost_cents: number;
  created_at: string;
}

interface CallAnalyticsChartsProps {
  calls: CallLogEntry[];
}

export const CallAnalyticsCharts: React.FC<CallAnalyticsChartsProps> = ({ calls }) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Tooltip component
  const InfoTooltip: React.FC<{ id: string; title: string; description: string }> = ({ id, title, description }) => (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setActiveTooltip(id)}
        onMouseLeave={() => setActiveTooltip(null)}
        className="ml-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {activeTooltip === id && (
        <div className="absolute z-50 left-0 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl border border-gray-700">
          <p className="font-semibold mb-1">{title}</p>
          <p className="text-gray-300">{description}</p>
        </div>
      )}
    </div>
  );
  
  // Process data for charts
  
  // 1. Calls over time (last 7 days)
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const callsByDay = getLast7Days().map(day => {
    const dayCalls = calls.filter(c => c.created_at.split('T')[0] === day);
    return {
      date: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      calls: dayCalls.length,
      successful: dayCalls.filter(c => c.call_status === 'completed').length,
      failed: dayCalls.filter(c => c.call_status === 'failed' || c.call_status === 'no-answer').length
    };
  });

  // 2. Status distribution (Pie chart)
  const statusCounts = calls.reduce((acc, call) => {
    acc[call.call_status] = (acc[call.call_status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    value: count,
    percentage: ((count / calls.length) * 100).toFixed(1)
  }));

  const COLORS = {
    'Completed': '#10b981',
    'Failed': '#ef4444',
    'No Answer': '#f59e0b',
    'Voicemail': '#3b82f6',
    'Initiated': '#8b5cf6'
  };

  // 3. Call duration distribution
  const durationRanges = [
    { range: '<1min', min: 0, max: 60, count: 0 },
    { range: '1-2min', min: 60, max: 120, count: 0 },
    { range: '2-3min', min: 120, max: 180, count: 0 },
    { range: '3-5min', min: 180, max: 300, count: 0 },
    { range: '>5min', min: 300, max: Infinity, count: 0 }
  ];

  calls.forEach(call => {
    if (call.call_duration) {
      const range = durationRanges.find(r => call.call_duration! >= r.min && call.call_duration! < r.max);
      if (range) range.count++;
    }
  });

  const durationData = durationRanges.filter(r => r.count > 0);

  // Success rate trend
  const successRateByDay = getLast7Days().map(day => {
    const dayCalls = calls.filter(c => c.created_at.split('T')[0] === day);
    const successRate = dayCalls.length > 0
      ? (dayCalls.filter(c => c.call_status === 'completed').length / dayCalls.length) * 100
      : 0;
    return {
      date: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rate: parseFloat(successRate.toFixed(1))
    };
  });

  // Calculate key metrics
  const avgDuration = calls.filter(c => c.call_duration).length > 0
    ? calls.filter(c => c.call_duration).reduce((sum, c) => sum + (c.call_duration || 0), 0) / 
      calls.filter(c => c.call_duration).length
    : 0;

  const totalCreditsUsed = calls.length;
  const successRate = calls.length > 0 
    ? (calls.filter(c => c.call_status === 'completed').length / calls.length) * 100 
    : 0;

  // Trend indicators
  const getTrend = (data: { rate: number }[]) => {
    if (data.length < 2) return 'neutral';
    const recent = data.slice(-3).reduce((sum, d) => sum + d.rate, 0) / 3;
    const older = data.slice(0, 3).reduce((sum, d) => sum + d.rate, 0) / 3;
    return recent > older ? 'up' : recent < older ? 'down' : 'neutral';
  };

  const successTrend = getTrend(successRateByDay);

  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
              <InfoTooltip 
                id="success-rate"
                title="Success Rate"
                description="Percentage of calls where the client answered and had a conversation. Higher is better - aim for 60%+. Excludes no-answers, voicemails, and failed calls."
              />
            </div>
            <span className={`text-xs font-medium ${successTrend === 'up' ? 'text-green-600' : successTrend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
              {successTrend === 'up' ? '↑' : successTrend === 'down' ? '↓' : '→'} {successTrend}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{successRate.toFixed(1)}%</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <InfoTooltip 
                id="avg-duration"
                title="Average Duration"
                description="Average time clients spend on the phone. Longer calls (2-4 min) usually mean higher engagement. Very short calls may indicate script issues."
              />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Average</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {Math.floor(avgDuration / 60)}:{(Math.floor(avgDuration) % 60).toString().padStart(2, '0')}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Avg Duration</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <InfoTooltip 
                id="credits-used"
                title="Credits Used"
                description="Total number of AI calls made. Each call uses 1 credit. Track this to manage your monthly plan limits and optimize calling times."
              />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Total</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalCreditsUsed}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Credits Used</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calls Over Time */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Call Volume (7 Days)</h3>
            <InfoTooltip 
              id="call-volume"
              title="Call Volume Chart"
              description="Shows your daily calling activity. Green line = successful connections. Blue line = total attempts. Look for patterns - which days have the best results?"
            />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={callsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }} 
              />
              <Legend />
              <Line type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} name="Total Calls" />
              <Line type="monotone" dataKey="successful" stroke="#10b981" strokeWidth={2} name="Successful" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Call Outcomes</h3>
            <InfoTooltip 
              id="call-outcomes"
              title="Call Outcomes Breakdown"
              description="Visual breakdown of call results. Green = completed calls. Red = failed/no answer. Yellow = voicemail. Use this to identify issues - too many no-answers? Try different times."
            />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#6b7280'} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Duration Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Call Duration Distribution</h3>
            <InfoTooltip 
              id="duration-dist"
              title="Call Length Analysis"
              description="Shows how long your calls typically last. Sweet spot is 2-3 minutes. Too short? Script may need work. Too long? May be losing client interest."
            />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={durationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="range" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }} 
              />
              <Bar dataKey="count" fill="#8b5cf6" name="Calls" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Credits Usage Trend (replacing Cost Trend) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Daily Credit Usage</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={callsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }} 
                formatter={(value: number) => `${value} credits`}
              />
              <Line type="monotone" dataKey="calls" stroke="#f97316" strokeWidth={2} name="Credits Used" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Success Rate Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Success Rate Trend</h3>
            <InfoTooltip 
              id="success-trend"
              title="What is Success Rate Trend?"
              description="Tracks your daily call completion rate over 7 days. Shows if your calling strategy is working. Green (up) = improving performance. Red (down) = may need to adjust timing or scripts. Use this to find optimal calling times."
            />
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
            successTrend === 'up' 
              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : successTrend === 'down'
              ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
          }`}>
            {successTrend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="text-sm font-medium">{successTrend === 'up' ? 'Improving' : successTrend === 'down' ? 'Declining' : 'Stable'}</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={successRateByDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }} 
              formatter={(value: number) => `${value}%`}
            />
            <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={3} name="Success Rate (%)" />
          </LineChart>
        </ResponsiveContainer>
        
        {/* Action Tips */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">💡 How to improve your success rate:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Call during business hours (9am-5pm local time)</li>
                <li>Avoid Monday mornings and Friday afternoons</li>
                <li>Test different call scripts to see what resonates</li>
                <li>Follow up on no-answers at different times</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};