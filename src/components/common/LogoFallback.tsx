import React, { useState } from 'react';
import { Tv } from 'lucide-react';

interface LogoFallbackProps {
  src: string | null;
  alt: string;
  className?: string;
  fallbackText?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LogoFallback: React.FC<LogoFallbackProps> = ({
  src,
  alt,
  className = '',
  fallbackText,
  size = 'md',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const getInitials = (text: string) => {
    const clean = text.replace(/[^a-zA-Z0-9 ]/g, '').trim();
    if (!clean) return 'TV';
    const words = clean.split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(fallbackText || alt);

  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-surface-800 text-surface-400 font-semibold rounded select-none border border-surface-750 ${className}`}
        title={alt}
      >
        {size === 'lg' ? (
          <div className="flex flex-col items-center justify-center gap-1">
            <Tv className="w-8 h-8 text-surface-500" />
            <span className="text-xs font-mono tracking-wider text-surface-400">{initials}</span>
          </div>
        ) : (
          <span className="text-xs font-mono tracking-wider">{initials}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded bg-surface-900 border border-surface-750 ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-800/80 animate-pulse text-[10px] text-surface-500">
          <Tv className="w-4 h-4 text-surface-600" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-contain p-1 transition-opacity duration-200 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
