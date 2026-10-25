import type { Channel, PlaylistParseResult, PlaylistSource } from '../types';
import { classifyChannelSport } from './sportsInference';

/**
 * Normalizes stream URL for fingerprint comparison (strips query parameters, trailing slashes, and protocol).
 */
export function getUrlFingerprint(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`.toLowerCase().replace(/\/+$/, '');
  } catch {
    return url.split('?')[0].toLowerCase().trim();
  }
}

/**
 * Generates a normalized deduplication key for a channel.
 * Carefully avoids merging distinct regional feeds or variants.
 */
export function getDeduplicationKey(channel: Channel): string {
  // If exact stream URL match, it's definitely the same feed
  const urlFingerprint = getUrlFingerprint(channel.url);

  // If stable tvg-id is present with country
  if (channel.tvgId && channel.tvgId.length > 3) {
    const country = channel.country || 'GLOBAL';
    return `tvg:${channel.tvgId.toLowerCase()}:${country}`;
  }

  // Otherwise, match strictly on normalized name + country + language
  const cleanName = channel.name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
  const country = channel.country || 'GLOBAL';
  const lang = channel.language || 'UND';

  return `feed:${cleanName}:${country}:${lang}:${urlFingerprint}`;
}

export interface SourceMergeInput {
  source: PlaylistSource;
  result: PlaylistParseResult;
}

/**
 * Merges channels from multiple sources concurrently fetched, preserving distinct feeds,
 * tagging provenance, and inferring sports classifications.
 */
export function mergeSources(inputs: SourceMergeInput[]): PlaylistParseResult {
  const channelMap = new Map<string, Channel>();
  const categoriesSet = new Set<string>();
  const countriesSet = new Set<string>();
  const languagesSet = new Set<string>();
  let totalParsed = 0;
  let errorsCount = 0;

  for (const { source, result } of inputs) {
    totalParsed += result.totalParsed;
    errorsCount += result.errorsCount;

    for (const rawChannel of result.channels) {
      // 1. Sport classification
      const sportClass = classifyChannelSport(
        rawChannel.name,
        rawChannel.group,
        rawChannel.tvgId || ''
      );

      // If source is dedicated sports, enforce sports channel status
      const isSportsSource = source.isSportsSource || source.category === 'sports';
      const isSports = isSportsSource || sportClass.isSportsChannel;

      const groupName = isSports && rawChannel.group === 'General' ? 'Sports' : rawChannel.group;

      const channelWithProvenance: Channel = {
        ...rawChannel,
        group: groupName,
        sourceId: source.id,
        sourceName: source.name,
        sources: [source.name],
        sportType: isSports ? sportClass.sportType : undefined,
        isInferredSport: isSports ? sportClass.isInferred : false,
        observedHealth: 'unknown',
      };

      // 2. Deduplication check
      const dedupKey = getDeduplicationKey(channelWithProvenance);
      const existing = channelMap.get(dedupKey);

      if (existing) {
        // Merge provenance sources
        const mergedSources = Array.from(
          new Set([...(existing.sources || [existing.sourceName || 'Unknown']), source.name])
        );

        // Keep the best logo
        const logo = existing.logo || channelWithProvenance.logo;
        // Keep the best quality info
        const quality = existing.quality || channelWithProvenance.quality;

        channelMap.set(dedupKey, {
          ...existing,
          logo,
          quality,
          sources: mergedSources,
        });
      } else {
        channelMap.set(dedupKey, channelWithProvenance);
      }

      if (groupName) categoriesSet.add(groupName);
      if (channelWithProvenance.country) countriesSet.add(channelWithProvenance.country);
      if (channelWithProvenance.language) languagesSet.add(channelWithProvenance.language);
    }
  }

  const mergedChannels = Array.from(channelMap.values());

  const categories = Array.from(categoriesSet).sort((a, b) => {
    if (a === 'Sports') return -1;
    if (b === 'Sports') return 1;
    return a.localeCompare(b);
  });

  const countries = Array.from(countriesSet).sort((a, b) => a.localeCompare(b));
  const languages = Array.from(languagesSet).sort((a, b) => a.localeCompare(b));

  return {
    channels: mergedChannels,
    categories,
    countries,
    languages,
    totalParsed,
    errorsCount,
  };
}
