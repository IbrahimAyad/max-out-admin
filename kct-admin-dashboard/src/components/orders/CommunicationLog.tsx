import React, { useState } from 'react';
import { MessageSquare, Send, Mail, Phone, Calendar, User, Filter } from 'lucide-react';
import { CommunicationLog, CommunicationType } from '../../config/orders';

interface CommunicationLogProps {
  communications: CommunicationLog[];
  onAddCommunication: (log: Omit<CommunicationLog, 'id'>) => void;
}

export function CommunicationLogComponent({ communications, onAddCommunication }: CommunicationLogProps) {
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [filterType, setFilterType] = useState<CommunicationType | 'all'>('all');
  const [filterDirection, setFilterDirection] = useState<'all' | 'inbound' | 'outbound'>('all');
  const [newMessage, setNewMessage] = useState({
    orderId: '',
    customerId: '',
    type: CommunicationType.EMAIL,
    direction: 'outbound' as 'inbound' | 'outbound',
    subject: '',
    content: ''
  });

  // Filter communications
  const filteredCommunications = communications.filter(comm => {
    const typeMatch = filterType === 'all' || comm.communication_type === filterType;
    const directionMatch = filterDirection === 'all' || comm.direction === filterDirection;
    return typeMatch && directionMatch;
  });

  // Sort by most recent first
  const sortedCommunications = filteredCommunications.sort((a, b) => 
    new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
  );

  // Group communications by date
  const groupedCommunications = sortedCommunications.reduce((groups, comm) => {
    const date = new Date(comm.sent_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(comm);
    return groups;
  }, {} as Record<string, CommunicationLog[]>);

  const getTypeIcon = (type: CommunicationType) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'system':
        return <User className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: CommunicationType) => {
    const colors: Record<CommunicationType, string> = {
      'email': 'bg-blue-100 text-blue-800',
      'sms': 'bg-green-100 text-green-800',
      'call': 'bg-purple-100 text-purple-800',
      'system': 'bg-gray-100 text-gray-800'
    };
    return colors[type];
  };

  const getDirectionColor = (direction: 'inbound' | 'outbound') => {
    return direction === 'outbound' 
      ? 'bg-orange-100 text-orange-800 border-l-4 border-orange-400'
      : 'bg-green-100 text-green-800 border-l-4 border-green-400';
  };

  const handleSendMessage = () => {
    if (newMessage.orderId && newMessage.customerId && newMessage.subject && newMessage.content) {
      onAddCommunication({
        order_id: newMessage.orderId,
        customer_id: newMessage.customerId,
        communication_type: newMessage.type,
        direction: newMessage.direction,
        subject: newMessage.subject,
        content: newMessage.content,
        sent_at: new Date().toISOString(),
        response_received: false
      });
      
      setNewMessage({
        orderId: '',
        customerId: '',
        type: CommunicationType.EMAIL,
        direction: 'outbound',
        subject: '',
        content: ''
      });
      setShowNewMessage(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const quickMessages = [
    {
      subject: 'Order Confirmation',
      content: 'Thank you for your order. We have received your order and it is being processed.'
    },
    {
      subject: 'Shipping Update',
      content: 'Your order has been shipped and is on its way to you. You will receive a tracking number shortly.'
    },
    {
      subject: 'Delivery Confirmation',
      content: 'Your order has been delivered. Thank you for your business!'
    },
    {
      subject: 'Order Delay',
      content: 'We apologize for the delay with your order. We are working to resolve this and will update you soon.'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
            Communication Log
          </h2>
          <button
            onClick={() => setShowNewMessage(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
          >
            <Send className="h-4 w-4 mr-2" />
            New Message
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              className="text-sm border border-gray-300 rounded px-2 py-1"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as CommunicationType | 'all')}
            >
              <option value="all">All Types</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="call">Call</option>
              <option value="system">System</option>
            </select>
          </div>
          
          <select
            className="text-sm border border-gray-300 rounded px-2 py-1"
            value={filterDirection}
            onChange={(e) => setFilterDirection(e.target.value as 'all' | 'inbound' | 'outbound')}
          >
            <option value="all">All Directions</option>
            <option value="outbound">Outbound</option>
            <option value="inbound">Inbound</option>
          </select>
        </div>
      </div>

      {/* New Message Form */}
      {showNewMessage && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Send New Communication</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order ID</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newMessage.orderId}
                onChange={(e) => setNewMessage(prev => ({ ...prev, orderId: e.target.value }))}
                placeholder="Enter order ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer ID</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newMessage.customerId}
                onChange={(e) => setNewMessage(prev => ({ ...prev, customerId: e.target.value }))}
                placeholder="Enter customer ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newMessage.type}
                onChange={(e) => setNewMessage(prev => ({ ...prev, type: e.target.value as CommunicationType }))}
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="call">Call</option>
                <option value="system">System</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Direction</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newMessage.direction}
                onChange={(e) => setNewMessage(prev => ({ ...prev, direction: e.target.value as 'inbound' | 'outbound' }))}
              >
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newMessage.subject}
              onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Message subject"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              value={newMessage.content}
              onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Message content"
            />
          </div>
          
          {/* Quick Message Templates */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Templates</label>
            <div className="flex flex-wrap gap-2">
              {quickMessages.map((template, index) => (
                <button
                  key={index}
                  onClick={() => setNewMessage(prev => ({
                    ...prev,
                    subject: template.subject,
                    content: template.content
                  }))}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
                >
                  {template.subject}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.orderId || !newMessage.customerId || !newMessage.subject || !newMessage.content}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Send Message
            </button>
            <button
              onClick={() => setShowNewMessage(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Communications List */}
      <div className="max-h-96 overflow-y-auto">
        {Object.keys(groupedCommunications).length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No communications yet</p>
          </div>
        ) : (
          Object.entries(groupedCommunications).map(([date, comms]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="px-6 py-2 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center text-sm font-medium text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {formatDate(date)}
                </div>
              </div>
              
              {/* Communications for this date */}
              <div className="divide-y divide-gray-200">
                {comms.map((comm) => (
                  <div key={comm.id} className={`px-6 py-4 ${getDirectionColor(comm.direction)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            #{comm.order_id.slice(-8)}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            getTypeColor(comm.communication_type)
                          }`}>
                            {getTypeIcon(comm.communication_type)}
                            <span className="ml-1">{comm.communication_type.toUpperCase()}</span>
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            comm.direction === 'outbound' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {comm.direction === 'outbound' ? 'Sent' : 'Received'}
                          </span>
                        </div>
                        
                        <p className="font-medium text-sm text-gray-900 mb-1">{comm.subject}</p>
                        <p className="text-sm text-gray-600 mb-2">{comm.content}</p>
                        
                        <div className="flex items-center text-xs text-gray-500">
                          <span>{formatTime(comm.sent_at)}</span>
                          {comm.response_received && (
                            <span className="ml-3 text-green-600">Response received</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}