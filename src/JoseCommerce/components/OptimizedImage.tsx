import React, { useState } from 'react';
import { getOptimizedImageUrl, getPlaceholderBlurUrl } from '../lib/imageService';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
  width?: number;
  height?: number;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  priority = false,
  aspectRatio = 'square',
  width = 400,
  height = 400,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const highResUrl = getOptimizedImageUrl(src, { width, height });
  const lqipUrl = getPlaceholderBlurUrl(src);

  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'square': return 'aspect-square';
      case 'video': return 'aspect-video';
      case 'portrait': return 'aspect-[3/4]';
      default: return '';
    }
  };

  return (
    <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${getAspectClass()} w-full`}>
      {/* 1. Low-Quality Image Placeholder (LQIP) Blur Layer */}
      {!isLoaded && !hasError && lqipUrl && (
        <img
          src={lqipUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover filter blur-md scale-105 pointer-events-none transition-opacity duration-300"
        />
      )}

      {/* 2. Main High-Res Image (Edge transformed) */}
      <img
        src={hasError ? 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=400&q=70' : highResUrl}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover object-center transition-all duration-300 ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        } ${className}`}
      />
    </div>
  );
};
