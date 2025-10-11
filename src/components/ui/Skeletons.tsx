// src/components/ui/Skeletons.tsx
import React from 'react'

/**
 * Base skeleton component with shimmer animation
 */
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
)

/**
 * Skeleton for rate cards
 */
export const RateCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-6 w-16 rounded-lg" />
    </div>
    <div className="mb-4">
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-4 w-28" />
    </div>
    <div className="space-y-2">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  </div>
)

/**
 * Skeleton for client/mortgage cards
 */
export const ClientCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-6 w-20 rounded-lg" />
    </div>
    
    <div className="space-y-3 mb-4">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
    
    <div className="flex gap-2">
      <Skeleton className="h-9 flex-1" />
      <Skeleton className="h-9 flex-1" />
      <Skeleton className="h-9 w-9" />
    </div>
  </div>
)

/**
 * Skeleton for overview insight cards
 */
export const InsightCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between mb-3">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
    <Skeleton className="h-10 w-16 mb-2" />
    <Skeleton className="h-4 w-full" />
  </div>
)

/**
 * Skeleton for table rows
 */
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 4 }) => (
  <tr className="border-b border-gray-100 dark:border-gray-800">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="py-4 px-2">
        <Skeleton className="h-4 w-full" />
      </td>
    ))}
  </tr>
)

/**
 * Grid of rate card skeletons
 */
export const RateCardsGridSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map(i => <RateCardSkeleton key={i} />)}
  </div>
)

/**
 * Grid of client card skeletons
 */
export const ClientCardsGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => <ClientCardSkeleton key={i} />)}
  </div>
)

/**
 * List skeleton for simple lists
 */
export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
)

/**
 * Page header skeleton
 */
export const PageHeaderSkeleton: React.FC = () => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex-1">
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-64" />
    </div>
    <Skeleton className="h-10 w-24" />
  </div>
)