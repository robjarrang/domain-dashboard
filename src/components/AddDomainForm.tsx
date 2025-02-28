'use client';
import { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { DomainRecord } from './DomainCard';

type ESP = {
  id: string;
  name: string;
};

type AddDomainFormProps = {
  onAdd: (domain: Omit<DomainRecord, 'id' | 'lastChecked'>) => Promise<void>;
  onClose: () => void;
};

export default function AddDomainForm({ onAdd, onClose }: AddDomainFormProps) {
  const [name, setName] = useState('');
  const [dkimSelector, setDkimSelector] = useState('default');
  const [espId, setEspId] = useState('');
  const [esps, setEsps] = useState<ESP[]>([]);
  const [newEspName, setNewEspName] = useState('');
  const [showAddEsp, setShowAddEsp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEsps();
  }, []);

  const fetchEsps = async () => {
    try {
      const response = await fetch('/api/esps');
      if (!response.ok) throw new Error('Failed to fetch ESPs');
      const data = await response.json();
      setEsps(data);
    } catch (error) {
      console.error('Error fetching ESPs:', error);
      setError('Failed to load ESP list');
    }
  };

  const handleAddEsp = async () => {
    if (!newEspName.trim()) {
      setError('ESP name is required');
      return;
    }

    try {
      const response = await fetch('/api/esps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newEspName.trim() })
      });

      if (!response.ok) throw new Error('Failed to create ESP');
      
      const newEsp = await response.json();
      setEsps([...esps, newEsp]);
      setEspId(newEsp.id);
      setNewEspName('');
      setShowAddEsp(false);
      setError(null);
    } catch (error) {
      console.error('Error creating ESP:', error);
      setError('Failed to create new ESP');
    }
  };

  const validateDomain = (domain: string) => {
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    return domainRegex.test(domain);
  };

  const validateSelector = (selector: string) => {
    const selectorRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/i;
    return selectorRegex.test(selector);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!validateDomain(name)) {
      setError('Please enter a valid domain name');
      setIsLoading(false);
      return;
    }

    if (!validateSelector(dkimSelector)) {
      setError('DKIM selector must contain only letters, numbers, and hyphens');
      setIsLoading(false);
      return;
    }

    try {
      await onAdd({
        name,
        dkimSelector,
        dkim: null,
        spf: null,
        dmarc: null,
        dismissedAdvisories: null,
        espId: espId || null,
      });
      onClose();
    } catch (error) {
      console.error('Failed to add domain:', error);
      setError(error instanceof Error ? error.message : 'Failed to add domain');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-midnight-navy/30 backdrop-blur-sm z-50">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="card w-full max-w-md">
          <div className="flex items-center justify-between p-6 border-b border-soft-grey">
            <h2 className="text-xl font-semibold text-midnight-navy">Add Domain</h2>
            <button
              onClick={onClose}
              className="p-2.5 rounded-full text-deep-teal hover:text-primary hover:bg-ice-white transition-all duration-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600">
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="domain" className="block text-sm font-medium text-deep-teal">
                Domain Name
              </label>
              <input
                type="text"
                id="domain"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase())}
                placeholder="example.com"
                className="mt-1 block w-full rounded-xl border-soft-grey shadow-sm focus:border-primary focus:ring-primary transition-all duration-200 placeholder:text-deep-teal/50"
                required
              />
              <p className="text-sm text-deep-teal">
                Enter the domain name without protocols or paths
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="selector" className="block text-sm font-medium text-deep-teal">
                DKIM Selector
              </label>
              <input
                type="text"
                id="selector"
                value={dkimSelector}
                onChange={(e) => setDkimSelector(e.target.value.toLowerCase())}
                placeholder="default"
                className="mt-1 block w-full rounded-xl border-soft-grey shadow-sm focus:border-primary focus:ring-primary transition-all duration-200 placeholder:text-deep-teal/50"
                required
              />
              <p className="text-sm text-deep-teal">
                The selector used in your DKIM record (e.g., default, google, etc.)
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="esp" className="block text-sm font-medium text-deep-teal">
                Email Service Provider (ESP)
              </label>
              {!showAddEsp ? (
                <div className="flex gap-2">
                  <select
                    id="esp"
                    value={espId}
                    onChange={(e) => setEspId(e.target.value)}
                    className="mt-1 block w-full rounded-xl border-soft-grey shadow-sm focus:border-primary focus:ring-primary transition-all duration-200"
                  >
                    <option value="">Select ESP</option>
                    {esps.map((esp) => (
                      <option key={esp.id} value={esp.id}>
                        {esp.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddEsp(true)}
                    className="mt-1 p-2 rounded-xl bg-ice-white text-deep-teal hover:text-primary transition-colors duration-200"
                    title="Add new ESP"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newEspName}
                    onChange={(e) => setNewEspName(e.target.value)}
                    placeholder="Enter ESP name"
                    className="mt-1 block w-full rounded-xl border-soft-grey shadow-sm focus:border-primary focus:ring-primary transition-all duration-200 placeholder:text-deep-teal/50"
                  />
                  <button
                    type="button"
                    onClick={handleAddEsp}
                    className="mt-1 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors duration-200"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddEsp(false);
                      setNewEspName('');
                    }}
                    className="mt-1 p-2 rounded-xl bg-ice-white text-deep-teal hover:text-primary transition-colors duration-200"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
              <p className="text-sm text-deep-teal">
                Select or add the ESP associated with this domain
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? 'Adding...' : 'Add Domain'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}