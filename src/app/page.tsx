'use client';
import { useState, useEffect } from 'react';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import DomainCard from '@/components/DomainCard';
import AddDomainForm from '@/components/AddDomainForm';
import EditDomainForm from '@/components/EditDomainForm';
import type { DomainRecord } from '@/components/DomainCard';

export default function Home() {
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [editingDomain, setEditingDomain] = useState<DomainRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const [error, setError] = useState('');

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
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Your Domains
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Monitor and manage your domain DNS records
            </p>
          </div>
          <div className="mt-4 flex sm:ml-4 sm:mt-0">
            <button
              onClick={() => handleCheckAllDomains()}
              disabled={isCheckingAll || domains.length === 0}
              className="btn-secondary mr-3 inline-flex items-center"
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
        ) : domains.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No domains</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding your first domain</p>
            <div className="mt-6">
              <button
                onClick={() => setIsAddingDomain(true)}
                className="btn-primary"
              >
                <PlusIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
                Add Domain
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {domains.map((domain) => (
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
