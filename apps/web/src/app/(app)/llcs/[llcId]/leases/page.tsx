'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { use } from 'react';

interface LeaseItem {
  id: string;
  propertyId: string;
  unitId: string;
  tenantIds: string[];
  startDate: string;
  endDate: string;
  rentAmount: number;
  status: string;
}

interface LeasesPageProps {
  params: Promise<{ llcId: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  ended: 'bg-blue-100 text-blue-800',
  eviction: 'bg-red-100 text-red-800',
  terminated: 'bg-orange-100 text-orange-800',
};

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function LeasesPage({ params }: LeasesPageProps) {
  const { llcId } = use(params);
  const [leases, setLeases] = useState<LeaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeases = useCallback(async () => {
    try {
      const res = await fetch(`/api/llcs/${llcId}/leases`);
      const data = await res.json();

      if (data.ok) {
        setLeases(data.data);
      } else {
        setError(data.error?.message || 'Failed to load leases');
      }
    } catch {
      setError('Failed to load leases');
    } finally {
      setLoading(false);
    }
  }, [llcId]);

  useEffect(() => {
    fetchLeases();
  }, [fetchLeases]);

  const handleDelete = async (leaseId: string) => {
    if (!confirm('Are you sure you want to delete this draft lease?')) {
      return;
    }

    try {
      const res = await fetch(`/api/llcs/${llcId}/leases/${leaseId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.ok) {
        setLeases((prev) => prev.filter((l) => l.id !== leaseId));
      } else {
        alert(data.error?.message || 'Failed to delete lease');
      }
    } catch {
      alert('Failed to delete lease');
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading leases...</div>;
  }

  if (error) {
    return <div className="text-destructive">{error}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Leases</h1>
        <Link
          href={`/llcs/${llcId}/leases/new`}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm"
        >
          + New Lease
        </Link>
      </div>

      {leases.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No leases yet. Create your first lease to get started.
          </p>
          <Link
            href={`/llcs/${llcId}/leases/new`}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm"
          >
            New Lease
          </Link>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Period</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Rent</th>
                <th className="text-left px-4 py-3 font-medium">Tenants</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leases.map((lease) => (
                <tr key={lease.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/llcs/${llcId}/leases/${lease.id}`}
                      className="hover:underline"
                    >
                      <div className="font-medium">
                        {formatDate(lease.startDate)} — {formatDate(lease.endDate)}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs ${STATUS_COLORS[lease.status] || 'bg-gray-100 text-gray-800'}`}
                    >
                      {lease.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    ${(lease.rentAmount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {lease.tenantIds.length} tenant{lease.tenantIds.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/llcs/${llcId}/leases/${lease.id}`}
                      className="text-xs text-muted-foreground hover:text-foreground mr-3"
                    >
                      Edit
                    </Link>
                    {lease.status === 'draft' && (
                      <button
                        onClick={() => handleDelete(lease.id)}
                        className="text-xs text-muted-foreground hover:text-destructive"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
