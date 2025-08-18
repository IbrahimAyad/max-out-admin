import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  MessageCircle, 
  Send, 
  Mail, 
  Users, 
  Plus
} from 'lucide-react'
import { weddingPortalAPI } from '@/lib/supabase'

export function CommunicationPage() {
  const [weddingId] = useState(() => localStorage.getItem('wedding_id') || '')
  const [newMessage, setNewMessage] = useState('')
  const [messageType, setMessageType] = useState('announcement')
  const [subject, setSubject] = useState('')

  // Get wedding messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ['wedding-messages', weddingId],
    queryFn: () => weddingPortalAPI.getMessages(weddingId, { limit: 50 }),
    enabled: !!weddingId
  })

  const messageList = messages?.data || []

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleSendMessage = () => {
    // Implementation would go here
    console.log('Sending message:', { subject, newMessage, messageType })
    setNewMessage('')
    setSubject('')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communication Center</h1>
          <p className="text-gray-600">Send updates and messages to your wedding party</p>
        </div>
      </div>

      {/* Compose Message */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Send className="w-5 h-5 mr-2" />
          Compose Message
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="announcement">Announcement</option>
                <option value="reminder">Reminder</option>
                <option value="update">Update</option>
                <option value="question">Question</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent">
                <option value="all_party">All Wedding Party</option>
                <option value="groomsmen_only">Groomsmen Only</option>
                <option value="specific">Specific Members</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              placeholder="Message subject..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              rows={4}
              placeholder="Write your message here..."
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm text-gray-600">
                <input type="checkbox" className="rounded" />
                <span>Send via email</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-gray-600">
                <input type="checkbox" className="rounded" />
                <span>Send via SMS</span>
              </label>
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !subject.trim()}
              className="bg-rose-600 text-white px-6 py-2 rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>Send Message</span>
            </button>
          </div>
        </div>
      </div>

      {/* Message History */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Message History
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {messageList.length === 0 ? (
            <div className="p-6 text-center">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-600">Start communicating with your wedding party by sending your first message above.</p>
            </div>
          ) : (
            messageList.map((message: any) => (
              <div key={message.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{message.subject}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        message.message_type === 'announcement' ? 'bg-blue-100 text-blue-700' :
                        message.message_type === 'reminder' ? 'bg-yellow-100 text-yellow-700' :
                        message.message_type === 'update' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {message.message_type}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3">{message.message}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Sent: {formatDate(message.created_at)}</span>
                      <span>To: {Array.isArray(message.recipient_ids) ? `${message.recipient_ids.length} recipients` : 'All party'}</span>
                      <span>Via: {message.sent_via?.join(', ') || 'Email'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Templates */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Message Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <h4 className="font-medium text-gray-900 mb-1">Measurement Reminder</h4>
            <p className="text-sm text-gray-600">Remind party members to submit their measurements</p>
          </button>
          
          <button className="text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <h4 className="font-medium text-gray-900 mb-1">Outfit Selection Update</h4>
            <p className="text-sm text-gray-600">Share outfit choices and get feedback</p>
          </button>
          
          <button className="text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <h4 className="font-medium text-gray-900 mb-1">Payment Reminder</h4>
            <p className="text-sm text-gray-600">Request payment completion for orders</p>
          </button>
          
          <button className="text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <h4 className="font-medium text-gray-900 mb-1">Final Details</h4>
            <p className="text-sm text-gray-600">Share final wedding day information</p>
          </button>
        </div>
      </div>
    </div>
  )
}
