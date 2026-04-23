'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatRelativeTime, getStaleness, stalenessClasses } from '@/utils/time';
import CopyButton from '@/components/CopyButton';
import DomainToolsMenu from '@/components/DomainToolsMenu';
import { 
  ChevronDownIcon, 
  ArrowPathIcon,
  TrashIcon,
  ChevronUpIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

export type DNSStatus = 'success' | 'error' | 'not-configured' | 'advisory';

export type DomainRecord = {
  id: string;
  name: string;
  dkimSelector: string;
  dkim: string | null;
  spf: string | null;
  dmarc: string | null;
  lastChecked: string;
  dismissedAdvisories: string[] | string | null;  // Updated type to match possible values
  dkimStatus?: DNSStatus;
  spfStatus?: DNSStatus;
  dmarcStatus?: DNSStatus;
  espId?: string | null;
  esp?: {
    id: string;
    name: string;
  } | null;
};

type DomainCardProps = {
  domain: DomainRecord;
  onRefresh: (id: string) => Promise<void>;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
};

const getStatusIcon = (status?: DNSStatus, isLoading?: boolean, isDismissed?: boolean) => {
  if (isLoading) {
    return <ArrowPathIcon className="w-5 h-5 text-primary animate-spin" />;
  }
  
  if (isDismissed) {
    return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
  }
  
  switch (status) {
    case 'success':
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    case 'error':
      return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
    case 'advisory':
      return <InformationCircleIcon className="w-5 h-5 text-primary" />;
    case 'not-configured':
    default:
      return <XCircleIcon className="w-5 h-5 text-red-500" />;
  }
};

const getStatusColor = (status?: DNSStatus, isDismissed?: boolean) => {
  if (isDismissed) {
    return 'text-green-700 bg-green-50 ring-1 ring-green-600/10';
  }
  
  switch (status) {
    case 'success':
      return 'text-green-700 bg-green-50 ring-1 ring-green-600/10';
    case 'error':
      return 'text-yellow-700 bg-yellow-50 ring-1 ring-yellow-600/10';
    case 'advisory':
      return 'text-deep-teal bg-ice-white ring-1 ring-deep-teal/10';
    case 'not-configured':
    default:
      return 'text-red-700 bg-red-50 ring-1 ring-red-600/10';
  }
};

// Strip the trailing " (details)" that updateDomainWithHistory appends so we
// can present / copy the raw DNS record value.
function rawRecordValue(record: string | null): string {
  if (!record) return '';
  const idx = record.lastIndexOf(' (');
  return idx === -1 ? record : record.slice(0, idx);
}

function buildAllRecordsBlock(domain: DomainRecord): string {
  const lines: string[] = [`# ${domain.name}`];
  const dkim = rawRecordValue(domain.dkim);
  const spf = rawRecordValue(domain.spf);
  const dmarc = rawRecordValue(domain.dmarc);
  lines.push('', `; DKIM — ${domain.dkimSelector}._domainkey.${domain.name}`);
  lines.push(dkim || '(not configured)');
  lines.push('', `; SPF — ${domain.name}`);
  lines.push(spf || '(not configured)');
  lines.push('', `; DMARC — _dmarc.${domain.name}`);
  lines.push(dmarc || '(not configured)');
  return lines.join('\n');
}

function parseDmarcReportAddresses(dmarc: string | null): { rua: string[]; ruf: string[] } {
  if (!dmarc) return { rua: [], ruf: [] };
  const raw = rawRecordValue(dmarc);
  const tags: Record<string, string> = {};
  for (const segment of raw.split(';')) {
    const eq = segment.indexOf('=');
    if (eq === -1) continue;
    const key = segment.slice(0, eq).trim().toLowerCase();
    tags[key] = segment.slice(eq + 1).trim();
  }
  const splitList = (value?: string): string[] =>
    value
      ? value.split(',').map(v => v.trim()).filter(Boolean)
      : [];
  return { rua: splitList(tags.rua), ruf: splitList(tags.ruf) };
}

function renderDmarcReportAddresses(dmarc: string | null) {
  const { rua, ruf } = parseDmarcReportAddresses(dmarc);
  if (rua.length === 0 && ruf.length === 0) return null;
  const renderList = (addrs: string[]) => (
    <ul className="mt-1 space-y-1">
      {addrs.map(addr => {
        const href = addr;
        const display = addr.replace(/^mailto:/, '');
        return (
          <li key={addr} className="text-sm">
            <a
              href={href}
              target={addr.startsWith('https:') ? '_blank' : undefined}
              rel="noreferrer noopener"
              className="font-mono text-primary hover:underline break-all"
            >
              {display}
            </a>
          </li>
        );
      })}
    </ul>
  );
  return (
    <div className="mt-3 grid gap-3 md:grid-cols-2">
      {rua.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-deep-teal/70">Aggregate reports (rua)</p>
          {renderList(rua)}
        </div>
      )}
      {ruf.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-deep-teal/70">Forensic reports (ruf)</p>
          {renderList(ruf)}
        </div>
      )}
    </div>
  );
}


