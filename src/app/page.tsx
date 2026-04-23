'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { PlusIcon, ArrowPathIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import DomainCard from '@/components/DomainCard';
import AddDomainForm from '@/components/AddDomainForm';
import EditDomainForm from '@/components/EditDomainForm';
import SearchFilter, { SortOption } from '@/components/SearchFilter';
import StatusSummary, { HealthFilter, domainHealth, isStale } from '@/components/StatusSummary';
import type { DomainRecord } from '@/components/DomainCard';

type ESP = {
  id: string;
  name: string;
};

const PREFS_STORAGE_KEY = 'domain-dashboard:prefs:v1';

type StoredPrefs = {
  searchQuery?: string;
  sortOption?: SortOption;
  selectedEspId?: string;
};

const REFRESH_CONCURRENCY = 4;

export default function Home() {
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [editingDomain, setEditingDomain] = useState<DomainRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');
  const [esps, setEsps] = useState<ESP[]>([]);
  const [selectedEspId, setSelectedEspId] = useState('');
  const [refreshProgress, setRefreshProgress] = useState<{ done: number; total: number } | null>(null);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/domains');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch domains');
      }
      
      setDomains(data);
    } catch (error) {
      console.error('Failed to fetch domains:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch domains');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEsps = async () => {
    try {
      const response = await fetch('/api/esps');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch ESPs');
      }
      
      setEsps(data);
    } catch (error) {
      console.error('Failed to fetch ESPs:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch ESPs');
    }
  };

  useEffect(() => {
    fetchDomains();
    fetchEsps();
  }, []);

  // Load persisted prefs once on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
      if (raw) {
        const prefs = JSON.parse(raw) as StoredPrefs;
        if (typeof prefs.searchQuery === 'string') setSearchQuery(prefs.searchQuery);
        if (prefs.sortOption) setSortOption(prefs.sortOption);
        if (typeof prefs.selectedEspId === 'string') setSelectedEspId(prefs.selectedEspId);
      }
    } catch {
      // Ignore corrupt prefs.
    }
    setPrefsLoaded(true);
  }, []);

  // Persist whenever they change (after initial load).
  useEffect(() => {
    if (!prefsLoaded) return;
    try {
      const prefs: StoredPrefs = { searchQuery, sortOption, selectedEspId };
      window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore storage errors (quota, disabled storage, etc.).
    }
  }, [prefsLoaded, searchQuery, sortOption, selectedEspId]);

  const handleAddDomain = async (domain: Omit<DomainRecord, 'id' | 'lastChecked'>) => {
    const response = await fetch('/api/domains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(domain),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to add domain');
    }
    
    await fetchDomains();
  };

  const handleEditDomain = async (id: string, updates: Partial<DomainRecord>) => {
    const response = await fetch(`/api/domains/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update domain');
    }
    
    await fetchDomains();
  };

  const handleDeleteDomain = async (id: string) => {
    try {
      const response = await fetch(`/api/domains/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete domain');
      }
      
      await fetchDomains();
    } catch (error) {
      console.error('Failed to delete domain:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete domain');
    }
  };

  const handleRefreshDomain = async (id: string) => {
    try {
      const response = await fetch(`/api/domains/${id}`, {
        method: 'GET',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to refresh domain');
      }
      
      await fetchDomains();
    } catch (error) {
      console.error('Failed to refresh domain:', error);
      throw error;
    }
  };

  const handleRefreshAll = async () => {
    if (domains.length === 0) return;
    setError(null);
    setRefreshProgress({ done: 0, total: domains.length });

    const queue = [...domains];
    const failures: string[] = [];

    const worker = async () => {
      while (queue.length > 0) {
        const next = queue.shift();
        if (!next) return;
        try {
          const response = await fetch(`/api/domains/${next.id}`, { method: 'GET' });
          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || `Failed to refresh ${next.name}`);
          }
        } catch (err) {
          console.error('Refresh failed for', next.name, err);
          failures.push(next.name);
        } finally {
          setRefreshProgress(prev => prev ? { ...prev, done: prev.done + 1 } : prev);
        }
      }
    };

    try {
      const workers = Array.from(
        { length: Math.min(REFRESH_CONCURRENCY, domains.length) },
        () => worker(),
      );
      await Promise.all(workers);
      await fetchDomains();
      if (failures.length > 0) {
        setError(`Refresh finished with ${failures.length} failure${failures.length === 1 ? '' : 's'}: ${failures.join(', ')}`);
      }
    } finally {
      setRefreshProgress(null);
    }
  };

  const handleExportCsv = () => {
    if (sortedDomains.length === 0) return;
    const header = [
      'domain',
      'esp',
      'dkim_selector',
      'dkim_status',
      'dkim_value',
      'spf_status',
      'spf_value',
      'dmarc_status',
      'dmarc_value',
      'last_checked',
    ];
    const escape = (raw: unknown): string => {
      const s = raw == null ? '' : String(raw);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = sortedDomains.map(d => [
      d.name,
      d.esp?.name ?? '',
      d.dkimSelector,
      d.dkimStatus ?? '',
      d.dkim ?? '',
      d.spfStatus ?? '',
      d.spf ?? '',
      d.dmarcStatus ?? '',
      d.dmarc ?? '',
      d.lastChecked,
    ].map(escape).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
    a.download = `domain-dashboard-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Filter domains: matches domain name, ESP name, or record contents (case-insensitive).
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredDomains = domains.filter(domain => {
    if (selectedEspId && domain.espId !== selectedEspId) return false;
    if (healthFilter !== 'all') {
      if (healthFilter === 'stale') {
        if (!isStale(domain)) return false;
      } else if (domainHealth(domain) !== healthFilter) {
        return false;
      }
    }
    if (!normalizedQuery) return true;
    const haystack = [
      domain.name,
      domain.esp?.name,
      domain.dkim,
      domain.spf,
      domain.dmarc,
      domain.dkimSelector,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  // Sort domains based on selected sort option
  const sortedDomains = [...filteredDomains].sort((a, b) => {
    switch (sortOption) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'date-asc':
        return new Date(a.lastChecked).getTime() - new Date(b.lastChecked).getTime();
      case 'date-desc':
        return new Date(b.lastChecked).getTime() - new Date(a.lastChecked).getTime();
      default:
        return 0;
    }
  });

  // Keyboard shortcuts: `/` focuses search, `Esc` clears+blurs it, `r` triggers refresh all.
  const isModalOpen = isAddingDomain || editingDomain !== null;
  const handleRefreshAllLatest = useCallback(() => {
    handleRefreshAll();
  }, [handleRefreshAll]);

  useEffect(() => {
    if (isModalOpen) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isEditable =
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT' ||
        target?.isContentEditable;

      if (e.key === '/' && !isEditable && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }
      if (e.key === 'Escape' && target === searchInputRef.current) {
        setSearchQuery('');
        searchInputRef.current?.blur();
        return;
      }
      if ((e.key === 'r' || e.key === 'R') && !isEditable && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (!refreshProgress && domains.length > 0) {
          handleRefreshAllLatest();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isModalOpen, refreshProgress, domains.length, handleRefreshAllLatest]);

  return (
    <div className="space-y-6">
      <section className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="!text-3xl md:!text-4xl !mb-1">Email authentication at a glance</h1>
          <p className="text-sm text-deep-teal/80 m-0">
            Monitoring{' '}
            <span className="font-semibold text-midnight-navy">
              {domains.length} {domains.length === 1 ? 'domain' : 'domains'}
            </span>
            {' '}·{' '}
            Press <kbd className="kbd">/</kbd> to search,{' '}
            <kbd className="kbd">R</kbd> to refresh all
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={sortedDomains.length === 0}
            className="btn-secondary"
            title={sortedDomains.length === 0 ? 'No domains to export' : `Export ${sortedDomains.length} domains to CSV`}
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={refreshProgress !== null || domains.length === 0}
            className="btn-secondary"
            title="Refresh all domains"
          >
            <ArrowPathIcon className={`w-5 h-5 ${refreshProgress ? 'animate-spin' : ''}`} />
            {refreshProgress
              ? `Refreshing ${refreshProgress.done}/${refreshProgress.total}\u2026`
              : 'Refresh all'}
          </button>
          <button
            type="button"
            onClick={() => setIsAddingDomain(true)}
            className="btn-primary"
          >
            <PlusIcon className="w-5 h-5" />
            Add domain
          </button>
        </div>
      </section>

      {refreshProgress && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-ice-white ring-1 ring-soft-grey">
          <div
            className="h-full bg-gradient-to-r from-primary to-deep-teal transition-all duration-200"
            style={{ width: `${Math.round((refreshProgress.done / refreshProgress.total) * 100)}%` }}
          />
        </div>
      )}

      <StatusSummary
        domains={domains}
        activeFilter={healthFilter}
        onFilterChange={setHealthFilter}
      />

      <SearchFilter 
        ref={searchInputRef}
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery}
        sortOption={sortOption}
        onSortChange={setSortOption}
        selectedEspId={selectedEspId}
        onEspChange={setSelectedEspId}
        esps={esps}
      />

      <div>
        {error && (
          <div className="p-4 rounded-xl bg-red-50 ring-1 ring-red-200 mb-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700 m-0">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="card p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="skeleton h-5 w-48" />
                    <div className="flex gap-2">
                      <div className="skeleton h-6 w-20 rounded-full" />
                      <div className="skeleton h-6 w-20 rounded-full" />
                      <div className="skeleton h-6 w-20 rounded-full" />
                    </div>
                  </div>
                  <div className="skeleton h-8 w-8 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedDomains.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-ice-white ring-1 ring-primary/20 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V8.25m-18 0v-1.5A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v1.5m-18 0h18M8.25 12h7.5" />
              </svg>
            </div>
            <h2 className="!text-xl !mb-1">
              {domains.length === 0 ? 'No domains yet' : 'No matches'}
            </h2>
            <p className="text-sm text-deep-teal/80 mb-5 m-0">
              {domains.length === 0
                ? 'Add your first domain to start monitoring DKIM, SPF and DMARC.'
                : searchQuery || healthFilter !== 'all' || selectedEspId
                  ? 'Try adjusting your search or clearing filters.'
                  : 'No domains to display.'}
            </p>
            {domains.length === 0 ? (
              <button
                type="button"
                onClick={() => setIsAddingDomain(true)}
                className="btn-primary"
              >
                <PlusIcon className="w-5 h-5" />
                Add your first domain
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setHealthFilter('all');
                  setSelectedEspId('');
                }}
                className="btn-secondary"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDomains.map((domain) => (
              <DomainCard
                key={domain.id}
                domain={domain}
                onRefresh={handleRefreshDomain}
                onDelete={handleDeleteDomain}
                onEdit={(id) => setEditingDomain(domains.find(d => d.id === id) || null)}
              />
            ))}
          </div>
        )}
      </div>

      {isAddingDomain && (
        <AddDomainForm
          onAdd={handleAddDomain}
          onClose={() => setIsAddingDomain(false)}
        />
      )}

      {editingDomain && (
        <EditDomainForm
          domain={editingDomain}
          onEdit={handleEditDomain}
          onClose={() => setEditingDomain(null)}
        />
      )}
    </div>
  );
}
