import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  Order,
  OrderException,
  CommunicationLog,
  ProcessingAnalytics,
  OrderPriorityQueue,
  OrderStatus,
  PriorityLevel,
  DASHBOARD_CONFIG
} from '../config/orders';

interface OrdersState {
  orders: Order[];
  exceptions: OrderException[];
  communications: CommunicationLog[];
  analytics: ProcessingAnalytics[];
  priorityQueue: OrderPriorityQueue[];
  loading: boolean;
  error: string | null;
}

interface OrdersActions {
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  createException: (orderId: string, type: string, description: string) => Promise<void>;
  resolveException: (exceptionId: string, notes: string) => Promise<void>;
  addCommunication: (log: Omit<CommunicationLog, 'id'>) => Promise<void>;
  updatePriority: (orderId: string, priority: PriorityLevel) => Promise<void>;
  getOrderById: (orderId: string) => Order | undefined;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getHighPriorityOrders: () => Order[];
  getRecentAnalytics: () => ProcessingAnalytics[];
}

export function useOrders(): OrdersState & OrdersActions {
  const [state, setState] = useState<OrdersState>({
    orders: [],
    exceptions: [],
    communications: [],
    analytics: [],
    priorityQueue: [],
    loading: true,
    error: null
  });

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  // Fetch all orders with related data
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch orders with customer and order items
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          customers (*),
          order_items (*)
        `)
        .order('created_at', { ascending: false })
        .limit(DASHBOARD_CONFIG.MAX_RECENT_ORDERS);

      if (ordersError) throw ordersError;

      // Fetch exceptions
      const { data: exceptions, error: exceptionsError } = await supabase
        .from('order_exceptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (exceptionsError) throw exceptionsError;

      // Fetch communication logs
      const { data: communications, error: communicationsError } = await supabase
        .from('communication_logs')
        .select('*')
        .order('sent_at', { ascending: false });

      if (communicationsError) throw communicationsError;

      // Fetch analytics
      const { data: analytics, error: analyticsError } = await supabase
        .from('processing_analytics')
        .select('*')
        .order('created_at', { ascending: false });

      if (analyticsError) throw analyticsError;

      // Fetch priority queue
      const { data: priorityQueue, error: queueError } = await supabase
        .from('order_priority_queue')
        .select('*')
        .order('queue_position', { ascending: true });

      if (queueError) throw queueError;

      setState(prev => ({
        ...prev,
        orders: orders || [],
        exceptions: exceptions || [],
        communications: communications || [],
        analytics: analytics || [],
        priorityQueue: priorityQueue || [],
        loading: false
      }));
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch orders');
      setLoading(false);
    }
  }, []);

  // Refresh orders data
  const refreshOrders = useCallback(async () => {
    await fetchOrders();
  }, [fetchOrders]);

  // Update order status
  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      setState(prev => ({
        ...prev,
        orders: prev.orders.map(order => 
          order.id === orderId 
            ? { ...order, status, updated_at: new Date().toISOString() }
            : order
        )
      }));
    } catch (error) {
      console.error('Error updating order status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update order status');
    }
  }, []);

  // Create new exception
  const createException = useCallback(async (orderId: string, type: string, description: string) => {
    try {
      const { data, error } = await supabase
        .from('order_exceptions')
        .insert({
          order_id: orderId,
          exception_type: type,
          description,
          status: 'open',
          priority_level: 'medium'
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setState(prev => ({
        ...prev,
        exceptions: [data, ...prev.exceptions]
      }));
    } catch (error) {
      console.error('Error creating exception:', error);
      setError(error instanceof Error ? error.message : 'Failed to create exception');
    }
  }, []);

  // Resolve exception
  const resolveException = useCallback(async (exceptionId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('order_exceptions')
        .update({ 
          status: 'resolved',
          resolution_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', exceptionId);

      if (error) throw error;

      // Update local state
      setState(prev => ({
        ...prev,
        exceptions: prev.exceptions.map(exception => 
          exception.id === exceptionId 
            ? { 
                ...exception, 
                status: 'resolved' as any,
                resolution_notes: notes,
                updated_at: new Date().toISOString()
              }
            : exception
        )
      }));
    } catch (error) {
      console.error('Error resolving exception:', error);
      setError(error instanceof Error ? error.message : 'Failed to resolve exception');
    }
  }, []);

  // Add communication log
  const addCommunication = useCallback(async (log: Omit<CommunicationLog, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('communication_logs')
        .insert(log)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setState(prev => ({
        ...prev,
        communications: [data, ...prev.communications]
      }));
    } catch (error) {
      console.error('Error adding communication:', error);
      setError(error instanceof Error ? error.message : 'Failed to add communication');
    }
  }, []);

  // Update order priority
  const updatePriority = useCallback(async (orderId: string, priority: PriorityLevel) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ priority_level: priority })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      setState(prev => ({
        ...prev,
        orders: prev.orders.map(order => 
          order.id === orderId 
            ? { ...order, priority_level: priority }
            : order
        )
      }));
    } catch (error) {
      console.error('Error updating priority:', error);
      setError(error instanceof Error ? error.message : 'Failed to update priority');
    }
  }, []);

  // Helper functions
  const getOrderById = useCallback((orderId: string) => {
    return state.orders.find(order => order.id === orderId);
  }, [state.orders]);

  const getOrdersByStatus = useCallback((status: OrderStatus) => {
    return state.orders.filter(order => order.status === status);
  }, [state.orders]);

  const getHighPriorityOrders = useCallback(() => {
    return state.orders.filter(order => 
      order.priority_level && 
      [PriorityLevel.HIGH, PriorityLevel.URGENT, PriorityLevel.WEDDING, PriorityLevel.RUSH].includes(order.priority_level)
    );
  }, [state.orders]);

  const getRecentAnalytics = useCallback(() => {
    return state.analytics.slice(0, 10);
  }, [state.analytics]);

  // Initial data fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Set up real-time subscriptions
  useEffect(() => {
    const ordersSubscription = supabase
      .channel('orders_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          refreshOrders();
        }
      )
      .subscribe();

    const exceptionsSubscription = supabase
      .channel('exceptions_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'order_exceptions' },
        () => {
          refreshOrders();
        }
      )
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
      exceptionsSubscription.unsubscribe();
    };
  }, [refreshOrders]);

  return {
    ...state,
    refreshOrders,
    updateOrderStatus,
    createException,
    resolveException,
    addCommunication,
    updatePriority,
    getOrderById,
    getOrdersByStatus,
    getHighPriorityOrders,
    getRecentAnalytics
  };
}