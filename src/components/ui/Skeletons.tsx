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

// ===== NEW ADDITIONS FOR AUTO CALLING =====

/**
 * Pulsing Dot (for live indicators)
 */
export const PulsingDot: React.FC<{ color?: string }> = ({ color = "bg-green-500" }) => (
  <span className="relative flex h-3 w-3">
    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`}></span>
    <span className={`relative inline-flex rounded-full h-3 w-3 ${color}`}></span>
  </span>
)

/**
 * Empty State Component (Enhanced)
 */
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="p-12 text-center">
    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
      <div className="text-gray-400 dark:text-gray-500">
        {icon}
      </div>
    </div>
    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
      {description}
    </p>
    {action && (
      <button
        onClick={action.onClick}
        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
      >
        {action.label}
      </button>
    )}
  </div>
)

/**
 * Full Dashboard Loading State for Auto Calling
 */
export const DashboardLoadingSkeleton: React.FC = () => (
  <div className="space-y-6 pb-20 md:pb-6 p-4 md:p-0">
    {/* Header Skeleton */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="w-64 h-8" />
        <Skeleton className="w-96 h-5" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="w-40 h-10 rounded-xl" />
        <Skeleton className="w-24 h-10 rounded-xl" />
      </div>
    </div>

    {/* Stats Cards Skeleton */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl p-4 shadow-lg animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg"></div>
            <div className="w-12 h-4 bg-white/20 rounded"></div>
          </div>
          <div className="w-20 h-8 bg-white/30 rounded mb-1"></div>
          <div className="w-24 h-4 bg-white/20 rounded"></div>
        </div>
      ))}
    </div>

    {/* Filters Skeleton */}
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col md:flex-row gap-4">
        <Skeleton className="flex-1 h-10 rounded-lg" />
        <Skeleton className="w-full md:w-40 h-10 rounded-lg" />
        <Skeleton className="w-full md:w-40 h-10 rounded-lg" />
      </div>
    </div>

    {/* Call Feed Skeleton */}
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Skeleton className="w-48 h-6 mb-2" />
        <Skeleton className="w-32 h-4" />
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="p-4 animate-pulse">
            <div className="flex items-start gap-4">
              <Skeleton className="w-4 h-4 rounded-full mt-1" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-32 h-5" />
                  <Skeleton className="w-20 h-5 rounded-full" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="w-24 h-4" />
                  <Skeleton className="w-16 h-4" />
                  <Skeleton className="w-12 h-4" />
                </div>
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-3/4 h-4" />
              </div>
              <Skeleton className="w-16 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)