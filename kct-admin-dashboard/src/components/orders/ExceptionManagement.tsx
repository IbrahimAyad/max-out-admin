import React, { useState } from 'react';
import { AlertTriangle, Clock, CheckCircle, ArrowUpCircle, User, Calendar } from 'lucide-react';
import { OrderException, ExceptionStatus, PriorityLevel } from '../../config/orders';

interface ExceptionManagementProps {
  exceptions: OrderException[];
  onResolveException: (exceptionId: string, notes: string) => void;
  onCreateException: (orderId: string, type: string, description: string) => void;
}

export function ExceptionManagement({ 
  exceptions, 
  onResolveException, 
  onCreateException 
}: ExceptionManagementProps) {
  const [selectedException, setSelectedException] = useState<OrderException | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newException, setNewException] = useState({
    orderId: '',
    type: '',
    description: ''
  });

  const openExceptions = exceptions.filter(e => e.status === 'open' || e.status === 'in_progress');
  const resolvedExceptions = exceptions.filter(e => e.status === 'resolved');

  const getStatusColor = (status: ExceptionStatus) => {
    const colors: Record<ExceptionStatus, string> = {
      'open': 'bg-red-100 text-red-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'resolved': 'bg-green-100 text-green-800',
      'escalated': 'bg-purple-100 text-purple-800'
    };
    return colors[status];
  };

  const getPriorityColor = (priority: PriorityLevel) => {
    const colors: Record<PriorityLevel, string> = {
      'low': 'bg-gray-100 text-gray-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800',
      'wedding': 'bg-purple-100 text-purple-800',
      'rush': 'bg-yellow-100 text-yellow-800'
    };
    return colors[priority];
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  const handleResolveException = () => {
    if (selectedException && resolutionNotes.trim()) {
      onResolveException(selectedException.id, resolutionNotes);
      setSelectedException(null);
      setResolutionNotes('');
    }
  };

  const handleCreateException = () => {
    if (newException.orderId && newException.type && newException.description) {
      onCreateException(newException.orderId, newException.type, newException.description);
      setNewException({ orderId: '', type: '', description: '' });
      setShowCreateForm(false);
    }
  };

  const exceptionTypes = [
    'Payment Issue',
    'Inventory Shortage',
    'Shipping Delay',
    'Customer Request',
    'Product Defect',
    'Address Issue',
    'Rush Order',
    'Special Requirements',
    'Other'
  ];

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
            Exception Management
          </h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Create Exception
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{openExceptions.length}</div>
            <div className="text-sm text-gray-600">Open Issues</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {exceptions.filter(e => e.status === 'in_progress').length}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{resolvedExceptions.length}</div>
            <div className="text-sm text-gray-600">Resolved Today</div>
          </div>
        </div>
      </div>

      {/* Create Exception Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Exception</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order ID</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newException.orderId}
                onChange={(e) => setNewException(prev => ({ ...prev, orderId: e.target.value }))}
                placeholder="Enter order ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Exception Type</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newException.type}
                onChange={(e) => setNewException(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="">Select type</option>
                {exceptionTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={newException.description}
              onChange={(e) => setNewException(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the exception"
            />
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleCreateException}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Create Exception
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Open Exceptions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Open Exceptions</h3>
        </div>
        
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {openExceptions.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No open exceptions</p>
            </div>
          ) : (
            openExceptions.map((exception) => (
              <div key={exception.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        #{exception.order_id.slice(-8)}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getStatusColor(exception.status)
                      }`}>
                        {exception.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getPriorityColor(exception.priority_level)
                      }`}>
                        {exception.priority_level.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="text-sm font-medium text-gray-800 mb-1">
                      {exception.exception_type}
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      {exception.description}
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-500 space-x-4">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatTimeAgo(exception.created_at)}
                      </span>
                      {exception.assigned_to && (
                        <span className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {exception.assigned_to}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedException(exception)}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                    >
                      Resolve
                    </button>
                    <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs font-medium hover:bg-gray-200 transition-colors">
                      Escalate
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Resolution Modal */}
      {selectedException && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Resolve Exception #{selectedException.order_id.slice(-8)}
              </h3>
            </div>
            
            <div className="px-6 py-4">
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700">{selectedException.exception_type}</p>
                <p className="text-sm text-gray-600 mt-1">{selectedException.description}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Notes
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe how this exception was resolved"
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
              <button
                onClick={handleResolveException}
                disabled={!resolutionNotes.trim()}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Resolve Exception
              </button>
              <button
                onClick={() => {
                  setSelectedException(null);
                  setResolutionNotes('');
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}