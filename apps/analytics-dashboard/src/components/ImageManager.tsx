import React, { useState } from 'react'
import { Image as ImageIcon, Upload as UploadIcon, Grid3X3, List } from 'lucide-react'
import ImageUpload from './ImageUpload'
import ImageGallery from './ImageGallery'

interface ImageManagerProps {
  productId: string
  className?: string
}

export default function ImageManager({ productId, className = '' }: ImageManagerProps) {
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload'>('gallery')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const handleUploadComplete = (imageUrl: string) => {
    // Switch back to gallery tab after successful upload
    setActiveTab('gallery')
  }

  return (
    <div className={`bg-white rounded-lg border border-neutral-200 ${className}`}>
      {/* Header with tabs */}
      <div className="border-b border-neutral-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'gallery'
                  ? 'bg-black text-white'
                  : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <ImageIcon className="h-4 w-4 inline mr-2" />
              Gallery
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'upload'
                  ? 'bg-black text-white'
                  : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <UploadIcon className="h-4 w-4 inline mr-2" />
              Upload
            </button>
          </div>
          
          {/* View mode toggle (only show for gallery) */}
          {activeTab === 'gallery' && (
            <div className="flex border border-neutral-300 rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm font-medium rounded-l-md ${
                  viewMode === 'grid'
                    ? 'bg-black text-white'
                    : 'bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-medium rounded-r-md border-l ${
                  viewMode === 'list'
                    ? 'bg-black text-white'
                    : 'bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'upload' ? (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Upload Product Images</h3>
              <p className="text-sm text-neutral-600">
                Add high-quality images to showcase your product. The first image uploaded will be considered for the primary product image.
              </p>
            </div>
            <ImageUpload
              productId={productId}
              onUploadComplete={handleUploadComplete}
              maxFiles={10}
            />
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Manage Product Images</h3>
              <p className="text-sm text-neutral-600">
                Organize your product images, set primary image, edit alt text, and manage your gallery.
              </p>
            </div>
            <ImageGallery productId={productId} />
          </div>
        )}
      </div>
    </div>
  )
}
