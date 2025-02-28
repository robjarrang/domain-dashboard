'use client';
import { useState, useEffect } from 'react';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import DomainCard from '@/components/DomainCard';
import AddDomainForm from '@/components/AddDomainForm';
import EditDomainForm from '@/components/EditDomainForm';
import SearchFilter, { SortOption } from '@/components/SearchFilter';
import type { DomainRecord } from '@/components/DomainCard';

type ESP = {
  id: string;
  name: string;
};

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
    setIsLoading(true);
    setError(null);
    try {
      // Refresh each domain sequentially to avoid overwhelming the DNS servers
      for (const domain of domains) {
        await handleRefreshDomain(domain.id);
      }
      await fetchDomains();
    } catch (error) {
      console.error('Failed to refresh all domains:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh all domains');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter domains based on search query and ESP
  const filteredDomains = domains.filter(domain => 
    domain.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!selectedEspId || domain.espId === selectedEspId)
  );

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setIsAddingDomain(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Add Domain
        </button>
        <button
          type="button"
          onClick={handleRefreshAll}
          disabled={isLoading}
          className="btn-secondary inline-flex items-center gap-2"
          title="Refresh all domains"
        >
          <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh All
        </button>
      </div>

      <SearchFilter 
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
