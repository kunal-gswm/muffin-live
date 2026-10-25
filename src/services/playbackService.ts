import Hls from 'hls.js';
import type { PlaybackError } from '../types';

export function isHlsSupported(): boolean {
  return Hls.isSupported();
}

export function canPlayNativeHls(video: HTMLVideoElement): boolean {
  return Boolean(
    video.canPlayType('application/vnd.apple.mpegurl') ||
    video.canPlayType('application/x-mpegURL')
  );
}

export function isHlsStream(url: string): boolean {
  const cleanUrl = url.toLowerCase().split('?')[0];
  return cleanUrl.endsWith('.m3u8') || cleanUrl.includes('.m3u8');
}

/**
 * Creates friendly, actionable user messages for playback issues.
 */
export function formatPlaybackError(
  errorType: string,
  details?: string,
  httpStatus?: number
): PlaybackError {
  // CORS / Network / Inaccessible stream
  if (
    details === 'manifestLoadError' ||
    details === 'manifestParsingError' ||
    details === 'levelLoadError' ||
    errorType === 'networkError' ||
    httpStatus === 0 ||
    httpStatus === 403 ||
    httpStatus === 404
  ) {
    let msg = 'Stream unavailable or blocked by CORS / Geo-restriction.';
    if (httpStatus === 403) {
      msg = 'Access forbidden: This broadcast stream may be geo-restricted or token-protected.';
    } else if (httpStatus === 404) {
      msg = 'Stream feed not found: The broadcaster feed may be currently offline.';
    } else if (details === 'manifestLoadError') {
      msg = 'Unable to load stream. The server blocked web access (CORS policy) or is temporarily offline.';
    }

    return {
      message: msg,
      type: errorType,
      details: details || `HTTP ${httpStatus || 'Network/CORS'}`,
      isCorsOrNetwork: true,
      canRetry: true,
    };
  }

  if (errorType === 'mediaError') {
    return {
      message: 'Media decode error encountered. Codec may be incompatible with this browser.',
      type: errorType,
      details,
      isCorsOrNetwork: false,
      canRetry: true,
    };
  }

  return {
    message: 'An unexpected playback error occurred.',
    type: errorType,
    details: details || 'Unknown error',
    isCorsOrNetwork: false,
    canRetry: true,
  };
}
