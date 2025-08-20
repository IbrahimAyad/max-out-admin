import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

interface HealthCheck {
  status: 'healthy' | 'warning' | 'error';
  message: string;
  count?: number;
  expected?: number;
}

interface SystemHealth {
  timestamp: string;
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  summary: {
    total_checks: number;
    healthy: number;
    warnings: number;
    errors: number;
  };
  checks: Record<string, HealthCheck>;
}

interface SystemHealthCheckerProps {
  autoRun?: boolean;
  showDetails?: boolean;
}

export function SystemHealthChecker({ autoRun = false, showDetails = false }: SystemHealthCheckerProps) {
  const [healthData, setHealthData] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const runHealthCheck = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('system-health-check');

      if (error) {
        console.error('Health check failed:', error);
        toast.error('Health check failed');
        return;
      }

      const healthResult = data?.data || data;
      setHealthData(healthResult);
      setLastChecked(new Date().toLocaleString());

      // Show summary toast
      if (healthResult.overall_status === 'healthy') {
        toast.success('System is healthy');
      } else if (healthResult.overall_status === 'degraded') {
        toast.error(`System has ${healthResult.summary.warnings} warnings`);
      } else {
        toast.error(`System has ${healthResult.summary.errors} errors`);
      }

    } catch (error) {
      console.error('Health check error:', error);
      toast.error('Failed to run health check');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoRun) {
      runHealthCheck();
    }
  }, [autoRun]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
      case 'unhealthy':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-800 bg-green-100 border-green-200';
      case 'warning':
      case 'degraded':
        return 'text-yellow-800 bg-yellow-100 border-yellow-200';
      case 'error':
      case 'unhealthy':
        return 'text-red-800 bg-red-100 border-red-200';
      default:
        return 'text-gray-800 bg-gray-100 border-gray-200';
    }
  };

  if (!showDetails && !healthData) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
        </div>
        
        <button
          onClick={runHealthCheck}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Checking...' : 'Run Check'}</span>
        </button>
      </div>

      {lastChecked && (
        <p className="text-sm text-gray-600 mb-3">Last checked: {lastChecked}</p>
      )}

      {healthData && (
        <>
          {/* Overall Status */}
          <div className={`p-3 rounded-lg border mb-4 ${getStatusColor(healthData.overall_status)}`}>
            <div className="flex items-center space-x-2">
              {getStatusIcon(healthData.overall_status)}
              <span className="font-medium">
                System Status: {healthData.overall_status.toUpperCase()}
              </span>
            </div>
            <div className="mt-2 text-sm">
              {healthData.summary.healthy}/{healthData.summary.total_checks} checks passing
              {healthData.summary.warnings > 0 && `, ${healthData.summary.warnings} warnings`}
              {healthData.summary.errors > 0 && `, ${healthData.summary.errors} errors`}
            </div>
          </div>

          {/* Detailed Checks */}
          {showDetails && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 mb-2">Detailed Checks</h4>
              {Object.entries(healthData.checks).map(([key, check]) => (
                <div key={key} className="flex items-start space-x-3 p-2 bg-gray-50 rounded">
                  {getStatusIcon(check.status)}
                  <div className="flex-1">
                    <div className="font-medium text-sm capitalize">
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div className="text-sm text-gray-600">{check.message}</div>
                    {check.count !== undefined && (
                      <div className="text-xs text-gray-500">
                        Found: {check.count}{check.expected ? `/${check.expected}` : ''}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}