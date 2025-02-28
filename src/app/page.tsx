'use client';
import { useState, useEffect } from 'react';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import DomainCard from '@/components/DomainCard';
import AddDomainForm from '@/components/AddDomainForm';
import EditDomainForm from '@/components/EditDomainForm';
import SearchFilter from '@/components/SearchFilter';
import type { DomainRecord } from '@/components/DomainCard';

export default function Home() {
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [filteredDomains, setFilteredDomains] = useState<DomainRecord[]>([]);
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [editingDomain, setEditingDomain] = useState<DomainRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/domains');
      if (!response.ok) throw new Error('Failed to fetch domains');
      const data = await response.json();
      setDomains(data);
    } catch (_error) {
      setError('Failed to load domains');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  useEffect(() => {
    let filtered = [...domains];
    
    if (searchQuery) {
      filtered = filtered.filter(domain => 
        domain.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(domain => {
        if (statusFilter === 'success') {
          return domain.dkimStatus === 'success' && 
                 domain.spfStatus === 'success' && 
                 domain.dmarcStatus === 'success';
        }
        return domain.dkimStatus === statusFilter || 
               domain.spfStatus === statusFilter || 
               domain.dmarcStatus === statusFilter;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'status-asc':
        case 'status-desc': {
          const getStatusScore = (domain: DomainRecord) => {
            const statuses = [domain.dkimStatus, domain.spfStatus, domain.dmarcStatus];
            const scores = {
              'success': 3,
              'advisory': 2,
              'error': 1,
              'not-configured': 0
            };
            return statuses.reduce((sum, status) => 
              sum + (scores[status || 'not-configured'] || 0), 0);
          };
          const scoreA = getStatusScore(a);
          const scoreB = getStatusScore(b);
          return sortBy === 'status-asc' ? scoreB - scoreA : scoreA - scoreB;
        }
        default:
          return 0;
      }
    });
    
    setFilteredDomains(filtered);
  }, [domains, searchQuery, statusFilter, sortBy]);

  const handleAddDomain = async ({ name, dkimSelector }: { name: string; dkimSelector: string }) => {
    const response = await fetch('/api/domains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, dkimSelector }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add domain');
    }

    await fetchDomains();
  };

  const handleRefreshDomain = async (id: string) => {
    const response = await fetch(`/api/domains/${id}`);
    if (!response.ok) {
      console.error('Failed to refresh domain');
      return;
    }
    const updatedDomain = await response.json();
    setDomains(domains.map(domain => 
      domain.id === id ? updatedDomain : domain
    ));
  };

  const handleDeleteDomain = async (id: string) => {
    const response = await fetch(`/api/domains/${id}`, {
      method: 'DELETE',
    });
    
    if (response.ok) {
      setDomains(domains.filter(domain => domain.id !== id));
    } else {
      setError('Failed to delete domain');
    }
  };

  const handleCheckAllDomains = async () => {
    setIsCheckingAll(true);
    try {
      const updatedDomains = await Promise.all(
        domains.map(async (domain) => {
          const response = await fetch(`/api/domains/${domain.id}`);
          if (response.ok) {
            return await response.json();
          }
          return domain;
        })
      );
      setDomains(updatedDomains);
    } catch (_error) {
      setError('Failed to check all domains');
    } finally {
      setIsCheckingAll(false);
    }
  };

  const handleEditDomain = async ({ id, name, dkimSelector }: { id: string; name: string; dkimSelector: string }) => {
    const response = await fetch(`/api/domains/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, dkimSelector }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update domain');
    }

    await fetchDomains();
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0 mb-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Domains</h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all domains and their email authentication status
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-4">
            <button
              onClick={handleCheckAllDomains}
              disabled={isCheckingAll}
              className="btn-secondary inline-flex items-center"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-1.5 ${isCheckingAll ? 'animate-spin' : ''}`} />
              {isCheckingAll ? 'Checking...' : 'Check All'}
            </button>
            <button
              onClick={() => setIsAddingDomain(true)}
              className="btn-primary inline-flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-1.5" />
              Add Domain
            </button>
          </div>
        </div>
      </div>

      <SearchFilter 
        onSearch={setSearchQuery}
        onFilterStatus={setStatusFilter}
        onSort={setSortBy}
      />

      <div className="overflow-hidden rounded-lg bg-white shadow">
        {error ? (
          <div className="p-4 bg-red-50 sm:px-6">
            <div className="flex">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : filteredDomains.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              {domains.length === 0 ? 'No domains' : 'No matching domains'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {domains.length === 0 
                ? 'Get started by adding your first domain'
                : 'Try adjusting your search or filter'}
            </p>
            {domains.length === 0 && (
              <div className="mt-6">
                <button
                  onClick={() => setIsAddingDomain(true)}
                  className="btn-primary"
                >
                  <PlusIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
                  Add Domain
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredDomains.map((domain) => (
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
