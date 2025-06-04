'use client';
import { useEffect, useState } from 'react';

export type DomainCheckEntry = {
  id: string;
  dkim: string | null;
  spf: string | null;
  dmarc: string | null;
  dkimStatus?: string | null;
  spfStatus?: string | null;
  dmarcStatus?: string | null;
  checkedAt: string;
};

type Props = { domainId: string };

export default function DomainHistory({ domainId }: Props) {
  const [history, setHistory] = useState<DomainCheckEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/domains/${domainId}/history`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch history');
        setHistory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch history');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [domainId]);

  if (loading) return <p className="text-sm text-deep-teal">Loading history...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="mt-6">
      <h4 className="font-semibold text-midnight-navy mb-3">Check History</h4>
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr>
            <th className="py-2 px-3">Checked</th>
            <th className="py-2 px-3">DKIM</th>
            <th className="py-2 px-3">SPF</th>
            <th className="py-2 px-3">DMARC</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h) => (
            <tr key={h.id} className="border-t">
              <td className="py-2 px-3 whitespace-nowrap">
                {new Date(h.checkedAt).toLocaleString()}
              </td>
              <td className="py-2 px-3">{h.dkimStatus}</td>
              <td className="py-2 px-3">{h.spfStatus}</td>
              <td className="py-2 px-3">{h.dmarcStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
