import React, { useState, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { useProductImages } from '../hooks/useProductImages'

interface ImageUploadProps {
  productId?: string
  onUploadComplete?: (imageUrl: string) => void
  maxFiles?: number
  allowedTypes?: string[]
  className?: string
}

export default function ImageUpload({
  productId,
  onUploadComplete,
  maxFiles = 10,
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  className = ''
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  
  const { uploadImage, isUploading } = useProductImages(productId)

  // Handle file selection
  const handleFiles = useCallback((files: FileList) => {
    const validFiles: File[] = []
    const newPreviews: string[] = []
    
    Array.from(files).forEach((file) => {
      // Check file type
      if (!allowedTypes.includes(file.type)) {
        console.warn(`Invalid file type: ${file.type}`)
        return
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        console.warn(`File too large: ${file.name}`)
        return
      }
      
      validFiles.push(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string)
        if (newPreviews.length === validFiles.length) {
          setPreviews(prev => [...prev, ...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    })
    
    // Limit total files
    const remainingSlots = maxFiles - selectedFiles.length
    const filesToAdd = validFiles.slice(0, remainingSlots)
    
    setSelectedFiles(prev => [...prev, ...filesToAdd])
  }, [selectedFiles.length, maxFiles, allowedTypes])

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  // File input change handler
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }, [handleFiles])

  // Remove file from selection
  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }, [])

  // Upload selected files
  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return
    
    try {
      for (const file of selectedFiles) {
        await new Promise<void>((resolve, reject) => {
          uploadImage(
            { file, productId, imageType: 'gallery' },
            {
              onSuccess: (data) => {
                onUploadComplete?.(data.publicUrl)
                resolve()
              },
              onError: (error) => {
                console.error('Upload error for file:', file.name, error)
                reject(error)
              }
            }
          )
        })
      }
      
      // Clear selection after successful upload
      setSelectedFiles([])
      setPreviews([])
    } catch (error) {
      console.error('Upload failed:', error)
      // Error handling is done in the mutation's onError callback
    }
  }, [selectedFiles, uploadImage, productId, onUploadComplete])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-black bg-neutral-50' 
            : 'border-neutral-300 hover:border-neutral-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        
        <div className="space-y-2">
          <Upload className={`mx-auto h-8 w-8 ${
            dragActive ? 'text-black' : 'text-neutral-400'
          }`} />
          <div>
            <p className="text-sm font-medium text-neutral-900">
              Drop images here or click to upload
            </p>
            <p className="text-xs text-neutral-500">
              JPG, PNG, or WebP up to 5MB each (max {maxFiles} files)
            </p>
          </div>
        </div>
      </div>

      {/* File Previews */}
      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-neutral-900">
            Selected Files ({selectedFiles.length})
          </h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden">
                  {previews[index] ? (
                    <img
                      src={previews[index]}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <ImageIcon className="h-8 w-8 text-neutral-400" />
                    </div>
                  )}
                </div>
                
                {/* Remove button */}
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isUploading}
                >
                  <X className="h-3 w-3" />
                </button>
                
                {/* File info */}
                <div className="mt-2">
                  <p className="text-xs font-medium text-neutral-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Upload button */}
          <div className="flex justify-end">
            <button
              onClick={handleUpload}
              disabled={isUploading || selectedFiles.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'Image' : 'Images'}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
