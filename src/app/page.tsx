'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { PlusIcon, ArrowPathIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import DomainCard from '@/components/DomainCard';
import AddDomainForm from '@/components/AddDomainForm';
import EditDomainForm from '@/components/EditDomainForm';
import SearchFilter, { SortOption } from '@/components/SearchFilter';
import StatusSummary from '@/components/StatusSummary';
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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          type="button"
          onClick={() => setIsAddingDomain(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Add Domain
        </button>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={sortedDomains.length === 0}
            className="btn-secondary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title={sortedDomains.length === 0 ? 'No domains to export' : `Export ${sortedDomains.length} domains to CSV`}
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={refreshProgress !== null || domains.length === 0}
            className="btn-secondary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh all domains"
          >
            <ArrowPathIcon className={`w-5 h-5 ${refreshProgress ? 'animate-spin' : ''}`} />
            {refreshProgress
              ? `Refreshing ${refreshProgress.done}/${refreshProgress.total}\u2026`
              : 'Refresh All'}
          </button>
        </div>
      </div>

      {refreshProgress && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-ice-white">
          <div
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${Math.round((refreshProgress.done / refreshProgress.total) * 100)}%` }}
          />
        </div>
      )}

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

      <StatusSummary domains={domains} />

      <div>
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <ArrowPathIcon className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-deep-teal">Loading domains...</p>
          </div>
        ) : sortedDomains.length === 0 ? (
          <div className="section-highlight text-center p-12">
            <h2 className="text-xl font-medium text-white mb-2">No domains found</h2>
            <p className="text-ice-white/80">
              {searchQuery 
                ? 'Try adjusting your search query'
                : 'Add your first domain to get started'}
            </p>
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
