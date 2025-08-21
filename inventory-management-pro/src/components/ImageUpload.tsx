import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader,
  AlertCircle,
  Check
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ImageUploadProps {
  productId?: string
  imageType?: 'primary' | 'gallery'
  currentImage?: string
  onImageUploaded: (imageUrl: string) => void
  className?: string
  multiple?: boolean
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  productId,
  imageType = 'primary',
  currentImage,
  onImageUploaded,
  className = '',
  multiple = false
}) => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const uploadMutation = useMutation({
    mutationFn: async ({ file, fileName }: { file: File; fileName: string }) => {
      // Convert file to base64
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = async () => {
          try {
            const base64Data = reader.result as string

            // Use Edge Function to upload image
            const { data, error } = await supabase.functions.invoke('product-image-upload', {
              body: {
                imageData: base64Data,
                fileName,
                productId,
                imageType
              }
            })

            if (error) throw error
            resolve(data.data.publicUrl)
          } catch (err) {
            reject(err)
          }
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    },
    onSuccess: (imageUrl) => {
      onImageUploaded(imageUrl)
      toast.success('Image uploaded successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Image upload failed')
    }
  })

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      setUploading(true)
      
      try {
        for (const file of acceptedFiles) {
          const fileName = `${Date.now()}_${file.name}`
          setUploadProgress(prev => ({ ...prev, [fileName]: 0 }))
          
          // Simulate progress for better UX
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => ({
              ...prev,
              [fileName]: Math.min(prev[fileName] + 10, 90)
            }))
          }, 100)

          try {
            await uploadMutation.mutateAsync({ file, fileName })
            setUploadProgress(prev => ({ ...prev, [fileName]: 100 }))
          } catch (error) {
            console.error('Upload error:', error)
          } finally {
            clearInterval(progressInterval)
            setTimeout(() => {
              setUploadProgress(prev => {
                const newProgress = { ...prev }
                delete newProgress[fileName]
                return newProgress
              })
            }, 2000)
          }
        }
      } finally {
        setUploading(false)
      }
    },
    [uploadMutation, productId, imageType, onImageUploaded]
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif']
    },
    multiple,
    maxSize: 10485760, // 10MB
    disabled: uploading
  })

  const hasFileRejections = fileRejections.length > 0
  const activeUploads = Object.keys(uploadProgress)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Image Preview */}
      {currentImage && imageType === 'primary' && (
        <div className="relative">
          <img
            src={currentImage}
            alt="Current product image"
            className="w-32 h-32 object-cover rounded-lg border border-gray-200"
          />
          <div className="absolute -top-2 -right-2">
            <button
              onClick={() => onImageUploaded('')}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-sm"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-indigo-400 bg-indigo-50'
            : hasFileRejections
            ? 'border-red-400 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-2">
          {uploading ? (
            <Loader className="h-8 w-8 text-indigo-500 mx-auto animate-spin" />
          ) : (
            <Upload className="h-8 w-8 text-gray-400 mx-auto" />
          )}
          
          <div>
            <p className="text-sm text-gray-600">
              {isDragActive
                ? 'Drop the images here...'
                : 'Drag and drop images here, or click to select'
              }
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports: JPEG, PNG, WebP, GIF (max 10MB each)
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {activeUploads.length > 0 && (
        <div className="space-y-2">
          {activeUploads.map(fileName => (
            <div key={fileName} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 truncate">
                  {fileName.split('_').slice(1).join('_')}
                </span>
                <span className="text-xs text-gray-500">
                  {uploadProgress[fileName]}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress[fileName]}%` }}
                />
              </div>
              {uploadProgress[fileName] === 100 && (
                <div className="flex items-center mt-2 text-green-600">
                  <Check className="h-4 w-4 mr-1" />
                  <span className="text-sm">Upload complete</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* File Rejections */}
      {hasFileRejections && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Some files were rejected:
              </h3>
              <div className="mt-1 text-sm text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  {fileRejections.map(({ file, errors }, index) => (
                    <li key={index}>
                      {file.name}: {errors.map(e => e.message).join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageUpload