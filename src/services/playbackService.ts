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
 * Creates friendly, accurate user messages for playback issues without making unverified claims.
 */
export function formatPlaybackError(
  errorType: string,
  details?: string,
  httpStatus?: number
): PlaybackError {
  if (httpStatus === 403) {
    return {
      message: 'Access Restricted (HTTP 403). The broadcast server requires regional authorization or active access tokens.',
      type: errorType,
      details: details || 'HTTP 403 Forbidden',
      httpStatus: 403,
      isAuthRestricted: true,
      isCorsOrNetwork: false,
      canRetry: true,
    };
  }

  if (httpStatus === 404) {
    return {
      message: 'Stream URL not found (HTTP 404). Upstream broadcast feed may have rotated or changed address.',
      type: errorType,
      details: details || 'HTTP 404 Not Found',
      httpStatus: 404,
      isCorsOrNetwork: true,
      canRetry: true,
    };
  }

  if (details === 'manifestLoadError' || httpStatus === 0) {
    return {
      message: 'Unable to connect to broadcast server (HTTP 0). The stream may be restricted by cross-origin policies (CORS) or offline.',
      type: errorType,
      details: details || 'Network / CORS Error',
      httpStatus: 0,
      isCorsOrNetwork: true,
      canRetry: true,
    };
  }

  if (errorType === 'mediaError' || details === 'MEDIA_ERR_DECODE' || details === 'MEDIA_ERR_SRC_NOT_SUPPORTED') {
    return {
      message: 'Media decode error encountered. The video or audio codec is not supported by this browser.',
      type: errorType,
      details: details || 'Unsupported Media Codec',
      unsupportedCodec: true,
      isCorsOrNetwork: false,
      canRetry: false,
    };
  }

  if (errorType === 'timeout') {
    return {
      message: details || 'Connection timed out waiting for playable media.',
      type: errorType,
      details: 'Watchdog timeout reached',
      isCorsOrNetwork: true,
      canRetry: true,
    };
  }

  return {
    message: 'An unexpected playback error occurred.',
    type: errorType,
    details: details || 'Unknown playback error',
    isCorsOrNetwork: false,
    canRetry: true,
  };
}
