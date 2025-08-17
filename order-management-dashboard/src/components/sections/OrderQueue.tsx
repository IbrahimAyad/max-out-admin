import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Textarea } from '../../ui/textarea'
import { useOrderManagement } from '../../../hooks/useOrderManagement'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_PRIORITY_LABELS, ORDER_PRIORITY_COLORS } from '../../../lib/supabase'
import { 
  ArrowUp, 
  ArrowDown, 
  Clock, 
  User, 
  Package, 
  AlertCircle,
  CheckCircle, 
  Play,
  MoreHorizontal,
  Edit,
  MessageSquare
} from 'lucide-react'

interface OrderQueueProps {
  data: any
  isLoading: boolean
}

export const OrderQueue: React.FC<OrderQueueProps> = ({ data, isLoading }) => {
  const { 
    updateOrderStatus, 
    assignOrder, 
    escalateOrder, 
    sendCommunication,
    isUpdatingStatus,
    isAssigning,
    isEscalating
  } = useOrderManagement()

  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false)
  const [assignDialog, setAssignDialog] = useState(false)
  const [communicationDialog, setCommunicationDialog] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [statusNotes, setStatusNotes] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [communicationType, setCommunicationType] = useState('')
  const [customMessage, setCustomMessage] = useState('')

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const orders = data?.orders || []
  const queueStatus = data?.queueStatus || {}

  const handleStatusUpdate = () => {
    if (selectedOrder && newStatus) {
      updateOrderStatus({
        orderId: selectedOrder.id,
        newStatus,
        notes: statusNotes,
        statusReason: 'Manual update'
      })
      setStatusUpdateDialog(false)
      setNewStatus('')
      setStatusNotes('')
    }
  }

  const handleAssignOrder = () => {
    if (assigneeId) {
      assignOrder({ userId: assigneeId })
      setAssignDialog(false)
      setAssigneeId('')
    }
  }

  const handleSendCommunication = () => {
    if (selectedOrder && communicationType) {
      sendCommunication({
        orderId: selectedOrder.id,
        communicationType,
        customMessage: customMessage || undefined
      })
      setCommunicationDialog(false)
      setCommunicationType('')
      setCustomMessage('')
    }
  }

  const getPriorityIcon = (priority: string) => {
    if (['urgent', 'rush', 'vip_customer'].includes(priority)) {
      return <ArrowUp className="h-4 w-4 text-red-500" />
    } else if (['wedding_party', 'prom_group'].includes(priority)) {
      return <ArrowUp className="h-4 w-4 text-pink-500" />
    } else if (priority === 'high') {
      return <ArrowUp className="h-4 w-4 text-orange-500" />
    } else if (priority === 'low') {
      return <ArrowDown className="h-4 w-4 text-gray-500" />
    }
    return <Clock className="h-4 w-4 text-blue-500" />
  }

  const getDeliveryUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Queue Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Queue Length</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {queueStatus.queueLength || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Orders waiting</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Processing Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {queueStatus.avgProcessingTimeMinutes ? 
                `${Math.round(queueStatus.avgProcessingTimeMinutes / 60)}h` : 
                'N/A'
              }
            </div>
            <p className="text-xs text-gray-500 mt-1">From payment to delivery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Play className="h-4 w-4 mr-1" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full" disabled={isAssigning}>
                  <User className="h-4 w-4 mr-2" />
                  Assign Next Order
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Next Order</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="assignee">Assign to Processor ID</Label>
                    <Input
                      id="assignee"
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      placeholder="Enter processor user ID"
                    />
                  </div>
                  <Button onClick={handleAssignOrder} disabled={!assigneeId || isAssigning}>
                    {isAssigning ? 'Assigning...' : 'Assign Order'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Order Queue</span>
            <Badge variant="outline">{orders.length} orders</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orders.map((order: any) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getPriorityIcon(order.order_priority)}
                        <div>
                          <div className="font-medium text-gray-900">
                            Order {order.order_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.customer_name} • {order.customer_email}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={ORDER_STATUS_COLORS[order.current_status as keyof typeof ORDER_STATUS_COLORS]}>
                          {ORDER_STATUS_LABELS[order.current_status as keyof typeof ORDER_STATUS_LABELS]}
                        </Badge>
                        
                        <Badge className={ORDER_PRIORITY_COLORS[order.order_priority as keyof typeof ORDER_PRIORITY_COLORS]}>
                          {ORDER_PRIORITY_LABELS[order.order_priority as keyof typeof ORDER_PRIORITY_LABELS]}
                        </Badge>
                        
                        {order.delivery_urgency && (
                          <Badge className={getDeliveryUrgencyColor(order.delivery_urgency)}>
                            {order.delivery_urgency.toUpperCase()}
                          </Badge>
                        )}
                        
                        {order.has_exceptions && (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Exception
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          ${order.total_amount?.toFixed(2) || '0.00'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.item_count} items
                        </div>
                        {order.queue_position && order.queue_position < 999 && (
                          <div className="text-xs text-gray-400">
                            Queue #{order.queue_position}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        {/* Status Update */}
                        <Dialog open={statusUpdateDialog && selectedOrder?.id === order.id} 
                               onOpenChange={(open) => {
                                 setStatusUpdateDialog(open)
                                 if (open) setSelectedOrder(order)
                               }}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Order Status</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="status">New Status</Label>
                                <Select value={newStatus} onValueChange={setNewStatus}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                                      <SelectItem key={value} value={value}>{label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                  id="notes"
                                  value={statusNotes}
                                  onChange={(e) => setStatusNotes(e.target.value)}
                                  placeholder="Optional notes..."
                                />
                              </div>
                              <Button onClick={handleStatusUpdate} disabled={!newStatus || isUpdatingStatus}>
                                {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {/* Communication */}
                        <Dialog open={communicationDialog && selectedOrder?.id === order.id}
                               onOpenChange={(open) => {
                                 setCommunicationDialog(open)
                                 if (open) setSelectedOrder(order)
                               }}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Send Customer Communication</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="commType">Communication Type</Label>
                                <Select value={communicationType} onValueChange={setCommunicationType}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="processing_update">Processing Update</SelectItem>
                                    <SelectItem value="delay_notification">Delay Notification</SelectItem>
                                    <SelectItem value="custom_message">Custom Message</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              {communicationType === 'custom_message' && (
                                <div>
                                  <Label htmlFor="message">Custom Message</Label>
                                  <Textarea
                                    id="message"
                                    value={customMessage}
                                    onChange={(e) => setCustomMessage(e.target.value)}
                                    placeholder="Enter your message..."
                                  />
                                </div>
                              )}
                              <Button onClick={handleSendCommunication} disabled={!communicationType}>
                                Send Communication
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {/* Escalate */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => escalateOrder({ orderId: order.id })}
                          disabled={isEscalating}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {orders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No orders in queue</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}