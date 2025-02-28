'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { ArrowsUpDownIcon } from '@heroicons/react/24/outline';

export type SortOption = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc';

type SearchFilterProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  selectedEspId: string;
  onEspChange: (espId: string) => void;
  esps: Array<{ id: string; name: string; }>;
};

export default function SearchFilter({ 
  searchQuery, 
  onSearchChange, 
  sortOption, 
  onSortChange,
  selectedEspId,
  onEspChange,
  esps
}: SearchFilterProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-grow">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-deep-teal" aria-hidden="true" />
        </div>
        <input
          type="text"
          name="search"
          id="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="block w-full rounded-xl border-soft-grey pl-10 py-3 shadow-sm focus:border-primary focus:ring-primary transition-all duration-200 placeholder:text-deep-teal/50"
          placeholder="Search domains..."
        />
      </div>

      <div className="relative min-w-[200px]">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <ArrowsUpDownIcon className="h-5 w-5 text-deep-teal" aria-hidden="true" />
        </div>
        <select
          value={sortOption}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="block w-full rounded-xl border-soft-grey pl-10 py-3 shadow-sm focus:border-primary focus:ring-primary transition-all duration-200 appearance-none bg-white pr-8 text-deep-teal"
        >
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="date-asc">Last Checked (Oldest)</option>
          <option value="date-desc">Last Checked (Newest)</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg className="h-5 w-5 text-deep-teal" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      <div className="relative min-w-[200px]">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg className="h-5 w-5 text-deep-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <select
          value={selectedEspId}
          onChange={(e) => onEspChange(e.target.value)}
          className="block w-full rounded-xl border-soft-grey pl-10 py-3 shadow-sm focus:border-primary focus:ring-primary transition-all duration-200 appearance-none bg-white pr-8 text-deep-teal"
        >
          <option value="">All ESPs</option>
          {esps.map((esp) => (
            <option key={esp.id} value={esp.id}>{esp.name}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg className="h-5 w-5 text-deep-teal" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
}