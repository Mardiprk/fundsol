'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global application error:', error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-950 text-black dark:text-white px-4">
          <div className="text-center max-w-md">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold mb-4">Critical Error</h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              We&apos;re sorry, but something went seriously wrong. Our team has been notified.
            </p>
            
            <button
              onClick={() => reset()}
              className="px-6 py-3 bg-[#b5f265] hover:bg-[#a3e156] text-black font-medium rounded-md w-full"
            >
              Try again
            </button>
            
            <div className="mt-12 text-sm text-gray-500">
              If the problem persists, please contact 
              <a href="mailto:support@fundsol.com" className="text-[#b5f265] hover:underline ml-1">
                support@fundsol.com
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
} 