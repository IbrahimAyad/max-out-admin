import React from 'react'

interface LoadingSpinnerProps {
  className?: string
}

export function LoadingSpinner({ className = "w-8 h-8" }: LoadingSpinnerProps) {
  return (
    <div className={`animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600 ${className}`}></div>
  )
}