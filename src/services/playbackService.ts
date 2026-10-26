import Hls from 'hls.js';
import type { Channel, PlaybackError } from '../types';

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
 * Returns documented official viewing websites for known broadcast networks
 * when their public feed is inaccessible or unauthorized for third-party embedding.
 */
export function getOfficialChannelWebsite(channel?: Channel | null): string | null {
  if (!channel) return null;
  const name = channel.name.toLowerCase();
  const url = channel.url.toLowerCase();

  if (name.includes('bein') || url.includes('bein')) {
    return 'https://www.beinsports.com';
  }
  if (name.includes('30a') || url.includes('30a-tv.com')) {
    return 'https://30a-tv.com';
  }
  if (name.includes('red bull') || url.includes('redbull')) {
    return 'https://www.redbull.com/tv';
  }
  if (name.includes('fifa') || url.includes('fifa')) {
    return 'https://www.plus.fifa.com';
  }
  if (name.includes('ert') || url.includes('ert.gr')) {
    return 'https://www.ertflix.gr';
  }
  return null;
}

/**
 * Creates accurate, evidence-based user messages for playback issues.
 * Does not label every HTTP 0 error as CORS.
 * Treats HTTP 403 as access denied or forbidden without unverified claims of regional blocking.
 */
export function formatPlaybackError(
  errorType: string,
  details?: string,
  httpStatus?: number,
  channel?: Channel | null
): PlaybackError {
  const officialUrl = getOfficialChannelWebsite(channel);

  // 1. HTTP 403: Access Denied / Forbidden
  if (httpStatus === 403) {
    return {
      message: 'Access denied by broadcaster (HTTP 403 Forbidden). The broadcast server rejected the request.',
      category: 'accessDenied',
      type: errorType,
      details: details || 'HTTP 403 Forbidden: Server refused to authorize stream request.',
      httpStatus: 403,
      isAuthRestricted: true,
      isCorsOrNetwork: false,
      canRetry: false,
      officialUrl,
      diagnosticsHelp:
        'HTTP 403 confirms the remote host received the request but rejected authorization. This may indicate required authentication, token expiration, or host access policies. It does not prove regional blocking unless independent evidence supports that conclusion.',
    };
  }

  // 2. HTTP 401: Authentication Required
  if (httpStatus === 401) {
    return {
      message: 'Authentication required (HTTP 401 Unauthorized). This stream requires valid subscriber credentials.',
      category: 'authRequired',
      type: errorType,
      details: details || 'HTTP 401 Unauthorized',
      httpStatus: 401,
      isAuthRestricted: true,
      isCorsOrNetwork: false,
      canRetry: false,
      officialUrl,
      diagnosticsHelp: 'The server requires valid subscriber credentials or active session tokens.',
    };
  }

  // 3. HTTP 404: Not Found
  if (httpStatus === 404) {
    return {
      message: 'Stream URL not found (HTTP 404 Not Found). The upstream broadcast playlist does not exist at this address.',
      category: 'notFound',
      type: errorType,
      details: details || 'HTTP 404 Not Found',
      httpStatus: 404,
      isCorsOrNetwork: true,
      canRetry: true,
      officialUrl,
      diagnosticsHelp: 'The requested playlist URL returned a 404 response. The feed address may have rotated or been retired.',
    };
  }

  // 4. HTTP 5xx: Upstream Server Error
  if (httpStatus !== undefined && httpStatus >= 500 && httpStatus <= 599) {
    return {
      message: `Broadcaster server error (HTTP ${httpStatus}). The upstream streaming server encountered an internal failure.`,
      category: 'serverError',
      type: errorType,
      details: details || `HTTP ${httpStatus} Server Error`,
      httpStatus,
      isCorsOrNetwork: true,
      canRetry: true,
      officialUrl,
      diagnosticsHelp: 'The remote content provider returned a 5xx server-side error.',
    };
  }

  // 5. Manifest Parsing Errors
  if (
    details === 'manifestParsingError' ||
    details === 'manifestIncompatibleCodecsError' ||
    details === 'levelParsingError'
  ) {
    return {
      message: 'Manifest parsing failed. The stream playlist format is invalid or malformed.',
      category: 'manifestParsing',
      type: errorType,
      details: details || 'Manifest Parsing Error',
      isCorsOrNetwork: false,
      canRetry: false,
      officialUrl,
      diagnosticsHelp:
        'The remote server returned content that could not be parsed as a valid HLS/M3U8 playlist. The endpoint may have returned HTML or a gateway error page.',
    };
  }

  // 6. Media Segment Failures
  if (
    details === 'fragLoadError' ||
    details === 'fragParsingError' ||
    details === 'fragLoopLoadingError'
  ) {
    return {
      message: 'Media segment load failed. Video segments could not be loaded from the broadcast content delivery network.',
      category: 'segmentFailed',
      type: errorType,
      details: details || 'Media Segment Load Failure',
      httpStatus,
      isCorsOrNetwork: true,
      canRetry: true,
      officialUrl,
      diagnosticsHelp:
        'The manifest was retrieved successfully, but transport stream segments (.ts / .m4s) failed to download or parse from the CDN.',
    };
  }

  // 7. Unsupported Codec
  if (
    errorType === 'mediaError' &&
    (details === 'MEDIA_ERR_DECODE' ||
      details === 'MEDIA_ERR_SRC_NOT_SUPPORTED' ||
      details === 'bufferAddCodecError')
  ) {
    return {
      message: 'Unsupported media format. The audio or video codec in this stream is not supported by your browser.',
      category: 'unsupportedCodec',
      type: errorType,
      details: details || 'Unsupported Media Codec',
      unsupportedCodec: true,
      isCorsOrNetwork: false,
      canRetry: false,
      officialUrl,
      diagnosticsHelp:
        'The browser Media Source Extensions (MSE) pipeline cannot decode the video/audio codecs advertised in this stream.',
    };
  }

  // 8. Startup Watchdog / Connection Timeout
  if (errorType === 'timeout') {
    return {
      message: details || 'Connection timed out waiting for playable media.',
      category: 'timeout',
      type: errorType,
      details: 'Startup timeout reached without playable frames.',
      isCorsOrNetwork: true,
      canRetry: true,
      officialUrl,
      diagnosticsHelp:
        'The player waited for media data to arrive and render, but no playable frames were decoded before the timeout expired.',
    };
  }

  // 9. Undetermined Network / Browser-Reported Network Failures (HTTP 0)
  if (
    httpStatus === 0 ||
    details === 'manifestLoadError' ||
    details === 'manifestLoadTimeOut' ||
    errorType === 'networkError'
  ) {
    return {
      message: 'Network request failed; cause could not be determined.',
      category: 'undeterminedNetwork',
      type: errorType,
      details: details || 'Network request failed without status code',
      httpStatus: 0,
      isCorsOrNetwork: true,
      canRetry: true,
      officialUrl,
      diagnosticsHelp:
        'The browser blocked or failed the network request without providing an HTTP response code. Possible causes include: the broadcast server is offline, network connectivity dropped, mixed content restriction, or the broadcaster does not serve Cross-Origin Resource Sharing (CORS) headers. CORS is one possible cause, not a confirmed diagnosis.',
    };
  }

  // 10. Generic Fatal Error
  return {
    message: 'An unexpected playback error occurred.',
    category: 'fatalError',
    type: errorType,
    details: details || 'Unknown playback error',
    isCorsOrNetwork: false,
    canRetry: true,
    officialUrl,
    diagnosticsHelp: 'An unhandled fatal media or network event terminated stream playback.',
  };
}
