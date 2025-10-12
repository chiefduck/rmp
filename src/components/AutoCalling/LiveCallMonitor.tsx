// src/components/AutoCalling/LiveCallMonitor.tsx - Real-time call monitoring
import React, { useState, useEffect } from 'react';
import { Phone, Clock, PhoneOff, AlertCircle } from 'lucide-react';
import { PulsingDot } from '../ui/Skeletons';
import BlandService from '../../lib/blandService';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';

interface ActiveCall {
  id: string;
  client_name?: string;
  phone_number?: string;
  call_type: 'broker' | 'client';
  started_at: string;
  status: 'ringing' | 'in-progress';
}

export const LiveCallMonitor: React.FC = () => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [stoppingCallId, setStoppingCallId] = useState<string | null>(null);

  // Poll for active calls every 5 seconds
  useEffect(() => {
    fetchActiveCalls();
    const interval = setInterval(fetchActiveCalls, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveCalls = async () => {
    if (!user) return;
    
    try {
      // Only show calls that are ACTUALLY active (within last 5 minutes)
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
      
      const logs = await BlandService.getCallLogs({
        userId: user.id,
        startDate: fiveMinutesAgo.toISOString(),
        limit: 10
      });
      
      // Filter for genuinely active calls
      const now = new Date().getTime();
      const activeCalls: ActiveCall[] = logs
        .filter(log => {
          // Only show if status is truly active AND call is recent
          const isActiveStatus = ['initiated', 'ringing', 'in-progress'].includes(log.call_status);
          const callAge = now - new Date(log.created_at).getTime();
          const isRecent = callAge < 5 * 60 * 1000;
          
          // ALSO exclude if completed_at is set (webhook fired)
          const notCompleted = !log.completed_at;
          
          return isActiveStatus && isRecent && notCompleted;
        })
        .map(log => ({
          id: log.id,
          client_name: log.client_name,
          phone_number: log.phone_number,
          call_type: log.call_type,
          started_at: log.created_at,
          status: log.call_status === 'in-progress' ? 'in-progress' : 'ringing'
        }));
      
      setActiveCalls(activeCalls);
    } catch (error) {
      console.error('Error fetching active calls:', error);
      setActiveCalls([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStopCall = async (callId: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      '⚠️ STOP ACTIVE CALL?\n\n' +
      'This will immediately end the call.\n\n' +
      'Are you sure you want to stop this call?'
    );
    
    if (!confirmed) {
      return;
    }

    setStoppingCallId(callId);

    try {
      const call = activeCalls.find(c => c.id === callId);
      if (!call) {
        showError('Call not found');
        setStoppingCallId(null);
        return;
      }

      // Get the full call details from database
      const logs = await BlandService.getCallLogs({
        userId: user!.id,
        limit: 100
      });
      
      const callLog = logs.find(l => l.id === callId);
      
      if (!callLog?.bland_call_id) {
        // No Bland call ID - call never actually started
        // Just mark as failed in database
        const { error: updateError } = await supabase
          .from('call_logs')
          .update({
            call_status: 'failed',
            completed_at: new Date().toISOString()
          })
          .eq('id', callId)
        
        if (!updateError) {
          setActiveCalls(prev => prev.filter(c => c.id !== callId));
          success('Call cancelled - never connected');
        }
        setStoppingCallId(null);
        return;
      }

      // Stop the call via API
      await BlandService.stopCall(callLog.bland_call_id);
      
      // Remove from active calls list
      setActiveCalls(prev => prev.filter(c => c.id !== callId));
      success('✅ Call stopped successfully');
      
    } catch (error: any) {
      console.error('Error stopping call:', error);
      
      // If call already ended, that's OK
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        setActiveCalls(prev => prev.filter(c => c.id !== callId));
        success('Call already ended');
      } else if (error.message?.includes('401')) {
        setActiveCalls(prev => prev.filter(c => c.id !== callId));
        showError('⚠️ Unable to verify call status - please refresh');
      } else {
        showError('❌ Failed to stop call - please try again');
      }
    } finally {
      setStoppingCallId(null);
    }
  };

  const getCallDuration = (startedAt: string) => {
    const start = new Date(startedAt).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - start) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const [durations, setDurations] = useState<Record<string, string>>({});

  // Update durations every second
  useEffect(() => {
    const interval = setInterval(() => {
      const newDurations: Record<string, string> = {};
      activeCalls.forEach(call => {
        newDurations[call.id] = getCallDuration(call.started_at);
      });
      setDurations(newDurations);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeCalls]);

  if (loading) return null;
  if (activeCalls.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl p-4 border border-green-200 dark:border-green-800">
      <div className="flex items-center gap-3 mb-4">
        <PulsingDot color="bg-green-500" />
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Live Calls ({activeCalls.length})
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Active calls in progress
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {activeCalls.map(call => (
          <div 
            key={call.id}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                call.status === 'ringing' 
                  ? 'bg-yellow-100 dark:bg-yellow-900/20' 
                  : 'bg-green-100 dark:bg-green-900/20'
              }`}>
                <Phone className={`w-5 h-5 ${
                  call.status === 'ringing'
                    ? 'text-yellow-600 dark:text-yellow-400 animate-bounce'
                    : 'text-green-600 dark:text-green-400'
                }`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {call.client_name || 'Unknown Client'}
                  </h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    call.status === 'ringing'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {call.status === 'ringing' ? 'Ringing...' : 'Connected'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    call.call_type === 'client'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                  }`}>
                    {call.call_type === 'client' ? 'Client' : 'Broker'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  {call.phone_number && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {call.phone_number}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {durations[call.id] || '0:00'}
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => handleStopCall(call.id)}
              variant="outline"
              size="sm"
              disabled={stoppingCallId === call.id}
              className="ml-4 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {stoppingCallId === call.id ? (
                <>
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-1"></div>
                  Stopping...
                </>
              ) : (
                <>
                  <PhoneOff className="w-4 h-4 mr-1" />
                  Stop Call
                </>
              )}
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
        <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800 dark:text-blue-200">
          Live calls refresh every 5 seconds. Use "Stop Call" to end an active call immediately.
        </p>
      </div>
    </div>
  );
};