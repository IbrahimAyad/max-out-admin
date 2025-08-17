import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Textarea } from '../../ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { useOrderManagement } from '../../../hooks/useOrderManagement'
import { 
  MessageSquare, 
  Send, 
  Mail, 
  Smartphone,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Plus,
  Search
} from 'lucide-react'

interface CustomerCommunicationsProps {
  data: any
  isLoading: boolean
}

export const CustomerCommunications: React.FC<CustomerCommunicationsProps> = ({ data, isLoading }) => {
  const { sendCommunication, isSendingCommunication } = useOrderManagement()
  
  const [selectedOrder, setSelectedOrder] = useState('')
  const [communicationType, setCommunicationType] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [recipientOverride, setRecipientOverride] = useState('')
  const [sendDialog, setSendDialog] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

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
  
  // Mock communication logs - in real implementation this would come from the API
  const communicationLogs = [
    {
      id: '1',
      order_id: orders[0]?.id || 'order1',
      order_number: orders[0]?.order_number || 'KCT-20250817-0001',
      customer_name: orders[0]?.customer_name || 'John Smith',
      customer_email: orders[0]?.customer_email || 'john@example.com',
      communication_type: 'order_confirmation',
      communication_channel: 'email',
      subject: 'Order Confirmation - KCT-20250817-0001',
      message_content: 'Thank you for your order! Your order has been confirmed...',
      sent_at: '2025-08-17T10:30:00Z',
      delivery_status: 'delivered',
      opened_at: '2025-08-17T10:35:00Z',
      is_automated: true
    },
    {
      id: '2',
      order_id: orders[1]?.id || 'order2',
      order_number: orders[1]?.order_number || 'KCT-20250817-0002',
      customer_name: orders[1]?.customer_name || 'Jane Doe',
      customer_email: orders[1]?.customer_email || 'jane@example.com',
      communication_type: 'processing_update',
      communication_channel: 'email',
      subject: 'Order Update - KCT-20250817-0002',
      message_content: 'Great news! Your order is now being processed...',
      sent_at: '2025-08-17T14:20:00Z',
      delivery_status: 'sent',
      is_automated: true
    }
  ]

  const handleSendCommunication = () => {
    if (selectedOrder && communicationType) {
      sendCommunication({
        orderId: selectedOrder,
        communicationType,
        customMessage: customMessage || undefined
      })
      setSendDialog(false)
      // Reset form
      setSelectedOrder('')
      setCommunicationType('')
      setCustomMessage('')
      setCustomSubject('')
      setRecipientOverride('')
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'order_confirmation': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing_update': return <Clock className="h-4 w-4 text-blue-500" />
      case 'shipping_notification': return <Send className="h-4 w-4 text-purple-500" />
      case 'delay_notification': return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'exception_alert': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'sms': return <Smartphone className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredLogs = communicationLogs.filter(log => {
    const matchesType = filterType === 'all' || log.communication_type === filterType
    const matchesStatus = filterStatus === 'all' || log.delivery_status === filterStatus
    const matchesSearch = searchTerm === '' || 
      log.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesType && matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Messages Sent Today</p>
                <p className="text-2xl font-bold text-blue-600">47</p>
              </div>
              <Send className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Rate</p>
                <p className="text-2xl font-bold text-green-600">94%</p>
              </div>
              <Eye className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
                <p className="text-2xl font-bold text-green-600">98%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Automated</p>
                <p className="text-2xl font-bold text-purple-600">85%</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Communication Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Customer Communications</CardTitle>
            <Dialog open={sendDialog} onOpenChange={setSendDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Send Communication
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Send Customer Communication</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="order">Select Order</Label>
                    <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select order" />
                      </SelectTrigger>
                      <SelectContent>
                        {orders.map((order: any) => (
                          <SelectItem key={order.id} value={order.id}>
                            {order.order_number} - {order.customer_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="type">Communication Type</Label>
                    <Select value={communicationType} onValueChange={setCommunicationType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order_confirmation">Order Confirmation</SelectItem>
                        <SelectItem value="payment_confirmation">Payment Confirmation</SelectItem>
                        <SelectItem value="processing_update">Processing Update</SelectItem>
                        <SelectItem value="shipping_notification">Shipping Notification</SelectItem>
                        <SelectItem value="delivery_confirmation">Delivery Confirmation</SelectItem>
                        <SelectItem value="delay_notification">Delay Notification</SelectItem>
                        <SelectItem value="exception_alert">Exception Alert</SelectItem>
                        <SelectItem value="custom_message">Custom Message</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {communicationType === 'custom_message' && (
                    <>
                      <div>
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          value={customSubject}
                          onChange={(e) => setCustomSubject(e.target.value)}
                          placeholder="Email subject"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          placeholder="Enter your message..."
                          rows={4}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="recipient">Recipient Override (optional)</Label>
                        <Input
                          id="recipient"
                          value={recipientOverride}
                          onChange={(e) => setRecipientOverride(e.target.value)}
                          placeholder="Override email address"
                        />
                      </div>
                    </>
                  )}
                  
                  <Button 
                    onClick={handleSendCommunication} 
                    disabled={!selectedOrder || !communicationType || isSendingCommunication}
                    className="w-full"
                  >
                    {isSendingCommunication ? 'Sending...' : 'Send Communication'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search communications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="order_confirmation">Order Confirmation</SelectItem>
                <SelectItem value="processing_update">Processing Update</SelectItem>
                <SelectItem value="shipping_notification">Shipping Notification</SelectItem>
                <SelectItem value="delay_notification">Delay Notification</SelectItem>
                <SelectItem value="exception_alert">Exception Alert</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Communication Logs */}
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <Card key={log.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(log.communication_type)}
                        {getChannelIcon(log.communication_channel)}
                      </div>
                      
                      <div>
                        <div className="font-medium text-gray-900">
                          {log.subject}
                        </div>
                        <div className="text-sm text-gray-500">
                          To: {log.customer_name} ({log.customer_email})
                        </div>
                        <div className="text-sm text-gray-500">
                          Order: {log.order_number}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <Badge className={getDeliveryStatusColor(log.delivery_status)}>
                          {log.delivery_status.toUpperCase()}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          {log.is_automated ? 'Automated' : 'Manual'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(log.sent_at).toLocaleString()}
                        </div>
                        {log.opened_at && (
                          <div className="text-xs text-green-600">
                            Opened: {new Date(log.opened_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {log.message_content.substring(0, 150)}...
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredLogs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No communications found matching your filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}