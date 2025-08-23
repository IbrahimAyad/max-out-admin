import React, { useState } from 'react'
import { 
  Star, 
  StarOff, 
  Trash2, 
  Edit3, 
  MoreVertical,
  GripVertical,
  Eye,
  Download,
  Loader2
} from 'lucide-react'
import { useProductImages } from '../hooks/useProductImages'
import { getImageUrl } from '../lib/supabase'

interface ImageGalleryProps {
  productId: string
  className?: string
}

interface ImageCardProps {
  image: any
  isPrimary: boolean
  onSetPrimary: (imageUrl: string) => void
  onDelete: (imageId: string, imageUrl: string) => void
  onUpdateAltText: (imageId: string, altText: string) => void
  isLoading: boolean
}

function ImageCard({ image, isPrimary, onSetPrimary, onDelete, onUpdateAltText, isLoading }: ImageCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [altText, setAltText] = useState(image.alt_text || '')
  const [showActions, setShowActions] = useState(false)

  const handleSaveAltText = () => {
    if (altText !== image.alt_text) {
      onUpdateAltText(image.id, altText)
    }
    setIsEditing(false)
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = image.image_url
    link.download = `product-image-${image.id}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div 
      className="relative group bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Image */}
      <div className="aspect-square bg-neutral-100 relative">
        <img
          src={image.image_url}
          alt={image.alt_text || 'Product image'}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Primary indicator */}
        {isPrimary && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <Star className="h-3 w-3 mr-1" />
            Primary
          </div>
        )}
        
        {/* Drag handle */}
        <div className={`absolute top-2 right-2 p-1 bg-black bg-opacity-50 rounded transition-opacity ${
          showActions ? 'opacity-100' : 'opacity-0'
        }`}>
          <GripVertical className="h-4 w-4 text-white cursor-move" />
        </div>
        
        {/* Action buttons overlay */}
        <div className={`absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center space-x-2 transition-opacity ${
          showActions ? 'opacity-100' : 'opacity-0'
        }`}>
          {!isPrimary && (
            <button
              onClick={() => onSetPrimary(image.image_url)}
              disabled={isLoading}
              className="p-2 bg-white bg-opacity-90 text-neutral-900 rounded-full hover:bg-opacity-100 transition-all"
              title="Set as primary image"
            >
              <StarOff className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={handleDownload}
            className="p-2 bg-white bg-opacity-90 text-neutral-900 rounded-full hover:bg-opacity-100 transition-all"
            title="Download image"
          >
            <Download className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 bg-white bg-opacity-90 text-neutral-900 rounded-full hover:bg-opacity-100 transition-all"
            title="Edit alt text"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onDelete(image.id, image.image_url)}
            disabled={isLoading}
            className="p-2 bg-red-500 bg-opacity-90 text-white rounded-full hover:bg-opacity-100 transition-all"
            title="Delete image"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      
      {/* Image info */}
      <div className="p-3">
        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Enter alt text..."
              className="w-full text-sm border border-neutral-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              autoFocus
            />
            <div className="flex space-x-2">
              <button
                onClick={handleSaveAltText}
                className="text-xs bg-black text-white px-2 py-1 rounded hover:bg-neutral-800"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setAltText(image.alt_text || '')
                }}
                className="text-xs bg-neutral-200 text-neutral-700 px-2 py-1 rounded hover:bg-neutral-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-neutral-900 truncate">
              {image.alt_text || 'No alt text'}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-neutral-500">
                {image.width && image.height ? `${image.width}×${image.height}` : 'Unknown size'}
              </p>
              <p className="text-xs text-neutral-500">
                Position: {image.position || 0}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ImageGallery({ productId, className = '' }: ImageGalleryProps) {
  const {
    productImages,
    productGallery,
    isLoading,
    deleteImage,
    isDeleting,
    updateImage,
    isUpdating,
    setPrimaryImage,
    isSettingPrimary,
  } = useProductImages(productId)

  const handleSetPrimary = (imageUrl: string) => {
    setPrimaryImage({ productId, imageUrl })
  }

  const handleDelete = (imageId: string, imageUrl: string) => {
    if (window.confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      deleteImage({ imageId, imageUrl, productId })
    }
  }

  const handleUpdateAltText = (imageId: string, altText: string) => {
    updateImage({ imageId, updates: { alt_text: altText } })
  }

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-neutral-200 rounded-lg mb-2"></div>
              <div className="h-4 bg-neutral-200 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const allImages = [...productImages]
  const primaryImageUrl = productGallery.primary_image

  if (allImages.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-300">
          <Eye className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No images yet</h3>
          <p className="text-neutral-500">Upload some images to get started.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-neutral-900">
            Image Gallery ({allImages.length})
          </h3>
          {primaryImageUrl && (
            <div className="text-sm text-neutral-500">
              <Star className="h-4 w-4 inline mr-1" />
              Primary image set
            </div>
          )}
        </div>

        {/* Image grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {allImages.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              isPrimary={image.image_url === primaryImageUrl}
              onSetPrimary={handleSetPrimary}
              onDelete={handleDelete}
              onUpdateAltText={handleUpdateAltText}
              isLoading={isDeleting || isUpdating || isSettingPrimary}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
