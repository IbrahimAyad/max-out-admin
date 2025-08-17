import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Order, OrderStatus, OrderPriority } from '../config/orders';

interface OrdersState {
  orders: Order[];
  loading: boolean;
  error: string | null;
}

interface OrdersActions {
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updatePriority: (orderId: string, priority: OrderPriority) => Promise<void>;
  getOrderById: (orderId: string) => Order | undefined;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getHighPriorityOrders: () => Order[];
}

export function useOrders(): OrdersState & OrdersActions {
  const [state, setState] = useState<OrdersState>({
    orders: [],
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

      // Fetch orders with order items
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (ordersError) throw ordersError;

      setState(prev => ({
        ...prev,
        orders: orders || [],
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
        .update({ status: status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      setState(prev => ({
        ...prev,
        orders: prev.orders.map(order => 
          order.id === orderId 
            ? { ...order, status: status, updated_at: new Date().toISOString() }
            : order
        )
      }));
    } catch (error) {
      console.error('Error updating order status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update order status');
    }
  }, []);

  // Update order priority
  const updatePriority = useCallback(async (orderId: string, priority: OrderPriority) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_priority: priority })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      setState(prev => ({
        ...prev,
        orders: prev.orders.map(order => 
          order.id === orderId 
            ? { ...order, order_priority: priority }
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
      order.order_priority && 
      [OrderPriority.HIGH, OrderPriority.URGENT, OrderPriority.WEDDING_PARTY, OrderPriority.RUSH].includes(order.order_priority)
    );
  }, [state.orders]);

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

    return () => {
      ordersSubscription.unsubscribe();
    };
  }, [refreshOrders]);

  return {
    ...state,
    refreshOrders,
    updateOrderStatus,
    updatePriority,
    getOrderById,
    getOrdersByStatus,
    getHighPriorityOrders
  };
}