'use client';

import { useEffect, useRef, useState } from 'react';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

type Props = {
  domain: string;
};

type Tool = {
  label: string;
  description: string;
  href: (domain: string) => string;
};

// Prefilled third-party DNS / email-auth diagnostic tools.
const TOOLS: Tool[] = [
  {
    label: 'MXToolbox SuperTool',
    description: 'DKIM, SPF, DMARC, MX, blacklists',
    href: d => `https://mxtoolbox.com/SuperTool.aspx?action=mx%3a${encodeURIComponent(d)}&run=toolpage`,
  },
  {
    label: 'MXToolbox DMARC',
    description: 'DMARC record lookup + analyzer',
    href: d => `https://mxtoolbox.com/SuperTool.aspx?action=dmarc%3a${encodeURIComponent(d)}&run=toolpage`,
  },
  {
    label: 'dmarcian Inspector',
    description: 'DMARC + alignment inspector',
    href: d => `https://dmarcian.com/dmarc-inspector/?domain=${encodeURIComponent(d)}`,
  },
  {
    label: 'Google Admin Toolbox — Check MX',
    description: 'Google Workspace DNS diagnostics',
    href: d => `https://toolbox.googleapps.com/apps/checkmx/check?domain=${encodeURIComponent(d)}&dkim_selector=`,
  },
  {
    label: 'Google Admin Toolbox — Dig',
    description: 'Raw TXT / MX record dig',
    href: d => `https://toolbox.googleapps.com/apps/dig/#TXT/${encodeURIComponent(d)}`,
  },
];

export default function DomainToolsMenu({ domain }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(o => !o);
        }}
        className="btn-ghost"
        title="Open in external DNS tools"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <WrenchScrewdriverIcon className="w-5 h-5" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-20 w-72 rounded-xl bg-white shadow-lg ring-1 ring-soft-grey overflow-hidden"
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-deep-teal/70 border-b border-soft-grey">
            External tools for {domain}
          </div>
          {TOOLS.map(tool => (
            <a
              key={tool.label}
              href={tool.href(domain)}
              target="_blank"
              rel="noreferrer noopener"
              className="block px-4 py-2 hover:bg-ice-white transition-colors"
              role="menuitem"
            >
              <div className="text-sm font-medium text-midnight-navy">{tool.label}</div>
              <div className="text-xs text-deep-teal/70">{tool.description}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
