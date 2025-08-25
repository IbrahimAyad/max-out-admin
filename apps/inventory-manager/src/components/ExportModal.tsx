import { useState } from 'react'
import { Download, FileText, Calendar, Filter } from 'lucide-react'
import { type EnhancedProduct } from '@/lib/supabase'

interface ExportModalProps {
  products: EnhancedProduct[]
  onClose: () => void
}

type ExportFormat = 'csv' | 'json'
type ExportScope = 'all' | 'filtered' | 'selected'

export function ExportModal({ products, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [scope, setScope] = useState<ExportScope>('filtered')
  const [includeVariants, setIncludeVariants] = useState(true)
  const [includeMovements, setIncludeMovements] = useState(false)
  const [exporting, setExporting] = useState(false)

  const generateCSV = (data: any[], headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || ''
          // Escape commas and quotes in CSV
          return typeof value === 'string' && (value.includes(',') || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"`
            : value
        }).join(',')
      )
    ].join('\n')
    
    return csvContent
  }

  const exportProducts = async () => {
    setExporting(true)
    
    try {
      let exportData: any[] = []
      let filename = `kct-inventory-${new Date().toISOString().split('T')[0]}`
      
      if (includeVariants) {
        // Export variant-level data
        const variantData: any[] = []
        
        products.forEach(product => {
          if (product.variants && product.variants.length > 0) {
            product.variants.forEach(variant => {
              variantData.push({
                product_id: product.id,
                product_name: product.name,
                product_category: product.category,
                product_subcategory: product.subcategory || '',
                sku: variant.sku,
                price: variant.price,
                stock_quantity: variant.stock_quantity,
                low_stock_threshold: variant.low_stock_threshold,
                piece_type: variant.piece_type || '',
                is_active: variant.is_active,
                created_at: variant.created_at,
                updated_at: variant.updated_at
              })
            })
          } else {
            // Product without variants
            variantData.push({
              product_id: product.id,
              product_name: product.name,
              product_category: product.category,
              product_subcategory: product.subcategory || '',
              sku: product.sku_prefix,
              price: product.base_price,
              stock_quantity: 0,
              low_stock_threshold: 0,
              piece_type: '',
              is_active: product.is_active,
              created_at: product.created_at,
              updated_at: product.updated_at
            })
          }
        })
        
        exportData = variantData
        filename += '-variants'
      } else {
        // Export product-level data
        exportData = products.map(product => ({
          id: product.id,
          name: product.name,
          category: product.category,
          subcategory: product.subcategory || '',
          sku_prefix: product.sku_prefix,
          base_price: product.base_price,
          description: product.description || '',
          requires_size: product.requires_size,
          requires_color: product.requires_color,
          sizing_category: product.sizing_category || '',
          total_stock: product.total_stock || 0,
          low_stock_variants: product.low_stock_variants || 0,
          variant_count: product.variants?.length || 0,
          is_active: product.is_active,
          created_at: product.created_at,
          updated_at: product.updated_at
        }))
        
        filename += '-products'
      }
      
      // Generate file content
      let fileContent: string
      let mimeType: string
      
      if (format === 'csv') {
        const headers = Object.keys(exportData[0] || {})
        fileContent = generateCSV(exportData, headers)
        mimeType = 'text/csv'
        filename += '.csv'
      } else {
        fileContent = JSON.stringify({
          exported_at: new Date().toISOString(),
          total_records: exportData.length,
          export_scope: scope,
          includes_variants: includeVariants,
          data: exportData
        }, null, 2)
        mimeType = 'application/json'
        filename += '.json'
      }
      
      // Download file
      const blob = new Blob([fileContent], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Download className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Export Inventory Data</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FileText className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Export Format */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Export Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormat('csv')}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  format === 'csv'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="h-5 w-5 mx-auto mb-1" />
                CSV File
              </button>
              <button
                onClick={() => setFormat('json')}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  format === 'json'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="h-5 w-5 mx-auto mb-1" />
                JSON File
              </button>
            </div>
          </div>

          {/* Data Scope */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Data Scope</label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="scope-filtered"
                  checked={scope === 'filtered'}
                  onChange={() => setScope('filtered')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="scope-filtered" className="ml-2 text-sm text-gray-700">
                  Current filtered results ({products.length} products)
                </label>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Export Options</label>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="include-variants"
                  checked={includeVariants}
                  onChange={(e) => setIncludeVariants(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="include-variants" className="ml-2 text-sm text-gray-700">
                  Include variant details (size, color, stock levels)
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="include-movements"
                  checked={includeMovements}
                  onChange={(e) => setIncludeMovements(e.target.checked)}
                  disabled
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                />
                <label htmlFor="include-movements" className="ml-2 text-sm text-gray-500">
                  Include inventory movements (coming soon)
                </label>
              </div>
            </div>
          </div>

          {/* Export Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Export Summary</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Format: {format.toUpperCase()}</p>
              <p>Products: {products.length}</p>
              {includeVariants && (
                <p>Total variants: {products.reduce((sum, p) => sum + (p.variants?.length || 0), 0)}</p>
              )}
              <p>Exported at: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={exportProducts}
            disabled={exporting || products.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>{exporting ? 'Exporting...' : 'Export Data'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}