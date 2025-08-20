import React, { useState } from 'react'
import { Users, RefreshCw, CheckCircle, AlertCircle, Download, Upload } from 'lucide-react'
import { unifiedAuthAPI } from '../lib/unified-auth'

export function UserMigrationTools() {
  const [migrationReport, setMigrationReport] = useState<any>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationResults, setMigrationResults] = useState<any>(null)
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      const report = await unifiedAuthAPI.migration.generateReport()
      setMigrationReport(report)
      setSuccessMessage('Migration report generated successfully')
    } catch (error: any) {
      setError(error.message || 'Failed to generate migration report')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleMigrateAccounts = async () => {
    if (!migrationReport?.accounts || selectedAccounts.length === 0) {
      setError('Please select accounts to migrate')
      return
    }

    setIsMigrating(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      const accountsToMigrate = migrationReport.accounts.filter((account: any) => 
        selectedAccounts.includes(account.id)
      )
      
      const results = await unifiedAuthAPI.migration.migrateAccounts(accountsToMigrate)
      setMigrationResults(results)
      setSuccessMessage(`Successfully migrated ${results.migrated_count || 0} accounts`)
      
      // Refresh the report to show updated status
      await handleGenerateReport()
    } catch (error: any) {
      setError(error.message || 'Failed to migrate accounts')
    } finally {
      setIsMigrating(false)
    }
  }

  const handleSelectAccount = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
  }

  const handleSelectAll = () => {
    if (!migrationReport?.accounts) return
    
    const unmigrated = migrationReport.accounts
      .filter((account: any) => !account.is_migrated)
      .map((account: any) => account.id)
      
    setSelectedAccounts(prev => 
      prev.length === unmigrated.length ? [] : unmigrated
    )
  }

  const clearMessages = () => {
    setError(null)
    setSuccessMessage(null)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <Users className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">User Migration Tools</h3>
        </div>
        <p className="text-gray-600">
          Migrate existing wedding portal accounts to the unified authentication system
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="text-red-700 text-sm">{error}</div>
          <button 
            onClick={clearMessages}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <div className="text-green-700 text-sm">{successMessage}</div>
          <button 
            onClick={clearMessages}
            className="ml-auto text-green-500 hover:text-green-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Generate Report Section */}
      <div className="mb-6">
        <button
          onClick={handleGenerateReport}
          disabled={isGeneratingReport}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          {isGeneratingReport ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              <span>Generating Report...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>Generate Migration Report</span>
            </>
          )}
        </button>
      </div>

      {/* Migration Report */}
      {migrationReport && (
        <div className="space-y-6">
          {/* Report Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-700">
                {migrationReport.total_accounts || 0}
              </div>
              <div className="text-sm text-blue-600">Total Accounts</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-700">
                {migrationReport.migrated_count || 0}
              </div>
              <div className="text-sm text-green-600">Already Migrated</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-700">
                {migrationReport.pending_count || 0}
              </div>
              <div className="text-sm text-yellow-600">Pending Migration</div>
            </div>
          </div>

          {/* Accounts List */}
          {migrationReport.accounts && migrationReport.accounts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Accounts</h4>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleSelectAll}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {selectedAccounts.length === migrationReport.accounts.filter((a: any) => !a.is_migrated).length 
                      ? 'Deselect All' : 'Select All'}
                  </button>
                  {selectedAccounts.length > 0 && (
                    <button
                      onClick={handleMigrateAccounts}
                      disabled={isMigrating}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      {isMigrating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          <span>Migrating...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Migrate Selected ({selectedAccounts.length})</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Select
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Portal
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {migrationReport.accounts.map((account: any) => (
                      <tr key={account.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          {!account.is_migrated && (
                            <input
                              type="checkbox"
                              checked={selectedAccounts.includes(account.id)}
                              onChange={() => handleSelectAccount(account.id)}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {account.email}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {account.portal_type || 'Unknown'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {account.is_migrated ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Migrated
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Migration Results */}
      {migrationResults && (
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Migration Results</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div>Migrated: {migrationResults.migrated_count || 0}</div>
            <div>Failed: {migrationResults.failed_count || 0}</div>
            {migrationResults.errors && migrationResults.errors.length > 0 && (
              <div>
                <div className="font-medium text-red-600">Errors:</div>
                <ul className="list-disc list-inside ml-4">
                  {migrationResults.errors.map((error: string, index: number) => (
                    <li key={index} className="text-red-600">{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}