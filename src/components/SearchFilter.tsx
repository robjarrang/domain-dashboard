import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

type SearchFilterProps = {
  onSearch: (query: string) => void;
  onFilterStatus: (status: string) => void;
  onSort: (sortBy: string) => void;
};

export default function SearchFilter({ onSearch, onFilterStatus, onSort }: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <div className="flex gap-4 mb-4">
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search domains..."
          className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
        />
      </div>
      <select
        onChange={(e) => onFilterStatus(e.target.value)}
        className="w-40 rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
      >
        <option value="">All Status</option>
        <option value="success">Success</option>
        <option value="error">Error</option>
        <option value="advisory">Advisory</option>
        <option value="not-configured">Not Configured</option>
      </select>
      <select
        onChange={(e) => onSort(e.target.value)}
        className="w-40 rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
      >
        <option value="name-asc">Name (A-Z)</option>
        <option value="name-desc">Name (Z-A)</option>
        <option value="status-asc">Status (Best-Worst)</option>
        <option value="status-desc">Status (Worst-Best)</option>
      </select>
    </div>
  );
}