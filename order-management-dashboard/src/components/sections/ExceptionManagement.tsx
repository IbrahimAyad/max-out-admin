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
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowUp,
  User,
  MessageSquare,
  Plus,
  Search
} from 'lucide-react'

interface ExceptionManagementProps {
  data: any
  isLoading: boolean
}

export const ExceptionManagement: React.FC<ExceptionManagementProps> = ({ data, isLoading }) => {
  const { 
    createException, 
    resolveException, 
    sendCommunication,
    isCreatingException,
    isResolvingException
  } = useOrderManagement()

  const [selectedOrder, setSelectedOrder] = useState('')
  const [exceptionType, setExceptionType] = useState('')
  const [severity, setSeverity] = useState('')
  const [description, setDescription] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [selectedException, setSelectedException] = useState<any>(null)
  const [createDialog, setCreateDialog] = useState(false)
  const [resolveDialog, setResolveDialog] = useState(false)
  const [filterSeverity, setFilterSeverity] = useState('all')
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

  const exceptions = data?.exceptions || []
  const orders = data?.orders || []

  // Filter exceptions
  const filteredExceptions = exceptions.filter((exception: any) => {
    const matchesSeverity = filterSeverity === 'all' || exception.severity === filterSeverity
    const matchesStatus = filterStatus === 'all' || exception.status === filterStatus
    const matchesSearch = searchTerm === '' || 
      exception.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exception.exception_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exception.order_id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSeverity && matchesStatus && matchesSearch
  })

  const handleCreateException = () => {
    if (selectedOrder && exceptionType && severity && description) {
      createException({
        orderId: selectedOrder,
        exceptionType,
        severity,
        description
      })
      setCreateDialog(false)
      // Reset form
      setSelectedOrder('')
      setExceptionType('')
      setSeverity('')
      setDescription('')
    }
  }

  const handleResolveException = () => {
    if (selectedException && resolutionNotes) {
      resolveException({
        exceptionId: selectedException.id,
        resolutionNotes
      })
      setResolveDialog(false)
      setResolutionNotes('')
      setSelectedException(null)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'escalated': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'high': return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  // Calculate summary stats
  const openExceptions = exceptions.filter((e: any) => e.status === 'open').length
  const criticalExceptions = exceptions.filter((e: any) => e.severity === 'critical').length
  const resolvedToday = exceptions.filter((e: any) => 
    e.status === 'resolved' && 
    new Date(e.resolved_at || '').toDateString() === new Date().toDateString()
  ).length

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Exceptions</p>
                <p className="text-2xl font-bold text-red-600">{openExceptions}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Issues</p>
                <p className="text-2xl font-bold text-red-600">{criticalExceptions}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved Today</p>
                <p className="text-2xl font-bold text-green-600">{resolvedToday}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Exceptions</p>
                <p className="text-2xl font-bold text-gray-900">{exceptions.length}</p>
              </div>
              <User className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Exception Management</CardTitle>
            <Dialog open={createDialog} onOpenChange={setCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Exception
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Exception</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="order">Order</Label>
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
                    <Label htmlFor="type">Exception Type</Label>
                    <Select value={exceptionType} onValueChange={setExceptionType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="payment_failed">Payment Failed</SelectItem>
                        <SelectItem value="stock_out">Stock Out</SelectItem>
                        <SelectItem value="quality_issue">Quality Issue</SelectItem>
                        <SelectItem value="shipping_delay">Shipping Delay</SelectItem>
                        <SelectItem value="customer_request">Customer Request</SelectItem>
                        <SelectItem value="system_error">System Error</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="severity">Severity</Label>
                    <Select value={severity} onValueChange={setSeverity}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the exception..."
                    />
                  </div>
                  
                  <Button 
                    onClick={handleCreateException} 
                    disabled={!selectedOrder || !exceptionType || !severity || !description || isCreatingException}
                    className="w-full"
                  >
                    {isCreatingException ? 'Creating...' : 'Create Exception'}
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
                placeholder="Search exceptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Exceptions List */}
          <div className="space-y-3">
            {filteredExceptions.map((exception: any) => (
              <Card key={exception.id} className={`border-l-4 hover:shadow-md transition-shadow ${
                exception.severity === 'critical' ? 'border-l-red-500' :
                exception.severity === 'high' ? 'border-l-orange-500' :
                exception.severity === 'medium' ? 'border-l-yellow-500' :
                'border-l-green-500'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getSeverityIcon(exception.severity)}
                      <div>
                        <div className="font-medium text-gray-900">
                          {exception.title || `${exception.exception_type} - Order ${exception.order_id}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {exception.description}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Created: {new Date(exception.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <Badge className={getSeverityColor(exception.severity)}>
                          {exception.severity.toUpperCase()}
                        </Badge>
                        <div className="mt-1">
                          <Badge className={getStatusColor(exception.status)}>
                            {exception.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        {exception.status !== 'resolved' && (
                          <Dialog open={resolveDialog && selectedException?.id === exception.id}
                                 onOpenChange={(open) => {
                                   setResolveDialog(open)
                                   if (open) setSelectedException(exception)
                                 }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Resolve Exception</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="resolution">Resolution Notes</Label>
                                  <Textarea
                                    id="resolution"
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                    placeholder="Describe how this exception was resolved..."
                                  />
                                </div>
                                <Button 
                                  onClick={handleResolveException} 
                                  disabled={!resolutionNotes || isResolvingException}
                                >
                                  {isResolvingException ? 'Resolving...' : 'Resolve Exception'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendCommunication({
                            orderId: exception.order_id,
                            communicationType: 'exception_alert',
                            customMessage: `We're addressing an issue with your order: ${exception.description}`
                          })}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredExceptions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No exceptions found matching your filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}