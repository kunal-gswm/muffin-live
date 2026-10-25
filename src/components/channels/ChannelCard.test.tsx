import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChannelCard } from './ChannelCard';
import type { Channel } from '../../types';

const mockChannel: Channel = {
  id: 'test-chan-1',
  name: 'Sky Sports Premier',
  url: 'https://example.com/skysports.m3u8',
  logo: 'https://example.com/skysports.png',
  group: 'Sports',
  country: 'UK',
  language: 'English',
  tvgId: 'SkySports.uk',
};

describe('ChannelCard', () => {
  it('renders channel name, category, and country', () => {
    render(
      <ChannelCard
        channel={mockChannel}
        isActive={false}
        isFavorite={false}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
      />
    );

    expect(screen.getByText('Sky Sports Premier')).toBeInTheDocument();
    expect(screen.getByText('Sports')).toBeInTheDocument();
    expect(screen.getByText('UK')).toBeInTheDocument();
  });

  it('triggers onSelect when card is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <ChannelCard
        channel={mockChannel}
        isActive={false}
        isFavorite={false}
        onSelect={handleSelect}
        onToggleFavorite={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('channel-card'));
    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(mockChannel);
  });

  it('triggers onToggleFavorite when bookmark button is clicked', () => {
    const handleToggleFavorite = vi.fn();
    render(
      <ChannelCard
        channel={mockChannel}
        isActive={false}
        isFavorite={false}
        onSelect={vi.fn()}
        onToggleFavorite={handleToggleFavorite}
      />
    );

    const favButton = screen.getByLabelText(/Add Sky Sports Premier to favorites/i);
    fireEvent.click(favButton);
    expect(handleToggleFavorite).toHaveBeenCalledWith(mockChannel.id);
  });

  it('displays actual playing status only when active and playing', () => {
    const { rerender } = render(
      <ChannelCard
        channel={mockChannel}
        isActive={false}
        playbackStatus="playing"
        isFavorite={false}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
      />
    );

    // When inactive, no fake playing indicator is shown
    expect(screen.queryByText('Playing')).not.toBeInTheDocument();

    // When active, actual playing indicator appears
    rerender(
      <ChannelCard
        channel={mockChannel}
        isActive={true}
        playbackStatus="playing"
        isFavorite={false}
        onSelect={vi.fn()}
        onToggleFavorite={vi.fn()}
      />
    );
    expect(screen.getByText('Playing')).toBeInTheDocument();
  });
});
