import React from 'react';
import { AlertCircle, Film, RefreshCw, Bookmark, History, Search } from 'lucide-react';

interface EmptyStateProps {
  type?: 'search' | 'favorites' | 'history' | 'error' | 'empty';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'empty',
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  const getDefaultContent = () => {
    switch (type) {
      case 'search':
        return {
          icon: <Search className="w-10 h-10 text-surface-500" />,
          title: title || 'No matching channels found',
          desc: description || 'Try adjusting your search query, clearing filters, or switching categories.',
        };
      case 'favorites':
        return {
          icon: <Bookmark className="w-10 h-10 text-surface-500" />,
          title: title || 'No favorite channels yet',
          desc: description || 'Click the bookmark icon on any channel card to add it to your favorites for quick access.',
        };
      case 'history':
        return {
          icon: <History className="w-10 h-10 text-surface-500" />,
          title: title || 'No watch history',
          desc: description || 'Channels you start watching will automatically appear here.',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-10 h-10 text-red-400" />,
          title: title || 'Failed to load playlist',
          desc: description || 'The playlist could not be retrieved from the network or source URL.',
        };
      default:
        return {
          icon: <Film className="w-10 h-10 text-surface-500" />,
          title: title || 'No channels available',
          desc: description || 'Select another category or playlist source from the sidebar.',
        };
    }
  };

  const content = getDefaultContent();

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto my-12 rounded-lg bg-surface-900/50 border border-surface-800 ${className}`}>
      <div className="p-3 mb-4 rounded-full bg-surface-800/80 border border-surface-750">
        {content.icon}
      </div>
      <h3 className="text-base font-medium text-surface-200 mb-1">{content.title}</h3>
      <p className="text-sm text-surface-400 leading-relaxed mb-6">{content.desc}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-surface-100 bg-surface-800 hover:bg-surface-750 border border-surface-700 hover:border-surface-600 rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <RefreshCw className="w-4 h-4 text-accent" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};