export default function DomainCard({ domain, onRefresh, onDelete, onEdit }: DomainCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh(domain.id);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this domain?')) {
      onDelete(domain.id);
    }
  };

  const handleDismissAdvisory = async (type: string) => {
    try {
      setError(null);
      const dismissedAdvisories = [...(domain.dismissedAdvisories || [])];
      if (!dismissedAdvisories.includes(type)) {
        dismissedAdvisories.push(type);
      }
      
      const response = await fetch(`/api/domains/${domain.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dismissedAdvisories })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to dismiss advisory');
      }
      
      await onRefresh(domain.id);
    } catch (error) {
      console.error('Failed to dismiss advisory:', error);
      setError(error instanceof Error ? error.message : 'Failed to dismiss advisory');
    }
  };

  const handleUndoDismissAdvisory = async (type: string) => {
    try {
      setError(null);
      const currentAdvisories = Array.isArray(domain.dismissedAdvisories)
        ? domain.dismissedAdvisories
        : typeof domain.dismissedAdvisories === 'string'
          ? domain.dismissedAdvisories.split(',').filter(Boolean)
          : [];
      
      const dismissedAdvisories = currentAdvisories.filter((t: string) => t !== type);
      
      const response = await fetch(`/api/domains/${domain.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dismissedAdvisories })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to undo advisory dismissal');
      }
      
      await onRefresh(domain.id);
    } catch (error) {
      console.error('Failed to undo advisory dismissal:', error);
      setError(error instanceof Error ? error.message : 'Failed to undo advisory dismissal');
    }
  };

  const isDismissed = (type: string) => {
    if (!domain.dismissedAdvisories) return false;
    
    const advisories = Array.isArray(domain.dismissedAdvisories) 
      ? domain.dismissedAdvisories 
      : typeof domain.dismissedAdvisories === 'string'
        ? domain.dismissedAdvisories.split(',').filter(Boolean)
        : [];
        
    return advisories.includes(type);
  };

  const formatRecord = (record: string | null, status?: DNSStatus, type?: string) => {
    if (!record) {
      return <span className="text-gray-500">Not configured</span>;
    }

    const [value, details] = record.split(' (');
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <span className="font-mono break-all flex-1">{value}</span>
          <CopyButton value={value} className="shrink-0 mt-1" />
        </div>
        {details && (
          <div className="flex items-center gap-2">
            <span className={`text-sm px-2 py-0.5 rounded-full ${getStatusColor(status, isDismissed(type || ''))}`}>
              {details.replace(')', '')}
            </span>
            {status === 'advisory' && (
              <>
                {!isDismissed(type || '') ? (
                  <button
                    onClick={() => type && handleDismissAdvisory(type)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Dismiss
                  </button>
                ) : (
                  <button
                    onClick={() => type && handleUndoDismissAdvisory(type)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Undo
                  </button>
                )}
              </>
            )}
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600 mt-1">
            {error}
          </div>
        )}
      </div>
    );
  };

  const StatusIndicators = () => (
    <div className="flex items-center gap-1">
      {getStatusIcon(domain.dkimStatus, isRefreshing, isDismissed('dkim'))}
      {getStatusIcon(domain.spfStatus, isRefreshing, isDismissed('spf'))}
      {getStatusIcon(domain.dmarcStatus, isRefreshing, isDismissed('dmarc'))}
    </div>
  );

  if (!mounted) {
    return (
      <div className="bg-white divide-y divide-gray-200">
        <div className="group">
          <div className="flex items-center justify-between p-4">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <h3 className="font-medium text-gray-900">{domain.name}</h3>
                <StatusIndicators />
                {error && (
                  <ExclamationCircleIcon className="w-5 h-5 text-red-500" title={error} />
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Last checked: {new Date(domain.lastChecked).toLocaleString()}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors duration-200"
                title="Delete domain"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-blue-50 transition-colors duration-200"
                title="Refresh DNS records"
              >
                <ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden mb-4">
      <div 
        className="flex items-center justify-between p-6 cursor-pointer" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-lg text-midnight-navy">{domain.name}</h3>
            {domain.esp && (
              <span className="px-2 py-0.5 rounded-full text-sm bg-ice-white text-deep-teal">
                {domain.esp.name}
              </span>
            )}
            <StatusIndicators />
            {error && (
              <ExclamationCircleIcon className="w-5 h-5 text-red-500" title={error} />
            )}
          </div>
          <p className="mt-2 text-sm text-deep-teal flex items-center gap-2">
            <span>Last checked:</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${stalenessClasses(getStaleness(domain.lastChecked))}`}
              title={new Date(domain.lastChecked).toLocaleString()}
            >
              {formatRelativeTime(domain.lastChecked)}
            </span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(domain.id);
            }}
            className="p-2.5 rounded-full text-deep-teal hover:text-primary hover:bg-ice-white transition-all duration-200"
            title="Edit domain"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="p-2.5 rounded-full text-deep-teal hover:text-red-600 hover:bg-red-50 transition-all duration-200"
            title="Delete domain"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRefresh();
            }}
            disabled={isRefreshing}
            className="p-2.5 rounded-full text-deep-teal hover:text-primary hover:bg-ice-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh DNS records"
          >
            <ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <div onClick={(e) => e.stopPropagation()}>
            <DomainToolsMenu domain={domain.name} />
          </div>
          <div className="p-2.5 rounded-full text-deep-teal">
            {isOpen ? (
              <ChevronUpIcon className="w-5 h-5" />
            ) : (
              <ChevronDownIcon className="w-5 h-5" />
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-ice-white space-y-6 border-t border-soft-grey">
              <div className="flex items-center justify-end -mb-2">
                <CopyButton value={buildAllRecordsBlock(domain)} label="Copy all records" />
              </div>
              <div>
                <h4 className="font-semibold text-midnight-navy mb-3">DKIM Record ({domain.dkimSelector}._domainkey)</h4>
                {formatRecord(domain.dkim, domain.dkimStatus, 'dkim')}
              </div>
              <div>
                <h4 className="font-semibold text-midnight-navy mb-3">SPF Record</h4>
                {formatRecord(domain.spf, domain.spfStatus, 'spf')}
              </div>
              <div>
                <h4 className="font-semibold text-midnight-navy mb-3">DMARC Record</h4>
                {formatRecord(domain.dmarc, domain.dmarcStatus, 'dmarc')}
                {renderDmarcReportAddresses(domain.dmarc)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
