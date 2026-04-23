'use client';

import { useState } from 'react';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';

type Props = {
  value: string;
  label?: string;
  className?: string;
};

export default function CopyButton({ value, label = 'Copy', className = '' }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Silent fail; clipboard APIs can be blocked in some contexts.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!value}
      className={`inline-flex items-center gap-1 text-xs text-deep-teal hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${className}`}
      title={copied ? 'Copied!' : label}
    >
      {copied ? (
        <>
          <CheckIcon className="w-4 h-4" />
          Copied
        </>
      ) : (
        <>
          <ClipboardIcon className="w-4 h-4" />
          {label}
        </>
      )}
    </button>
  );
}
