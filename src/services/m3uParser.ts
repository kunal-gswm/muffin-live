import type { Channel, PlaylistParseResult } from '../types';

/**
 * Decodes common HTML entities found in M3U metadata.
 */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/**
 * Parses key-value attributes from the #EXTINF header line.
 * Handles single quotes, double quotes, and unquoted values.
 */
function parseAttributes(line: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  // Regex matches: attr-name="value" OR attr-name='value' OR attr-name=value
  const regex = /([\w-]+)=(?:"([^"]*)"|'([^']*)'|([^\s,]+))/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    const key = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    attrs[key] = value.trim();
  }

  return attrs;
}

/**
 * Generates a stable deterministic hash from a string.
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Normalizes category/group name.
 */
function normalizeCategory(rawCategory: string | undefined): string {
  if (!rawCategory) return 'General';
  const decoded = decodeHtmlEntities(rawCategory).trim();
  if (!decoded || decoded === ';' || decoded === '-') return 'General';
  
  // Clean up common prefix artifacts e.g. "News;Sports" -> use first
  const primary = decoded.split(';')[0].trim();
  if (!primary) return 'General';

  // Capitalize first letter of each word
  return primary.charAt(0).toUpperCase() + primary.slice(1);
}

/**
 * Parses raw M3U text into a structured list of channels and metadata.
 */
export function parseM3U(content: string): PlaylistParseResult {
  if (!content || typeof content !== 'string') {
    return {
      channels: [],
      categories: [],
      countries: [],
      languages: [],
      totalParsed: 0,
      errorsCount: 0,
    };
  }

  const lines = content.split(/\r?\n/);
  const channels: Channel[] = [];
  const categoriesSet = new Set<string>();
  const countriesSet = new Set<string>();
  const languagesSet = new Set<string>();
  const seenUrls = new Set<string>();

  let currentExtInf: string | null = null;
  let currentGroup: string | null = null;
  let currentUserAgent: string | undefined = undefined;
  let currentReferrer: string | undefined = undefined;
  let errorsCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) continue;

    // Check for #EXTINF
    if (line.startsWith('#EXTINF:')) {
      currentExtInf = line;
      currentGroup = null;
      currentUserAgent = undefined;
      currentReferrer = undefined;
      continue;
    }

    // Check for #EXTGRP (standalone group tag)
    if (line.startsWith('#EXTGRP:')) {
      currentGroup = line.slice(8).trim();
      continue;
    }

    // Check for #EXTVLCOPT
    if (line.startsWith('#EXTVLCOPT:')) {
      const opt = line.slice(11).trim();
      if (opt.startsWith('http-user-agent=')) {
        currentUserAgent = opt.slice(16).trim();
      } else if (opt.startsWith('http-referrer=')) {
        currentReferrer = opt.slice(14).trim();
      }
      continue;
    }

    // Ignore other comments/directives (like #EXTM3U)
    if (line.startsWith('#')) {
      continue;
    }

    // This line is a Stream URL (or malformed line)
    if (currentExtInf) {
      const streamUrl = line;

      // Validate URL format
      if (!streamUrl.startsWith('http://') && !streamUrl.startsWith('https://') && !streamUrl.startsWith('rtmp://')) {
        errorsCount++;
        currentExtInf = null;
        continue;
      }

      // Check for exact duplicate stream URL to avoid redundant duplicate entries
      if (seenUrls.has(streamUrl)) {
        currentExtInf = null;
        continue;
      }

      try {
        const commaIndex = currentExtInf.indexOf(',');
        let channelName = '';
        let metadataPart = '';

        if (commaIndex !== -1) {
          metadataPart = currentExtInf.slice(8, commaIndex).trim();
          channelName = currentExtInf.slice(commaIndex + 1).trim();
        } else {
          metadataPart = currentExtInf.slice(8).trim();
          channelName = 'Unknown Channel';
        }

        channelName = decodeHtmlEntities(channelName);
        if (!channelName) channelName = 'Unnamed Channel';

        const attrs = parseAttributes(metadataPart);

        // Attributes extraction
        const tvgId = attrs['tvg-id'] || null;
        const tvgName = attrs['tvg-name'] ? decodeHtmlEntities(attrs['tvg-name']) : null;
        const logo = attrs['tvg-logo'] || attrs['logo'] || null;
        let rawCountry = attrs['tvg-country'] || attrs['country'] || null;
        const rawLanguage = attrs['tvg-language'] || attrs['language'] || null;
        const groupTitle = currentGroup || attrs['group-title'] || attrs['group'] || undefined;

        // If country not explicitly provided, try extracting 2-letter ISO code from iptv-org tvg-id (e.g. "Channel.au@SD" or "Channel.us")
        if (!rawCountry && tvgId) {
          const match = tvgId.match(/\.([a-z]{2})(?:@[a-z0-9]+)?$/i);
          if (match) {
            rawCountry = match[1];
          }
        }

        const group = normalizeCategory(groupTitle);
        const country = rawCountry ? rawCountry.toUpperCase().trim() : null;
        const language = rawLanguage ? rawLanguage.trim() : null;
        const userAgent = attrs['user-agent'] || currentUserAgent;
        const referrer = attrs['referrer'] || currentReferrer;

        // Effective display name
        const displayName = channelName !== 'Unnamed Channel' ? channelName : (tvgName || 'Channel');

        // Create deterministic unique ID based on tvg-id, clean name, and url hash
        const cleanNameSlug = displayName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
        const urlHash = simpleHash(streamUrl);
        const channelId = tvgId ? `${tvgId}-${urlHash}` : `${cleanNameSlug}-${urlHash}`;

        seenUrls.add(streamUrl);

        const channel: Channel = {
          id: channelId,
          name: displayName,
          url: streamUrl,
          logo: logo && logo.startsWith('http') ? logo : null,
          group,
          country,
          language,
          tvgId,
          httpUserAgent: userAgent,
          httpReferrer: referrer,
        };

        channels.push(channel);

        if (group) categoriesSet.add(group);
        if (country) countriesSet.add(country);
        if (language) languagesSet.add(language);
      } catch (err) {
        console.warn('Failed parsing channel entry:', err);
        errorsCount++;
      } finally {
        currentExtInf = null;
        currentGroup = null;
      }
    }
  }

  // Sort categories alphabetically with 'General' near the end if present
  const categories = Array.from(categoriesSet).sort((a, b) => {
    if (a === 'General') return 1;
    if (b === 'General') return -1;
    return a.localeCompare(b);
  });

  const countries = Array.from(countriesSet).sort((a, b) => a.localeCompare(b));
  const languages = Array.from(languagesSet).sort((a, b) => a.localeCompare(b));

  return {
    channels,
    categories,
    countries,
    languages,
    totalParsed: channels.length,
    errorsCount,
  };
}
