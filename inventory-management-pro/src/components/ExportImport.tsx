import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { useDropzone } from 'react-dropzone'
import {
  X,
  Download,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react'
import { productQueries } from '../lib/queries'
import { formatPrice } from '../lib/supabase'

interface ExportImportProps {
  onClose: () => void
  onRefresh: () => void
}

const ExportImport: React.FC<ExportImportProps> = ({ onClose, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv')
  const [importData, setImportData] = useState<any[]>([])
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [importPreview, setImportPreview] = useState(false)

  const queryClient = useQueryClient()

  // Export functionality
  const exportMutation = useMutation({
    mutationFn: async () => {
      const { products } = await productQueries.getProducts({ limit: 10000 })
      return products
    },
    onSuccess: (products) => {
      downloadData(products, exportFormat)
      toast.success(`Exported ${products.length} products successfully`)
    },
    onError: (error: any) => {
      toast.error(`Export failed: ${error.message}`)
    }
  })

  // Import functionality
  const importMutation = useMutation({
    mutationFn: async (data: any[]) => {
      const results = []
      for (const item of data) {
        try {
          const product = await productQueries.createProduct({
            name: item.name,
            description: item.description || '',
            category: item.category,
            subcategory: item.subcategory || null,
            sku: item.sku,
            base_price: Math.round((parseFloat(item.price) || 0) * 100), // Convert to cents
            vendor: item.vendor || 'KCT Menswear',
            product_type: item.product_type || 'Formal Accessories',
            status: item.status || 'draft',
            visibility: item.visibility !== 'false',
            featured: item.featured === 'true',
            weight: parseInt(item.weight) || 0,
            tags: item.tags ? item.tags.split(',').map(tag => tag.trim()) : [],
            meta_title: item.meta_title || '',
            meta_description: item.meta_description || '',
            primary_image: item.primary_image || null
          })
          results.push({ success: true, product })
        } catch (error: any) {
          results.push({ success: false, error: error.message, item })
        }
      }
      return results
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success).length
      
      if (successful > 0) {
        toast.success(`Successfully imported ${successful} products`)
      }
      if (failed > 0) {
        toast.error(`Failed to import ${failed} products`)
      }
      
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onRefresh()
      setImportData([])
      setImportPreview(false)
    },
    onError: (error: any) => {
      toast.error(`Import failed: ${error.message}`)
    }
  })

  const downloadData = (data: any[], format: 'csv' | 'excel') => {
    const headers = [
      'name',
      'description',
      'category',
      'subcategory',
      'sku',
      'price',
      'vendor',
      'product_type',
      'status',
      'visibility',
      'featured',
      'weight',
      'tags',
      'meta_title',
      'meta_description',
      'primary_image'
    ]

    if (format === 'csv') {
      const csvContent = [
        headers.join(','),
        ...data.map(product => [
          `"${product.name || ''}"`,
          `"${(product.description || '').replace(/"/g, '""')}"`,
          `"${product.category || ''}"`,
          `"${product.subcategory || ''}"`,
          `"${product.sku || ''}"`,
          `"${product.base_price ? (product.base_price / 100).toFixed(2) : '0.00'}"`,
          `"${product.vendor || ''}"`,
          `"${product.product_type || ''}"`,
          `"${product.status || ''}"`,
          `"${product.visibility || false}"`,
          `"${product.featured || false}"`,
          `"${product.weight || 0}"`,
          `"${Array.isArray(product.tags) ? product.tags.join(', ') : ''}"`,
          `"${product.meta_title || ''}"`,
          `"${product.meta_description || ''}"`,
          `"${product.primary_image || ''}""`
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const csv = e.target?.result as string
        parseCSV(csv)
      }
      reader.readAsText(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  })

  const parseCSV = (csv: string) => {
    const lines = csv.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      setImportErrors(['CSV file must have at least a header row and one data row'])
      return
    }

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
    const requiredHeaders = ['name', 'category', 'sku', 'price']
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    
    if (missingHeaders.length > 0) {
      setImportErrors([`Missing required columns: ${missingHeaders.join(', ')}`])
      return
    }

    const data = []
    const errors = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
      const row: any = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })

      // Validate required fields
      if (!row.name) errors.push(`Row ${i + 1}: Product name is required`)
      if (!row.category) errors.push(`Row ${i + 1}: Category is required`)
      if (!row.sku) errors.push(`Row ${i + 1}: SKU is required`)
      if (!row.price || isNaN(parseFloat(row.price))) {
        errors.push(`Row ${i + 1}: Valid price is required`)
      }

      data.push(row)
    }

    setImportData(data)
    setImportErrors(errors)
    setImportPreview(true)
  }

  const handleImport = () => {
    if (importErrors.length === 0) {
      importMutation.mutate(importData)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Import/Export Products
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'export'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Download className="h-4 w-4 inline mr-2" />
            Export
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'import'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Upload className="h-4 w-4 inline mr-2" />
            Import
          </button>
        </div>

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'csv' | 'excel')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="csv">CSV</option>
                <option value="excel">Excel (Coming Soon)</option>
              </select>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <FileText className="h-5 w-5 text-blue-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Export Information
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>This will export all products with the following fields:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Basic product information (name, description, category)</li>
                      <li>Pricing and inventory data</li>
                      <li>SEO metadata</li>
                      <li>Product images and tags</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => exportMutation.mutate()}
                disabled={exportMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {exportMutation.isPending ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {exportMutation.isPending ? 'Exporting...' : 'Export Products'}
              </button>
            </div>
          </div>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="space-y-4">
            {!importPreview ? (
              <>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {isDragActive
                      ? 'Drop the file here...'
                      : 'Drag and drop a CSV file here, or click to select'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: CSV, XLS, XLSX
                  </p>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Import Requirements
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Required columns: name, category, sku, price</p>
                        <p>Optional columns: description, subcategory, vendor, product_type, status, visibility, featured, weight, tags, meta_title, meta_description, primary_image</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    Import Preview ({importData.length} products)
                  </h4>
                  <button
                    onClick={() => {
                      setImportPreview(false)
                      setImportData([])
                      setImportErrors([])
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Upload Different File
                  </button>
                </div>
                
                {importErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Import Errors ({importErrors.length})
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <ul className="list-disc list-inside space-y-1">
                            {importErrors.slice(0, 10).map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                            {importErrors.length > 10 && (
                              <li>... and {importErrors.length - 10} more errors</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {importData.slice(0, 5).map((row, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900">{row.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{row.category}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{row.sku}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">${row.price}</td>
                        </tr>
                      ))}
                      {importData.length > 5 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-3 text-sm text-gray-500 text-center">
                            ... and {importData.length - 5} more products
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setImportPreview(false)
                      setImportData([])
                      setImportErrors([])
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importErrors.length > 0 || importMutation.isPending}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {importMutation.isPending ? (
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    {importMutation.isPending ? 'Importing...' : 'Import Products'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ExportImport