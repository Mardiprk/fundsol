'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Something went wrong</h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          We apologize for the inconvenience. An unexpected error has occurred.
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={() => reset()}
            className="w-full bg-[#b5f265] hover:bg-[#a3e156] text-black font-medium"
          >
            Try again
          </Button>
          
          <Link href="/">
            <Button variant="outline" className="w-full border-gray-300 dark:border-gray-700">
              Go to Homepage
            </Button>
          </Link>
        </div>
        
        <div className="mt-12 text-sm text-gray-500 dark:text-gray-500">
          Need help? <Link href="mailto:support@fundsol.com" className="text-[#b5f265] hover:underline">Contact Support</Link>
        </div>
      </div>
    </div>
  )
} 