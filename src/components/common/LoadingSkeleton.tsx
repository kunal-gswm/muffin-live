import React from 'react';

interface LoadingSkeletonProps {
  viewMode?: 'grid' | 'list';
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  viewMode = 'grid',
  count = 12,
}) => {
  const items = Array.from({ length: count });

  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        {items.map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-3 bg-surface-900 border border-surface-800 rounded-md animate-pulse"
          >
            <div className="w-10 h-10 rounded bg-surface-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-surface-800 rounded w-1/3" />
              <div className="h-3 bg-surface-850 rounded w-1/5" />
            </div>
            <div className="w-16 h-5 bg-surface-800 rounded" />
            <div className="w-6 h-6 bg-surface-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {items.map((_, i) => (
        <div
          key={i}
          className="flex flex-col bg-surface-900 border border-surface-800 rounded-md p-3 space-y-3 animate-pulse"
        >
          <div className="w-full aspect-video rounded bg-surface-800 flex items-center justify-center" />
          <div className="space-y-2 pt-1">
            <div className="h-3.5 bg-surface-800 rounded w-3/4" />
            <div className="flex justify-between items-center pt-1">
              <div className="h-2.5 bg-surface-850 rounded w-1/3" />
              <div className="h-2.5 bg-surface-850 rounded w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
