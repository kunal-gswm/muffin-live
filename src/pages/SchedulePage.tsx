import React, { useState } from 'react';
import {
  Calendar,
  ExternalLink,
  ShieldCheck,
  Tv,
  Clock,
  Globe,
} from 'lucide-react';
import type { SportType } from '../types';
import { scheduleService } from '../services/scheduleService';

export const SchedulePage: React.FC = () => {
  const [selectedSport, setSelectedSport] = useState<SportType>('all');
  const fixtures = scheduleService.getFixtures(selectedSport);

  const sportButtons: Array<{ id: SportType; label: string }> = [
    { id: 'all', label: 'All Events' },
    { id: 'football', label: 'Football' },
    { id: 'cricket', label: 'Cricket' },
    { id: 'motorsport', label: 'Motorsport' },
    { id: 'basketball', label: 'Basketball' },
    { id: 'tennis', label: 'Tennis' },
    { id: 'other', label: 'Other Sports' },
  ];

  const formatEventDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Compliance Notice */}
      <div className="p-4 sm:p-5 rounded-xl bg-surface-900 border border-surface-800">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Calendar className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Live Sports Schedule & Official Broadcasters
              </h2>
            </div>
            <p className="text-xs text-surface-400 max-w-2xl leading-relaxed">
              Discover verified tournament fixtures and legitimate rights holder portals. Where a match
              cannot be watched via authorized public feeds, direct links to official licensed broadcasters
              are provided.
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-850 border border-surface-750 text-xs text-surface-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Authorized Portals Only</span>
          </div>
        </div>

        {/* Sport Subcategory Filter Buttons */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-surface-800/80 overflow-x-auto no-scrollbar pb-1">
          {sportButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setSelectedSport(btn.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                selectedSport === btn.id
                  ? 'bg-accent text-surface-950 font-semibold shadow-sm'
                  : 'bg-surface-850 hover:bg-surface-800 text-surface-300 hover:text-white border border-surface-750'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fixtures List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fixtures.map((fixture) => (
          <div
            key={fixture.id}
            className="p-4 rounded-xl bg-surface-900 border border-surface-800 flex flex-col justify-between hover:border-surface-700 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-accent/15 text-accent uppercase border border-accent/25">
                  {fixture.sport}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-surface-400">
                  <Clock className="w-3.5 h-3.5 text-surface-500" />
                  <span>{formatEventDate(fixture.startTime)}</span>
                </div>
              </div>

              <span className="text-xs text-surface-400 font-medium">{fixture.competition}</span>
              <h3 className="text-sm font-bold text-white mt-0.5">
                {fixture.homeTeam} vs {fixture.awayTeam}
              </h3>
            </div>

            {/* Official Broadcaster Options */}
            <div className="mt-4 pt-3 border-t border-surface-800/80">
              <span className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider block mb-2">
                Official Rights Holders:
              </span>
              <div className="flex flex-wrap gap-2">
                {fixture.officialBroadcasters.map((ob, idx) => (
                  <a
                    key={idx}
                    href={ob.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-850 hover:bg-surface-800 border border-surface-750 hover:border-surface-700 text-xs text-surface-200 hover:text-white transition-colors"
                  >
                    <Tv className="w-3 h-3 text-accent" />
                    <span>{ob.broadcaster}</span>
                    <span className="text-[10px] text-surface-500">({ob.region})</span>
                    <ExternalLink className="w-2.5 h-2.5 text-surface-400 ml-0.5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance / Disclaimer Footer */}
      <div className="p-4 rounded-xl bg-surface-950 border border-surface-850 text-xs text-surface-400 flex items-start gap-3">
        <Globe className="w-4 h-4 text-surface-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-surface-300">Broadcaster Licensing Notice:</strong> Muffin Live TV
          provides direct links to licensed television networks and rights holders for international events.
          We strictly do not host pirated feeds, circumvent DRM, or evade paywalls.
        </p>
      </div>
    </div>
  );
};
