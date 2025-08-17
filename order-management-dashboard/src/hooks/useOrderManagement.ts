import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export interface OrderManagementData {
  orders: any[]
  queueStatus: any
  processingMetrics: any
  exceptions: any[]
  realTimeMetrics: any
}

export const useOrderManagement = () => {
  const [timeframe, setTimeframe] = useState('7d')
  const queryClient = useQueryClient()

  // Get order management dashboard data
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useQuery({
    queryKey: ['order-management', 'dashboard', timeframe],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_management_dashboard')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      return data
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000 // 1 minute
  })

  // Get queue status
  const { data: queueData, isLoading: queueLoading, refetch: refetchQueue } = useQuery({
    queryKey: ['order-management', 'queue'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('priority-queue-management', {
        body: { action: 'get_queue_status', queueType: 'processing' }
      })
      if (error) throw error
      return data.data
    },
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000 // 30 seconds
  })

  // Get processing analytics
  const { data: analyticsData, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ['order-management', 'analytics', timeframe],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('processing-analytics', {
        body: { action: 'get_efficiency_dashboard', timeframe: timeframe.replace('d', '') }
      })
      if (error) throw error
      return data.data
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 300000 // 5 minutes
  })

  // Get real-time metrics
  const { data: realTimeData, isLoading: realTimeLoading, refetch: refetchRealTime } = useQuery({
    queryKey: ['order-management', 'realtime'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('processing-analytics', {
        body: { action: 'real_time_metrics' }
      })
      if (error) throw error
      return data.data
    },
    staleTime: 10000, // 10 seconds
    refetchInterval: 15000 // 15 seconds
  })

  // Get active exceptions
  const { data: exceptionsData, isLoading: exceptionsLoading, refetch: refetchExceptions } = useQuery({
    queryKey: ['order-management', 'exceptions'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('exception-handling', {
        body: { action: 'get_exceptions' }
      })
      if (error) throw error
      return data.data
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000 // 1 minute
  })

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus, notes, statusReason }: {
      orderId: string
      newStatus: string
      notes?: string
      statusReason?: string
    }) => {
      const { data, error } = await supabase.functions.invoke('order-status-update', {
        body: {
          orderId,
          newStatus,
          notes,
          statusReason
        }
      })
      if (error) throw error
      return data.data
    },
    onSuccess: (data) => {
      toast.success(`Order status updated to ${data.newStatus}`)
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['order-management'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update order status')
    }
  })

  // Assign order to processor mutation
  const assignOrderMutation = useMutation({
    mutationFn: async ({ userId, queueType = 'processing' }: {
      userId: string
      queueType?: string
    }) => {
      const { data, error } = await supabase.functions.invoke('priority-queue-management', {
        body: {
          action: 'assign_next',
          assignToUserId: userId,
          queueType
        }
      })
      if (error) throw error
      return data.data
    },
    onSuccess: (data) => {
      if (data.assigned) {
        toast.success(`Order ${data.orderId} assigned successfully`)
      } else {
        toast.info(data.message || 'No orders available for assignment')
      }
      queryClient.invalidateQueries({ queryKey: ['order-management'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign order')
    }
  })

  // Escalate order mutation
  const escalateOrderMutation = useMutation({
    mutationFn: async ({ orderId }: { orderId: string }) => {
      const { data, error } = await supabase.functions.invoke('priority-queue-management', {
        body: {
          action: 'escalate_order',
          orderId
        }
      })
      if (error) throw error
      return data.data
    },
    onSuccess: (data) => {
      toast.success(`Order ${data.orderId} escalated successfully`)
      queryClient.invalidateQueries({ queryKey: ['order-management'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to escalate order')
    }
  })

  // Create exception mutation
  const createExceptionMutation = useMutation({
    mutationFn: async ({ orderId, exceptionType, severity, description }: {
      orderId: string
      exceptionType: string
      severity: string
      description: string
    }) => {
      const { data, error } = await supabase.functions.invoke('exception-handling', {
        body: {
          action: 'create_exception',
          orderId,
          exceptionType,
          severity,
          description
        }
      })
      if (error) throw error
      return data.data
    },
    onSuccess: () => {
      toast.success('Exception created successfully')
      queryClient.invalidateQueries({ queryKey: ['order-management'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create exception')
    }
  })

  // Resolve exception mutation
  const resolveExceptionMutation = useMutation({
    mutationFn: async ({ exceptionId, resolutionNotes }: {
      exceptionId: string
      resolutionNotes: string
    }) => {
      const { data, error } = await supabase.functions.invoke('exception-handling', {
        body: {
          action: 'resolve_exception',
          exceptionId,
          resolutionNotes
        }
      })
      if (error) throw error
      return data.data
    },
    onSuccess: () => {
      toast.success('Exception resolved successfully')
      queryClient.invalidateQueries({ queryKey: ['order-management'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to resolve exception')
    }
  })

  // Send customer communication mutation
  const sendCommunicationMutation = useMutation({
    mutationFn: async ({ orderId, communicationType, customMessage }: {
      orderId: string
      communicationType: string
      customMessage?: string
    }) => {
      const { data, error } = await supabase.functions.invoke('customer-communication', {
        body: {
          orderId,
          communicationType,
          customMessage,
          triggerReason: 'Manual communication'
        }
      })
      if (error) throw error
      return data.data
    },
    onSuccess: (data) => {
      toast.success(`Communication sent to ${data.recipient}`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send communication')
    }
  })

  // Refresh all data
  const refreshAll = useCallback(() => {
    refetchDashboard()
    refetchQueue()
    refetchAnalytics()
    refetchRealTime()
    refetchExceptions()
  }, [refetchDashboard, refetchQueue, refetchAnalytics, refetchRealTime, refetchExceptions])

  const isLoading = dashboardLoading || queueLoading || analyticsLoading || 
                   realTimeLoading || exceptionsLoading

  return {
    // Data
    data: {
      orders: dashboardData || [],
      queueStatus: queueData,
      processingMetrics: analyticsData,
      realTimeMetrics: realTimeData,
      exceptions: exceptionsData?.exceptions || []
    },
    
    // Loading states
    isLoading,
    dashboardLoading,
    queueLoading,
    analyticsLoading,
    realTimeLoading,
    exceptionsLoading,
    
    // Error
    error: dashboardError,
    
    // State
    timeframe,
    setTimeframe,
    
    // Actions
    updateOrderStatus: updateOrderStatusMutation.mutate,
    assignOrder: assignOrderMutation.mutate,
    escalateOrder: escalateOrderMutation.mutate,
    createException: createExceptionMutation.mutate,
    resolveException: resolveExceptionMutation.mutate,
    sendCommunication: sendCommunicationMutation.mutate,
    
    // Action states
    isUpdatingStatus: updateOrderStatusMutation.isPending,
    isAssigning: assignOrderMutation.isPending,
    isEscalating: escalateOrderMutation.isPending,
    isCreatingException: createExceptionMutation.isPending,
    isResolvingException: resolveExceptionMutation.isPending,
    isSendingCommunication: sendCommunicationMutation.isPending,
    
    // Utils
    refreshAll
  }
}