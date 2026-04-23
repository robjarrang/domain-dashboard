'use client';

import { CheckCircleIcon, InformationCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import type { DomainRecord, DNSStatus } from '@/components/DomainCard';
import { getStaleness } from '@/utils/time';

type Props = {
  domains: DomainRecord[];
};

type DomainHealth = 'healthy' | 'advisory' | 'misconfigured' | 'unknown';

function domainHealth(domain: DomainRecord): DomainHealth {
  const statuses: (DNSStatus | undefined)[] = [domain.dkimStatus, domain.spfStatus, domain.dmarcStatus];
  if (statuses.some(s => s === 'error' || s === 'not-configured')) return 'misconfigured';
  if (statuses.some(s => s === 'advisory')) return 'advisory';
  if (statuses.every(s => s === 'success')) return 'healthy';
  return 'unknown';
}

export default function StatusSummary({ domains }: Props) {
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
    const s = getStaleness(d.lastChecked, now);
    if (s !== 'fresh') stale++;
  }

  const items: Array<{ key: string; label: string; count: number; icon: JSX.Element; className: string }> = [
    {
      key: 'healthy',
      label: 'Healthy',
      count: healthy,
      icon: <CheckCircleIcon className="w-5 h-5" />,
      className: 'text-green-700 bg-green-50 ring-1 ring-green-600/10',
    },
    {
      key: 'advisory',
      label: 'With advisories',
      count: advisory,
      icon: <InformationCircleIcon className="w-5 h-5" />,
      className: 'text-deep-teal bg-ice-white ring-1 ring-deep-teal/10',
    },
    {
      key: 'misconfigured',
      label: 'Misconfigured',
      count: misconfigured,
      icon: <XCircleIcon className="w-5 h-5" />,
      className: 'text-red-700 bg-red-50 ring-1 ring-red-600/10',
    },
    {
      key: 'stale',
      label: 'Stale (>24h)',
      count: stale,
      icon: <ClockIcon className="w-5 h-5" />,
      className: 'text-amber-700 bg-amber-50 ring-1 ring-amber-600/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map(item => (
        <div
          key={item.key}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 ${item.className}`}
        >
          {item.icon}
          <div className="flex flex-col">
            <span className="text-2xl font-semibold leading-none">{item.count}</span>
            <span className="text-xs mt-1 opacity-80">{item.label}</span>
          </div>
        </div>
      ))}
      <div className="col-span-2 md:col-span-4 text-xs text-deep-teal/70">
        {domains.length} {domains.length === 1 ? 'domain' : 'domains'} tracked · {summaryLabel(misconfigured, advisory)}
      </div>
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
