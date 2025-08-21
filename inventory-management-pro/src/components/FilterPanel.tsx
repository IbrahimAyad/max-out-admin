import React from 'react'
import { X, Sliders } from 'lucide-react'

interface FilterPanelProps {
  filters: {
    category: string
    status: string
    stockStatus: string
    priceRange: [number, number]
  }
  categories: string[]
  onFilterChange: (filters: any) => void
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, categories, onFilterChange }) => {
  const handleFilterUpdate = (key: string, value: any) => {
    onFilterChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onFilterChange({
      category: '',
      status: '',
      stockStatus: '',
      priceRange: [0, 10000] as [number, number]
    })
  }

  const hasActiveFilters = filters.category || filters.status || filters.stockStatus || 
    filters.priceRange[0] !== 0 || filters.priceRange[1] !== 10000

  return (
    <div className="border-t border-gray-200 p-6 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sliders className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Clear all
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterUpdate('category', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          >
            <option value="">All categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterUpdate('status', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Stock Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stock Status
          </label>
          <select
            value={filters.stockStatus}
            onChange={(e) => handleFilterUpdate('stockStatus', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          >
            <option value="">All stock levels</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        {/* Price Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price Range
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.priceRange[0]}
              onChange={(e) => handleFilterUpdate('priceRange', [parseFloat(e.target.value) || 0, filters.priceRange[1]])}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.priceRange[1]}
              onChange={(e) => handleFilterUpdate('priceRange', [filters.priceRange[0], parseFloat(e.target.value) || 10000])}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.category && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              Category: {filters.category}
              <button
                onClick={() => handleFilterUpdate('category', '')}
                className="ml-1 inline-flex items-center justify-center w-3 h-3 rounded-full text-indigo-400 hover:text-indigo-500"
              >
                <X className="h-2 w-2" />
              </button>
            </span>
          )}
          {filters.status && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              Status: {filters.status}
              <button
                onClick={() => handleFilterUpdate('status', '')}
                className="ml-1 inline-flex items-center justify-center w-3 h-3 rounded-full text-indigo-400 hover:text-indigo-500"
              >
                <X className="h-2 w-2" />
              </button>
            </span>
          )}
          {filters.stockStatus && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              Stock: {filters.stockStatus.replace('_', ' ')}
              <button
                onClick={() => handleFilterUpdate('stockStatus', '')}
                className="ml-1 inline-flex items-center justify-center w-3 h-3 rounded-full text-indigo-400 hover:text-indigo-500"
              >
                <X className="h-2 w-2" />
              </button>
            </span>
          )}
          {(filters.priceRange[0] !== 0 || filters.priceRange[1] !== 10000) && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              Price: ${filters.priceRange[0]} - ${filters.priceRange[1]}
              <button
                onClick={() => handleFilterUpdate('priceRange', [0, 10000])}
                className="ml-1 inline-flex items-center justify-center w-3 h-3 rounded-full text-indigo-400 hover:text-indigo-500"
              >
                <X className="h-2 w-2" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default FilterPanel