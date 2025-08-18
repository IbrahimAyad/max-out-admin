import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Calendar, MapPin, Users, Palette } from 'lucide-react'
import { weddingAPI } from '../lib/supabase'

interface CreateWeddingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateWeddingModal({ isOpen, onClose }: CreateWeddingModalProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    wedding_date: '',
    venue_name: '',
    venue_address: '',
    venue_city: '',
    venue_state: '',
    guest_count: '',
    formality_level: 'formal',
    wedding_theme: '',
    color_scheme: ['#000000', '#FFFFFF'],
    budget_range: '',
    special_instructions: ''
  })

  const createWeddingMutation = useMutation({
    mutationFn: weddingAPI.createWedding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weddings'] })
      onClose()
      setFormData({
        wedding_date: '',
        venue_name: '',
        venue_address: '',
        venue_city: '',
        venue_state: '',
        guest_count: '',
        formality_level: 'formal',
        wedding_theme: '',
        color_scheme: ['#000000', '#FFFFFF'],
        budget_range: '',
        special_instructions: ''
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createWeddingMutation.mutate({
      ...formData,
      guest_count: parseInt(formData.guest_count) || 0
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Wedding</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Wedding Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Wedding Date
            </label>
            <input
              type="date"
              value={formData.wedding_date}
              onChange={(e) => handleInputChange('wedding_date', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
              required
            />
          </div>
          
          {/* Venue Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Venue Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Venue Name</label>
              <input
                type="text"
                value={formData.venue_name}
                onChange={(e) => handleInputChange('venue_name', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="The Grand Ballroom"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                type="text"
                value={formData.venue_address}
                onChange={(e) => handleInputChange('venue_address', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="123 Wedding Avenue"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={formData.venue_city}
                  onChange={(e) => handleInputChange('venue_city', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="New York"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  value={formData.venue_state}
                  onChange={(e) => handleInputChange('venue_state', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="NY"
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Wedding Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Wedding Details
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Guest Count</label>
                <input
                  type="number"
                  value={formData.guest_count}
                  onChange={(e) => handleInputChange('guest_count', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="150"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Formality Level</label>
                <select
                  value={formData.formality_level}
                  onChange={(e) => handleInputChange('formality_level', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="black_tie">Black Tie</option>
                  <option value="formal">Formal</option>
                  <option value="semi_formal">Semi Formal</option>
                  <option value="cocktail">Cocktail</option>
                  <option value="casual">Casual</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Wedding Theme</label>
              <input
                type="text"
                value={formData.wedding_theme}
                onChange={(e) => handleInputChange('wedding_theme', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Classic Elegance, Modern Chic, Garden Party..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range</label>
              <select
                value={formData.budget_range}
                onChange={(e) => handleInputChange('budget_range', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">Select budget range</option>
                <option value="Under $2,500">Under $2,500</option>
                <option value="$2,500-$5,000">$2,500 - $5,000</option>
                <option value="$5,000-$10,000">$5,000 - $10,000</option>
                <option value="$10,000-$20,000">$10,000 - $20,000</option>
                <option value="$20,000+">$20,000+</option>
              </select>
            </div>
          </div>
          
          {/* Special Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
            <textarea
              value={formData.special_instructions}
              onChange={(e) => handleInputChange('special_instructions', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
              rows={3}
              placeholder="Any special requirements, preferences, or notes..."
            />
          </div>
          
          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createWeddingMutation.isPending}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createWeddingMutation.isPending ? 'Creating...' : 'Create Wedding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
