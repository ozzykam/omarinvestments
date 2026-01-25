'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';

interface PropertyOption {
  id: string;
  name?: string;
  address?: { street1: string; city: string };
}

interface UnitOption {
  id: string;
  unitNumber: string;
  status: string;
}

interface TenantOption {
  id: string;
  type: 'residential' | 'commercial';
  firstName?: string;
  lastName?: string;
  businessName?: string;
  email: string;
}

interface NewLeasePageProps {
  params: Promise<{ llcId: string }>;
}

function getTenantLabel(t: TenantOption): string {
  if (t.type === 'commercial') return t.businessName || t.email;
  return `${t.firstName} ${t.lastName}`;
}

export default function NewLeasePage({ params }: NewLeasePageProps) {
  const { llcId } = use(params);
  const router = useRouter();

  // Selectors
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);

  // Form fields
  const [propertyId, setPropertyId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [dueDay, setDueDay] = useState('1');
  const [depositAmount, setDepositAmount] = useState('');
  const [status, setStatus] = useState('draft');
  const [petPolicy, setPetPolicy] = useState('');
  const [petDeposit, setPetDeposit] = useState('');
  const [parkingSpaces, setParkingSpaces] = useState('');
  const [utilitiesIncluded, setUtilitiesIncluded] = useState('');
  const [specialTerms, setSpecialTerms] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Load properties and tenants on mount
  useEffect(() => {
    async function loadData() {
      const [propsRes, tenantsRes] = await Promise.all([
        fetch(`/api/llcs/${llcId}/properties`),
        fetch(`/api/llcs/${llcId}/tenants`),
      ]);
      const propsData = await propsRes.json();
      const tenantsData = await tenantsRes.json();

      if (propsData.ok) setProperties(propsData.data);
      if (tenantsData.ok) setTenants(tenantsData.data);
    }
    loadData();
  }, [llcId]);

  // Load units when property changes
  useEffect(() => {
    if (!propertyId) {
      setUnits([]);
      setUnitId('');
      return;
    }
    async function loadUnits() {
      const res = await fetch(`/api/llcs/${llcId}/properties/${propertyId}/units`);
      const data = await res.json();
      if (data.ok) setUnits(data.data);
    }
    loadUnits();
  }, [llcId, propertyId]);

  const toggleTenant = (tenantId: string) => {
    setSelectedTenantIds((prev) =>
      prev.includes(tenantId)
        ? prev.filter((id) => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    if (selectedTenantIds.length === 0) {
      setError('At least one tenant must be selected');
      setSaving(false);
      return;
    }

    const terms: Record<string, unknown> = {};
    if (petPolicy) terms.petPolicy = petPolicy;
    if (petDeposit) terms.petDeposit = Math.round(parseFloat(petDeposit) * 100);
    if (parkingSpaces) terms.parkingSpaces = parseInt(parkingSpaces);
    if (utilitiesIncluded.trim()) {
      terms.utilitiesIncluded = utilitiesIncluded.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (specialTerms) terms.specialTerms = specialTerms;

    try {
      const res = await fetch(`/api/llcs/${llcId}/leases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          unitId,
          tenantIds: selectedTenantIds,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          rentAmount: Math.round(parseFloat(rentAmount) * 100),
          dueDay: parseInt(dueDay),
          depositAmount: depositAmount ? Math.round(parseFloat(depositAmount) * 100) : 0,
          status,
          terms: Object.keys(terms).length > 0 ? terms : undefined,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        router.push(`/llcs/${llcId}/leases`);
      } else {
        setError(data.error?.message || 'Failed to create lease');
      }
    } catch {
      setError('Failed to create lease');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/llcs/${llcId}/leases`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Leases
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">New Lease</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Property & Unit */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Property & Unit</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="propertyId" className="block text-sm font-medium mb-2">
                Property *
              </label>
              <select
                id="propertyId"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select property...</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.address?.street1 || p.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="unitId" className="block text-sm font-medium mb-2">
                Unit *
              </label>
              <select
                id="unitId"
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                required
                disabled={!propertyId}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                <option value="">{propertyId ? 'Select unit...' : 'Select property first'}</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.unitNumber} ({u.status})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tenants */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Tenant(s) *</h2>
          {tenants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tenants available. Create tenants first.</p>
          ) : (
            <div className="border rounded-md max-h-48 overflow-y-auto divide-y">
              {tenants.map((t) => (
                <label
                  key={t.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-secondary/30 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTenantIds.includes(t.id)}
                    onChange={() => toggleTenant(t.id)}
                    className="w-4 h-4 rounded border-input"
                  />
                  <span className="text-sm">
                    {getTenantLabel(t)}
                    <span className="text-muted-foreground ml-2 text-xs">({t.type})</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Dates & Amounts */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Lease Terms</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium mb-2">
                Start Date *
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium mb-2">
                End Date *
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="rentAmount" className="block text-sm font-medium mb-2">
                Monthly Rent ($) *
              </label>
              <input
                id="rentAmount"
                type="number"
                step="0.01"
                min="0"
                value={rentAmount}
                onChange={(e) => setRentAmount(e.target.value)}
                required
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="dueDay" className="block text-sm font-medium mb-2">
                Due Day (1-28) *
              </label>
              <input
                id="dueDay"
                type="number"
                min="1"
                max="28"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                required
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="depositAmount" className="block text-sm font-medium mb-2">
                Security Deposit ($)
              </label>
              <input
                id="depositAmount"
                type="number"
                step="0.01"
                min="0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-2">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </select>
          </div>
        </div>

        {/* Additional Terms */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Additional Terms</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="petPolicy" className="block text-sm font-medium mb-2">
                Pet Policy
              </label>
              <select
                id="petPolicy"
                value={petPolicy}
                onChange={(e) => setPetPolicy(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">—</option>
                <option value="allowed">Allowed</option>
                <option value="not_allowed">Not Allowed</option>
                <option value="case_by_case">Case by Case</option>
              </select>
            </div>
            <div>
              <label htmlFor="petDeposit" className="block text-sm font-medium mb-2">
                Pet Deposit ($)
              </label>
              <input
                id="petDeposit"
                type="number"
                step="0.01"
                min="0"
                value={petDeposit}
                onChange={(e) => setPetDeposit(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="parkingSpaces" className="block text-sm font-medium mb-2">
                Parking Spaces
              </label>
              <input
                id="parkingSpaces"
                type="number"
                min="0"
                value={parkingSpaces}
                onChange={(e) => setParkingSpaces(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label htmlFor="utilitiesIncluded" className="block text-sm font-medium mb-2">
              Utilities Included (comma-separated)
            </label>
            <input
              id="utilitiesIncluded"
              type="text"
              value={utilitiesIncluded}
              onChange={(e) => setUtilitiesIncluded(e.target.value)}
              placeholder="e.g. water, trash, sewer"
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="specialTerms" className="block text-sm font-medium mb-2">
              Special Terms
            </label>
            <textarea
              id="specialTerms"
              value={specialTerms}
              onChange={(e) => setSpecialTerms(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-2">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving || !propertyId || !unitId || !startDate || !endDate || !rentAmount || selectedTenantIds.length === 0}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Lease'}
          </button>
          <Link
            href={`/llcs/${llcId}/leases`}
            className="px-6 py-2 border border-input rounded-md hover:bg-secondary transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
