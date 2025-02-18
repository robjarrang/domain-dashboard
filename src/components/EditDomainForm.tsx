import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

type EditDomainFormProps = {
  domain: {
    id: string;
    name: string;
    dkimSelector: string;
  };
  onEdit: (domain: { id: string; name: string; dkimSelector: string }) => Promise<void>;
  onClose: () => void;
};

export default function EditDomainForm({ domain, onEdit, onClose }: EditDomainFormProps) {
  const [name, setName] = useState(domain.name);
  const [dkimSelector, setDkimSelector] = useState(domain.dkimSelector);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
    setError('');

    if (!validateDomain(name)) {
      setError('Please enter a valid domain name');
      return;
    }

    if (!validateSelector(dkimSelector)) {
      setError('DKIM selector must contain only letters, numbers, and hyphens');
      return;
    }

    setIsLoading(true);
    
    try {
      await onEdit({ id: domain.id, name, dkimSelector });
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update domain');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Edit Domain</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors duration-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <div className="space-y-1">
            <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
              Domain Name
            </label>
            <input
              type="text"
              id="domain"
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase())}
              placeholder="example.com"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary transition-colors duration-200"
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="selector" className="block text-sm font-medium text-gray-700">
              DKIM Selector
            </label>
            <input
              type="text"
              id="selector"
              value={dkimSelector}
              onChange={(e) => setDkimSelector(e.target.value.toLowerCase())}
              placeholder="default"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary transition-colors duration-200"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-md shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}