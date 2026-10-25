import React from 'react';
import { Calendar, X, Info, AlertCircle } from 'lucide-react';
import type { Channel } from '../types';

interface EpgModalProps {
  channel: Channel;
  isOpen: boolean;
  onClose: () => void;
}

export const EpgModal: React.FC<EpgModalProps> = ({ channel, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-surface-900 border border-surface-750 shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold text-white">Program Guide & Schedule</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-surface-400 hover:text-white"
            aria-label="Close guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-surface-100">{channel.name}</h4>
          <p className="text-xs text-surface-400 mt-0.5">
            Category: {channel.group} • TVG ID: {channel.tvgId || 'Not assigned'}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-surface-950 border border-surface-800 text-center space-y-2">
          <div className="p-2 rounded-full bg-surface-900 text-surface-400 w-fit mx-auto border border-surface-750">
            <AlertCircle className="w-5 h-5 text-surface-400" />
          </div>
          <h5 className="text-xs font-semibold text-surface-200">
            Electronic Program Guide (EPG) Unavailable
          </h5>
          <p className="text-xs text-surface-400 max-w-sm mx-auto leading-relaxed">
            Public IPTV playlist feeds do not provide real-time XMLTV guide telemetry for this specific stream feed.
          </p>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-surface-950/60 border border-surface-800/80 text-[11px] text-surface-400">
          <Info className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
          <span>
            Program guide data is never fabricated. Only verified schedule metadata is displayed when an XMLTV provider feed is configured.
          </span>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-surface-200 bg-surface-800 hover:bg-surface-750 rounded-lg transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
