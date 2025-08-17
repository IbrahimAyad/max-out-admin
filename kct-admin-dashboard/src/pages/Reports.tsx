import React from 'react'

export default function Reports() {
  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate">
            Reports
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Analytics and business insights
          </p>
        </div>
      </div>

      {/* Placeholder content */}
      <div className="mt-8">
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <p className="text-neutral-600">Reports and analytics coming soon...</p>
        </div>
      </div>
    </div>
  )
}