import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  PieChart,
  Download
} from 'lucide-react'
import { weddingAPI } from '../lib/supabase'

interface WeddingAnalyticsProps {
  weddingId: string
}

export function WeddingAnalytics({ weddingId }: WeddingAnalyticsProps) {
  const [dateRange, setDateRange] = useState('30d')

  // Get wedding analytics
  const { data: analytics } = useQuery({
    queryKey: ['wedding-analytics', weddingId, dateRange],
    queryFn: () => weddingAPI.getWedding(weddingId, { include_analytics: true, date_range: dateRange })
  })

  const analyticsData = analytics?.data?.analytics || {
    revenue: {
      total: 0,
      growth: 0,
      average_per_member: 0,
      payment_completion_rate: 0
    },
    timeline: {
      completion_rate: 0,
      on_time_percentage: 0,
      overdue_tasks: 0,
      critical_path_status: 'on_track'
    },
    customer_satisfaction: {
      overall_score: 0,
      response_rate: 0,
      issues_resolved: 0,
      average_response_time: 0
    },
    performance: {
      conversion_rate: 0,
      referral_rate: 0,
      repeat_customer_rate: 0,
      coordination_efficiency: 0
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`
  }

  const getStatusColor = (status: string) => {
    const colors = {
      on_track: 'text-green-600 bg-green-100',
      at_risk: 'text-yellow-600 bg-yellow-100',
      behind: 'text-red-600 bg-red-100'
    }
    return colors[status as keyof typeof colors] || colors.on_track
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Wedding Analytics</h3>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <button className="bg-black text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-800 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Revenue Analytics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Revenue Performance</h4>
          <DollarSign className="w-6 h-6 text-green-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.revenue.total)}</p>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">+{formatPercentage(analyticsData.revenue.growth)} growth</span>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">Avg per Member</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.revenue.average_per_member)}</p>
            <p className="text-sm text-gray-500 mt-2">Average spending</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">Payment Rate</p>
            <p className="text-2xl font-bold text-gray-900">{formatPercentage(analyticsData.revenue.payment_completion_rate)}</p>
            <p className="text-sm text-gray-500 mt-2">Completion rate</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">Profitability</p>
            <p className="text-2xl font-bold text-gray-900">High</p>
            <div className="flex items-center mt-2">
              <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">Above average</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Performance */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Timeline Performance</h4>
          <Clock className="w-6 h-6 text-blue-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">Completion Rate</p>
            <p className="text-2xl font-bold text-gray-900">{formatPercentage(analyticsData.timeline.completion_rate)}</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analyticsData.timeline.completion_rate}%` }}
              />
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">On-Time Tasks</p>
            <p className="text-2xl font-bold text-gray-900">{formatPercentage(analyticsData.timeline.on_time_percentage)}</p>
            <div className="flex items-center mt-2">
              <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">Meeting deadlines</span>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
            <p className="text-2xl font-bold text-gray-900">{analyticsData.timeline.overdue_tasks}</p>
            {analyticsData.timeline.overdue_tasks > 0 ? (
              <div className="flex items-center mt-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mr-1" />
                <span className="text-sm text-red-600">Needs attention</span>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-2">All on track</p>
            )}
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">Critical Path</p>
            <div className="flex items-center mt-1">
              <span className={`px-2 py-1 text-sm font-medium rounded-full ${getStatusColor(analyticsData.timeline.critical_path_status)}`}>
                {analyticsData.timeline.critical_path_status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Project status</p>
          </div>
        </div>
      </div>

      {/* Customer Satisfaction */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Customer Satisfaction</h4>
          <Users className="w-6 h-6 text-purple-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">Overall Score</p>
            <p className="text-2xl font-bold text-gray-900">{analyticsData.customer_satisfaction.overall_score}/10</p>
            <div className="flex items-center mt-2">
              {analyticsData.customer_satisfaction.overall_score >= 8 ? (
                <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
              ) : analyticsData.customer_satisfaction.overall_score >= 6 ? (
                <Clock className="w-4 h-4 text-yellow-600 mr-1" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm ${
                analyticsData.customer_satisfaction.overall_score >= 8 ? 'text-green-600' :
                analyticsData.customer_satisfaction.overall_score >= 6 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {analyticsData.customer_satisfaction.overall_score >= 8 ? 'Excellent' :
                 analyticsData.customer_satisfaction.overall_score >= 6 ? 'Good' : 'Needs Improvement'}
              </span>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">Response Rate</p>
            <p className="text-2xl font-bold text-gray-900">{formatPercentage(analyticsData.customer_satisfaction.response_rate)}</p>
            <p className="text-sm text-gray-500 mt-2">Feedback received</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">Issues Resolved</p>
            <p className="text-2xl font-bold text-gray-900">{analyticsData.customer_satisfaction.issues_resolved}</p>
            <p className="text-sm text-gray-500 mt-2">Successfully handled</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
            <p className="text-2xl font-bold text-gray-900">{analyticsData.customer_satisfaction.average_response_time}h</p>
            <p className="text-sm text-gray-500 mt-2">Support response</p>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Performance Metrics</h4>
          <BarChart3 className="w-6 h-6 text-indigo-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Conversion Rate</span>
              <span className="text-lg font-bold text-gray-900">{formatPercentage(analyticsData.performance.conversion_rate)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analyticsData.performance.conversion_rate}%` }}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Referral Rate</span>
              <span className="text-lg font-bold text-gray-900">{formatPercentage(analyticsData.performance.referral_rate)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analyticsData.performance.referral_rate}%` }}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Repeat Customers</span>
              <span className="text-lg font-bold text-gray-900">{formatPercentage(analyticsData.performance.repeat_customer_rate)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analyticsData.performance.repeat_customer_rate}%` }}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Coordination Efficiency</span>
              <span className="text-lg font-bold text-gray-900">{formatPercentage(analyticsData.performance.coordination_efficiency)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analyticsData.performance.coordination_efficiency}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <TrendingUp className="w-6 h-6 text-yellow-600 mt-1" />
          <div>
            <h4 className="text-lg font-semibold text-yellow-900">Optimization Recommendations</h4>
            <ul className="mt-2 space-y-1 text-sm text-yellow-800">
              {analyticsData.timeline.overdue_tasks > 0 && (
                <li>• Focus on completing {analyticsData.timeline.overdue_tasks} overdue tasks to improve timeline performance</li>
              )}
              {analyticsData.revenue.payment_completion_rate < 80 && (
                <li>• Implement automated payment reminders to improve payment completion rate</li>
              )}
              {analyticsData.customer_satisfaction.overall_score < 8 && (
                <li>• Review customer feedback and address common issues to boost satisfaction</li>
              )}
              <li>• Continue excellent coordination - wedding is progressing well overall</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}