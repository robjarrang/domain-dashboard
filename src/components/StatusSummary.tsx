'use client';

import { CheckCircleIcon, InformationCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import type { DomainRecord, DNSStatus } from '@/components/DomainCard';
import { getStaleness } from '@/utils/time';

export type HealthFilter = 'all' | 'healthy' | 'advisory' | 'misconfigured' | 'stale';

type Props = {
  domains: DomainRecord[];
  activeFilter: HealthFilter;
  onFilterChange: (filter: HealthFilter) => void;
};

type DomainHealth = 'healthy' | 'advisory' | 'misconfigured' | 'unknown';

export function domainHealth(domain: DomainRecord): DomainHealth {
  const statuses: (DNSStatus | undefined)[] = [domain.dkimStatus, domain.spfStatus, domain.dmarcStatus];
  if (statuses.some(s => s === 'error' || s === 'not-configured')) return 'misconfigured';
  if (statuses.some(s => s === 'advisory')) return 'advisory';
  if (statuses.every(s => s === 'success')) return 'healthy';
  return 'unknown';
}

export function isStale(domain: DomainRecord, now: Date = new Date()): boolean {
  return getStaleness(domain.lastChecked, now) !== 'fresh';
}

export default function StatusSummary({ domains, activeFilter, onFilterChange }: Props) {
  if (domains.length === 0) return null;

  let healthy = 0;
  let advisory = 0;
  let misconfigured = 0;
  let stale = 0;

  const now = new Date();
  for (const d of domains) {
    switch (domainHealth(d)) {
      case 'healthy': healthy++; break;
      case 'advisory': advisory++; break;
      case 'misconfigured': misconfigured++; break;
    }
    if (isStale(d, now)) stale++;
  }

  type Tile = {
    key: HealthFilter;
    label: string;
    count: number;
    icon: JSX.Element;
    accent: string;
    numberClass: string;
  };

  const tiles: Tile[] = [
    {
      key: 'healthy',
      label: 'Healthy',
      count: healthy,
      icon: <CheckCircleIcon className="w-5 h-5 text-green-600" />,
      accent: 'ring-green-600/20 group-hover:ring-green-600/40',
      numberClass: 'text-green-700',
    },
    {
      key: 'advisory',
      label: 'Advisories',
      count: advisory,
      icon: <InformationCircleIcon className="w-5 h-5 text-deep-teal" />,
      accent: 'ring-deep-teal/20 group-hover:ring-deep-teal/40',
      numberClass: 'text-deep-teal',
    },
    {
      key: 'misconfigured',
      label: 'Misconfigured',
      count: misconfigured,
      icon: <XCircleIcon className="w-5 h-5 text-red-600" />,
      accent: 'ring-red-600/20 group-hover:ring-red-600/40',
      numberClass: 'text-red-700',
    },
    {
      key: 'stale',
      label: 'Stale (>24h)',
      count: stale,
      icon: <ClockIcon className="w-5 h-5 text-amber-600" />,
      accent: 'ring-amber-600/20 group-hover:ring-amber-600/40',
      numberClass: 'text-amber-700',
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiles.map(tile => {
          const isActive = activeFilter === tile.key;
          const isDisabled = tile.count === 0;
          return (
            <button
              key={tile.key}
              type="button"
              onClick={() => {
                if (isDisabled) return;
                onFilterChange(isActive ? 'all' : tile.key);
              }}
              disabled={isDisabled}
              aria-pressed={isActive}
              className={`group relative flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left transition-all duration-200 ring-1 ${
                isActive
                  ? 'ring-2 ring-primary shadow-[0_6px_18px_-8px_rgba(0,222,202,0.65)]'
                  : `${tile.accent} shadow-[0_1px_2px_rgba(8,0,67,0.04)] hover:-translate-y-[1px] hover:shadow-md`
              } ${isDisabled ? 'opacity-60 cursor-default hover:translate-y-0 hover:shadow-[0_1px_2px_rgba(8,0,67,0.04)]' : 'cursor-pointer'}`}
            >
              <div className="shrink-0">{tile.icon}</div>
              <div className="flex flex-col min-w-0">
                <span className={`text-2xl font-semibold leading-none ${tile.numberClass}`}>{tile.count}</span>
                <span className="text-xs mt-1 text-deep-teal/80">{tile.label}</span>
              </div>
              {isActive && (
                <span className="absolute top-2 right-2 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  Filtered
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-deep-teal/70">
        {domains.length} {domains.length === 1 ? 'domain' : 'domains'} tracked ·{' '}
        {summaryLabel(misconfigured, advisory)}
        {activeFilter !== 'all' && (
          <>
            {' · '}
            <button
              type="button"
              onClick={() => onFilterChange('all')}
              className="text-primary hover:underline font-medium"
            >
              Clear filter
            </button>
          </>
        )}
      </p>
    </div>
  );
}

function summaryLabel(misconfigured: number, advisory: number): string {
  if (misconfigured === 0 && advisory === 0) return 'all records passing';
  const parts: string[] = [];
  if (misconfigured > 0) parts.push(`${misconfigured} needing attention`);
  if (advisory > 0) parts.push(`${advisory} with advisories`);
  return parts.join(', ');
}
