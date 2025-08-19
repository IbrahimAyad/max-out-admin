import { useState, useEffect } from 'react'
import { ArrowLeft, MessageCircle, Send, User, Users, HeadphonesIcon } from 'lucide-react'
import { MobileLayout } from '@/components/MobileLayout'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export function CommunicationsPage() {
  const [communications, setCommunications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [newSubject, setNewSubject] = useState('')
  const [recipientType, setRecipientType] = useState('coordinator')
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [sending, setSending] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadCommunications()
  }, [])

  const loadCommunications = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('groomsmen-communications')
      
      if (error) {
        throw new Error(error.message)
      }

      setCommunications(data.data.communications || [])
    } catch (error: any) {
      console.error('Load communications error:', error)
      toast.error(error.message || 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      toast.error('Please enter a message')
      return
    }

    setSending(true)
    try {
      const { data, error } = await supabase.functions.invoke('groomsmen-communications/send', {
        body: {
          recipientType,
          subject: newSubject.trim() || 'Message from Wedding Party Member',
          message: newMessage.trim()
        }
      })
      
      if (error || !data) {
        throw new Error(error?.message || 'Failed to send message')
      }

      if (data.error) {
        throw new Error(data.error.message)
      }

      toast.success('Message sent successfully!')
      setNewMessage('')
      setNewSubject('')
      setShowNewMessage(false)
      await loadCommunications()
    } catch (error: any) {
      console.error('Send message error:', error)
      toast.error(error.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      await supabase.functions.invoke('groomsmen-communications/mark-read', {
        body: { messageId }
      })
    } catch (error) {
      console.error('Mark as read error:', error)
    }
  }

  if (loading) {
    return (
      <MobileLayout showNav={false}>
        <div className="h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg bg-white shadow-md"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Messages</h1>
              <p className="text-sm text-gray-600">Communication center</p>
            </div>
          </div>
          <button
            onClick={() => setShowNewMessage(!showNewMessage)}
            className="bg-blue-600 text-white p-2 rounded-lg"
          >
            <MessageCircle size={20} />
          </button>
        </div>

        {/* New Message Form */}
        {showNewMessage && (
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Send New Message</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send To
              </label>
              <select
                value={recipientType}
                onChange={(e) => setRecipientType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="coordinator">Wedding Coordinator</option>
                <option value="couple">Couple</option>
                <option value="support">Customer Support</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Message subject (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send size={16} />
                )}
                <span>{sending ? 'Sending...' : 'Send'}</span>
              </button>
              <button
                onClick={() => setShowNewMessage(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Support Request Button */}
        <button
          onClick={() => {
            setRecipientType('support')
            setNewSubject('Support Request')
            setShowNewMessage(true)
          }}
          className="w-full bg-yellow-100 border border-yellow-300 rounded-2xl p-4 text-left hover:bg-yellow-200 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <HeadphonesIcon className="h-6 w-6 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-900">Need Help?</p>
              <p className="text-sm text-yellow-700">Contact customer support</p>
            </div>
          </div>
        </button>

        {/* Messages List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Messages</h3>
          
          {communications.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No messages yet</p>
              <p className="text-sm text-gray-400 mt-1">Your conversations will appear here</p>
            </div>
          ) : (
            communications.map((message) => {
              const getSenderIcon = () => {
                switch (message.senderType) {
                  case 'coordinator':
                  case 'admin':
                    return <Users className="h-5 w-5 text-blue-600" />
                  case 'couple':
                    return <User className="h-5 w-5 text-purple-600" />
                  default:
                    return <MessageCircle className="h-5 w-5 text-gray-600" />
                }
              }

              return (
                <div
                  key={message.id}
                  className={`bg-white rounded-2xl shadow-lg p-4 ${
                    !message.isRead ? 'border-l-4 border-blue-600' : ''
                  }`}
                  onClick={() => {
                    if (!message.isRead) {
                      markAsRead(message.id)
                    }
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">{getSenderIcon()}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900">{message.subject}</h4>
                        {!message.isRead && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{message.message}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="capitalize">
                          From: {message.senderType.replace('_', ' ')}
                        </span>
                        <span>
                          {new Date(message.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </MobileLayout>
  )
}