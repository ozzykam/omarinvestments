'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { use } from 'react';

interface UnitItem {
  id: string;
  unitNumber: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  status: string;
  marketRent?: number;
}

interface UnitsPageProps {
  params: Promise<{ llcId: string; propertyId: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  occupied: 'bg-blue-100 text-blue-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  unavailable: 'bg-gray-100 text-gray-800',
};

export default function UnitsPage({ params }: UnitsPageProps) {
  const { llcId, propertyId } = use(params);
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUnits = useCallback(async () => {
    try {
      const res = await fetch(`/api/llcs/${llcId}/properties/${propertyId}/units`);
      const data = await res.json();

      if (data.ok) {
        setUnits(data.data);
      } else {
        setError(data.error?.message || 'Failed to load units');
      }
    } catch {
      setError('Failed to load units');
    } finally {
      setLoading(false);
    }
  }, [llcId, propertyId]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const handleDelete = async (unitId: string, unitNumber: string) => {
    if (!confirm(`Are you sure you want to delete unit "${unitNumber}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/llcs/${llcId}/properties/${propertyId}/units/${unitId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.ok) {
        setUnits((prev) => prev.filter((u) => u.id !== unitId));
      } else {
        alert(data.error?.message || 'Failed to delete unit');
      }
    } catch {
      alert('Failed to delete unit');
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading units...</div>;
  }

  if (error) {
    return <div className="text-destructive">{error}</div>;
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          href={`/llcs/${llcId}/properties/${propertyId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Property
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Units</h1>
        <Link
          href={`/llcs/${llcId}/properties/${propertyId}/units/new`}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm"
        >
          + Add Unit
        </Link>
      </div>

      {units.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No units yet. Add your first unit to this property.
          </p>
          <Link
            href={`/llcs/${llcId}/properties/${propertyId}/units/new`}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm"
          >
            Add Unit
          </Link>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Unit #</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Bed/Bath</th>
                <th className="text-left px-4 py-3 font-medium">Sq Ft</th>
                <th className="text-left px-4 py-3 font-medium">Market Rent</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {units.map((unit) => (
                <tr key={unit.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/llcs/${llcId}/properties/${propertyId}/units/${unit.id}`}
                      className="font-medium hover:underline"
                    >
                      {unit.unitNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs ${STATUS_COLORS[unit.status] || 'bg-gray-100 text-gray-800'}`}
                    >
                      {unit.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {unit.bedrooms != null || unit.bathrooms != null
                      ? `${unit.bedrooms ?? '—'} / ${unit.bathrooms ?? '—'}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {unit.sqft ? unit.sqft.toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {unit.marketRent
                      ? `$${(unit.marketRent / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/llcs/${llcId}/properties/${propertyId}/units/${unit.id}`}
                      className="text-xs text-muted-foreground hover:text-foreground mr-3"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(unit.id, unit.unitNumber)}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Delete
                    </button>
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
