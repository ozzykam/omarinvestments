'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { use } from 'react';

interface PropertyItem {
  id: string;
  name?: string;
  type: string;
  status: string;
  address: {
    street1: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

interface PropertiesPageProps {
  params: Promise<{ llcId: string }>;
}

export default function PropertiesPage({ params }: PropertiesPageProps) {
  const { llcId } = use(params);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProperties = useCallback(async () => {
    try {
      const res = await fetch(`/api/llcs/${llcId}/properties`);
      const data = await res.json();

      if (data.ok) {
        setProperties(data.data);
      } else {
        setError(data.error?.message || 'Failed to load properties');
      }
    } catch {
      setError('Failed to load properties');
    } finally {
      setLoading(false);
    }
  }, [llcId]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleArchive = async (propertyId: string, name: string) => {
    if (!confirm(`Are you sure you want to archive "${name || 'this property'}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/llcs/${llcId}/properties/${propertyId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.ok) {
        setProperties((prev) => prev.filter((p) => p.id !== propertyId));
      } else {
        alert(data.error?.message || 'Failed to archive property');
      }
    } catch {
      alert('Failed to archive property');
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading properties...</div>;
  }

  if (error) {
    return <div className="text-destructive">{error}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Properties</h1>
        <Link
          href={`/llcs/${llcId}/properties/new`}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm"
        >
          + Add Property
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No properties yet. Add your first property to get started.
          </p>
          <Link
            href={`/llcs/${llcId}/properties/new`}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-sm"
          >
            Add Property
          </Link>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name / Address</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {properties.map((property) => (
                <tr key={property.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/llcs/${llcId}/properties/${property.id}`}
                      className="hover:underline"
                    >
                      <div className="font-medium">
                        {property.name || property.address.street1}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {property.address.city}, {property.address.state} {property.address.zipCode}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize">{property.type}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs ${
                        property.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {property.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/llcs/${llcId}/properties/${property.id}`}
                      className="text-xs text-muted-foreground hover:text-foreground mr-3"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleArchive(property.id, property.name || property.address.street1)}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Archive
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
