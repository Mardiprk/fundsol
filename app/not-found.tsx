'use client'

import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="flex-1 flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#b5f265]/10 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          ></motion.div>
          <motion.div
            className="absolute right-1/4 bottom-1/4 w-[400px] h-[400px] rounded-full bg-[#b5f265]/5 blur-2xl"
            animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          ></motion.div>
        </div>

        <motion.div
          className="max-w-md w-full relative z-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <motion.div
            className="relative mb-10"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="w-20 h-20 mx-auto bg-[#b5f265] rounded-full flex items-center justify-center shadow-xl">
              <Search className="h-8 w-8 text-black" />
            </div>
            <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 text-[100px] font-extrabold text-gray-900/10 dark:text-white/10 select-none pointer-events-none">
              404
            </div>
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8 text-base leading-relaxed max-w-sm mx-auto">
            The page you’re looking for seems to have vanished. Let’s get you back on track!
          </p>

          <div className="relative h-12 mb-10 overflow-hidden">
            <svg className="w-full absolute" viewBox="0 0 400 40" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0,20 Q50,10 100,20 T200,20 T300,20 T400,20"
                stroke="#b5f265"
                strokeWidth="2"
                fill="none"
                className="animate-[dash_5s_linear_infinite]"
              />
              <circle cx="0" cy="20" r="3" fill="#b5f265" className="animate-[ping_2s_ease-in-out_infinite]" />
            </svg>
            <style jsx>{`
              @keyframes dash {
                to {
                  stroke-dashoffset: -1000;
                }
              }
              path {
                stroke-dasharray: 20;
                stroke-dashoffset: 0;
              }
            `}</style>
          </div>

          <div className="space-y-4">
            <Link href="/">
              <Button className="w-full bg-[#b5f265] hover:bg-[#a3e156] text-black font-medium h-12 text-base shadow-lg shadow-[#b5f265]/30 group transition-all duration-300">
                Return to Home
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1.5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}