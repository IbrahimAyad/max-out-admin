import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Send, Clock, AlertCircle, CheckCircle, RefreshCw, Eye } from 'lucide-react';

interface EmailLog {
  id: string;
  to_email: string;
  subject: string;
  template: string;
  status: string;
  error?: string;
  created_at: string;
  sent_at?: string;
}

interface EmailManagerProps {
  orderData?: any;
  onEmailSent?: () => void;
}

const EmailManager: React.FC<EmailManagerProps> = ({ orderData, onEmailSent }) => {
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<Record<string, boolean>>({});
  const [selectedTemplate, setSelectedTemplate] = useState('order_confirmation');
  const [customRecipient, setCustomRecipient] = useState('');
  const [showLogs, setShowLogs] = useState(false);

  const emailTemplates = [
    { value: 'order_confirmation', label: 'Order Confirmation', description: 'Confirm new order details' },
    { value: 'shipping_confirmation', label: 'Shipping Confirmation', description: 'Notify about shipment' },
    { value: 'delivery_confirmation', label: 'Delivery Confirmation', description: 'Confirm successful delivery' },
    { value: 'admin_new_order', label: 'Admin Alert', description: 'Notify admin of new orders' }
  ];

  useEffect(() => {
    if (showLogs) {
      fetchEmailLogs();
    }
  }, [showLogs]);

  const fetchEmailLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEmailLogs(data || []);
    } catch (error) {
      console.error('Error fetching email logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async (templateType: string, recipient?: string) => {
    if (!orderData) {
      alert('No order data available');
      return;
    }

    const emailKey = `${templateType}_${recipient || orderData.customer_email}`;
    setSending(prev => ({ ...prev, [emailKey]: true }));

    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          emailType: templateType,
          orderData: {
            ...orderData,
            customer_email: recipient || orderData.customer_email
          },
          trackingData: orderData.tracking_number ? {
            tracking_code: orderData.tracking_number,
            carrier: orderData.carrier || 'USPS',
            tracking_url: `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${orderData.tracking_number}`
          } : undefined
        }
      });

      if (error) throw error;

      alert(`Email sent successfully to ${recipient || orderData.customer_email}`);
      if (onEmailSent) onEmailSent();
      if (showLogs) fetchEmailLogs();
      
    } catch (error) {
      console.error('Error sending email:', error);
      alert(`Failed to send email: ${error.message}`);
    } finally {
      setSending(prev => ({ ...prev, [emailKey]: false }));
    }
  };

  const triggerOrderAutomation = async (action: string) => {
    if (!orderData) return;

    const automationKey = `automation_${action}`;
    setSending(prev => ({ ...prev, [automationKey]: true }));

    try {
      const { data, error } = await supabase.functions.invoke('order-automation', {
        body: {
          action,
          orderData
        }
      });

      if (error) throw error;

      alert(`Order automation "${action}" completed successfully`);
      if (onEmailSent) onEmailSent();
      if (showLogs) fetchEmailLogs();
      
    } catch (error) {
      console.error('Error triggering automation:', error);
      alert(`Failed to trigger automation: ${error.message}`);
    } finally {
      setSending(prev => ({ ...prev, [automationKey]: false }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Mail className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Email Management</h3>
        </div>
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span>{showLogs ? 'Hide' : 'Show'} Email Logs</span>
        </button>
      </div>

      {orderData && (
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Order Automation</h4>
              <div className="space-y-2">
                <button
                  onClick={() => triggerOrderAutomation('order_created')}
                  disabled={sending.automation_order_created}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending.automation_order_created ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Send Order Emails</span>
                </button>
                
                {orderData.tracking_number && (
                  <button
                    onClick={() => triggerOrderAutomation('shipping_label_created')}
                    disabled={sending.automation_shipping_label_created}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending.automation_shipping_label_created ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Send Shipping Email</span>
                  </button>
                )}
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Manual Email</h4>
              <div className="space-y-2">
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {emailTemplates.map(template => (
                    <option key={template.value} value={template.value}>
                      {template.label}
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={() => sendEmail(selectedTemplate)}
                  disabled={sending[`${selectedTemplate}_${orderData.customer_email}`]}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending[`${selectedTemplate}_${orderData.customer_email}`] ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Send to Customer</span>
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Custom Recipient</h4>
              <div className="space-y-2">
                <input
                  type="email"
                  value={customRecipient}
                  onChange={(e) => setCustomRecipient(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
                
                <button
                  onClick={() => customRecipient && sendEmail(selectedTemplate, customRecipient)}
                  disabled={!customRecipient || sending[`${selectedTemplate}_${customRecipient}`]}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending[`${selectedTemplate}_${customRecipient}`] ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Send Custom</span>
                </button>
              </div>
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Current Order Information</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Order ID:</span>
                <p className="font-medium">#{orderData.id}</p>
              </div>
              <div>
                <span className="text-gray-600">Customer:</span>
                <p className="font-medium">{orderData.customer_name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <p className="font-medium">{orderData.customer_email || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <p className="font-medium capitalize">{orderData.status || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!orderData && (
        <div className="text-center py-8 text-gray-500">
          <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Select an order to manage emails</p>
        </div>
      )}

      {/* Email Logs */}
      {showLogs && (
        <div className="mt-6 border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Recent Email Activity</h4>
            <button
              onClick={fetchEmailLogs}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading email logs...</span>
            </div>
          ) : emailLogs.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {emailLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(log.status)}
                      <span className="font-medium text-gray-900 truncate">{log.subject}</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      <span>To: {log.to_email}</span>
                      <span>Template: {log.template}</span>
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    {log.error && (
                      <p className="text-red-600 text-sm mt-1 truncate">{log.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No email activity yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailManager;