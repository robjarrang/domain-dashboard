'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
};

type DomainCardProps = {
  domain: DomainRecord;
  onRefresh: (id: string) => Promise<void>;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
};

const getStatusIcon = (status?: DNSStatus, isLoading?: boolean, isDismissed?: boolean) => {
  if (isLoading) {
    return <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin" />;
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
      return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
    case 'not-configured':
    default:
      return <XCircleIcon className="w-5 h-5 text-red-500" />;
  }
};

const getStatusColor = (status?: DNSStatus, isDismissed?: boolean) => {
  if (isDismissed) {
    return 'text-green-700 bg-green-50';
  }
  
  switch (status) {
    case 'success':
      return 'text-green-700 bg-green-50';
    case 'error':
      return 'text-yellow-700 bg-yellow-50';
    case 'advisory':
      return 'text-blue-700 bg-blue-50';
    case 'not-configured':
    default:
      return 'text-red-700 bg-red-50';
  }
};

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
        <span className="font-mono block">{value}</span>
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
    <div className="bg-white">
      <div className="group border-b border-gray-200 last:border-b-0">
        <div 
          className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer" 
          onClick={() => setIsOpen(!isOpen)}
        >
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
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(domain.id);
              }}
              className="p-2 rounded-md text-gray-400 hover:text-primary hover:bg-blue-50 transition-colors duration-200"
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
              className="p-2 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
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
              className="p-2 rounded-md text-gray-400 hover:text-primary hover:bg-blue-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh DNS records"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="p-2 rounded-md text-gray-400">
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
              <div className="p-6 bg-gray-50 space-y-6 border-t border-gray-200">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">DKIM Record ({domain.dkimSelector}._domainkey)</h4>
                  {formatRecord(domain.dkim, domain.dkimStatus, 'dkim')}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">SPF Record</h4>
                  {formatRecord(domain.spf, domain.spfStatus, 'spf')}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">DMARC Record</h4>
                  {formatRecord(domain.dmarc, domain.dmarcStatus, 'dmarc')}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}