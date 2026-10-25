import React, { useState } from 'react';
import {
  Calendar,
  ExternalLink,
  ShieldCheck,
  Tv,
  Globe,
  Info,
} from 'lucide-react';
import type { SportType } from '../types';
import { scheduleService } from '../services/scheduleService';

export const SchedulePage: React.FC = () => {
  const [selectedSport, setSelectedSport] = useState<SportType>('all');
  const competitions = scheduleService.getCompetitions(selectedSport);

  const sportButtons: Array<{ id: SportType; label: string }> = [
    { id: 'all', label: 'All Competitions' },
    { id: 'football', label: 'Football' },
    { id: 'cricket', label: 'Cricket' },
    { id: 'motorsport', label: 'Motorsport' },
    { id: 'basketball', label: 'Basketball' },
    { id: 'tennis', label: 'Tennis' },
    { id: 'other', label: 'Other Sports' },
  ];

  return (
    <div className="space-y-6">
      {/* Integrity Notice & Header */}
      <div className="p-4 sm:p-5 rounded-xl bg-surface-900 border border-surface-800 space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Calendar className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Official Competition Schedules & Rights Holders
              </h2>
            </div>
            <p className="text-xs text-surface-400 max-w-2xl leading-relaxed">
              Direct links to official tournament calendars and authorized licensed broadcasters.
              Muffin Live TV does not fabricate fixtures, invent match timings, or re-stream paywalled broadcasts.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-850 border border-surface-750 text-xs text-surface-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Authorized Portals</span>
          </div>
        </div>

        {/* Live Feed Status Banner (Truthful disclosure) */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-950 border border-surface-800 text-xs text-surface-400">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong className="text-surface-300 font-medium">Schedule Feed Status: </strong>
            Live fixture API feed is not currently connected. To maintain strict data integrity,
            individual match kick-offs are not fabricated. Use the official competition portals below for verified real-time match times.
          </span>
        </div>

        {/* Sport Subcategory Filter Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-surface-800/80 overflow-x-auto no-scrollbar pb-1">
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

      {/* Competitions Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {competitions.map((comp) => (
          <div
            key={comp.id}
            className="p-4 rounded-xl bg-surface-900 border border-surface-800 flex flex-col justify-between hover:border-surface-700 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-accent/15 text-accent uppercase border border-accent/25">
                  {comp.sport}
                </span>
                <span className="text-[11px] text-surface-400 truncate max-w-[200px]">
                  {comp.organizer}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white mb-1">{comp.competition}</h3>
              <p className="text-xs text-surface-400 leading-relaxed mb-3">
                {comp.description}
              </p>

              <a
                href={comp.officialScheduleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-accent/15 hover:bg-accent/25 text-accent text-xs font-medium border border-accent/30 transition-colors"
              >
                <span>View Official Calendar & Fixtures</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Official Broadcaster Portals */}
            <div className="mt-4 pt-3 border-t border-surface-800/80">
              <span className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider block mb-2">
                Authorized Broadcaster Portals:
              </span>
              <div className="flex flex-wrap gap-2">
                {comp.verifiedBroadcasters.map((ob, idx) => (
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
          <strong className="text-surface-300">Broadcaster Licensing Notice:</strong> Muffin Live TV provides direct links to verified tournament schedules and legitimate rights holders. We strictly do not host pirated feeds, circumvent DRM, or evade paywalls.
        </p>
      </div>
    </div>
  );
};
