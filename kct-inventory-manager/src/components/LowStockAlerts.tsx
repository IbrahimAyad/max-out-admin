import React from 'react'
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { useLowStockAlerts } from '@/hooks/useInventory'

export function LowStockAlerts() {
  const { alerts, loading } = useLowStockAlerts()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-green-900 mb-2">No Low Stock Alerts</h3>
        <p className="text-green-700">All variants are currently above their low stock thresholds.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
          <span className="text-yellow-800 font-medium">
            {alerts.length} variant{alerts.length === 1 ? '' : 's'} need attention
          </span>
        </div>
      </div>
      
      <div className="grid gap-4">
        {alerts.map(alert => {
          const variant = alert.variant
          const product = alert.product
          
          if (!variant || !product) return null
          
          return (
            <div key={alert.id} className="bg-white border border-yellow-300 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <h3 className="font-medium text-gray-900">{product.name}</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">SKU:</span>
                      <span className="ml-2 font-mono">{variant.sku}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Color:</span>
                      <span className="ml-2">{variant.color}</span>
                    </div>
                    {variant.size && (
                      <div>
                        <span className="text-gray-600">Size:</span>
                        <span className="ml-2">{variant.size}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className="ml-2 capitalize">
                        {variant.variant_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Current Stock:</span>
                      <span className="text-sm font-bold text-red-600">
                        {alert.current_quantity}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Threshold:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {alert.alert_threshold}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Clock className="h-4 w-4 mr-1" />
                    {new Date(alert.created_at).toLocaleDateString()}
                  </div>
                  
                  <div className="space-y-2">
                    <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                      Restock
                    </button>
                    <button className="text-sm bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 block w-full">
                      Acknowledge
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}