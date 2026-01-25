import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface CreateLeaseInput {
  propertyId: string;
  unitId: string;
  tenantIds: string[];
  startDate: string;
  endDate: string;
  rentAmount: number;
  dueDay: number;
  depositAmount: number;
  status?: string;
  terms?: {
    petPolicy?: 'allowed' | 'not_allowed' | 'case_by_case';
    petDeposit?: number;
    parkingSpaces?: number;
    utilitiesIncluded?: string[];
    specialTerms?: string;
  };
  renewalOf?: string;
  notes?: string;
}

export interface UpdateLeaseInput {
  startDate?: string;
  endDate?: string;
  rentAmount?: number;
  dueDay?: number;
  depositAmount?: number;
  status?: string;
  terms?: {
    petPolicy?: 'allowed' | 'not_allowed' | 'case_by_case';
    petDeposit?: number;
    parkingSpaces?: number;
    utilitiesIncluded?: string[];
    specialTerms?: string;
  };
  notes?: string;
}

/**
 * Create a new lease under an LLC.
 * Also adds the lease ID to each tenant's leaseIds array.
 */
export async function createLease(
  llcId: string,
  input: CreateLeaseInput,
  actorUserId: string
) {
  const leaseRef = adminDb.collection('llcs').doc(llcId).collection('leases').doc();
  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();

  const leaseData = {
    llcId,
    propertyId: input.propertyId,
    unitId: input.unitId,
    tenantIds: input.tenantIds,
    startDate: input.startDate,
    endDate: input.endDate,
    rentAmount: input.rentAmount,
    dueDay: input.dueDay,
    depositAmount: input.depositAmount,
    status: input.status || 'draft',
    terms: input.terms || null,
    renewalOf: input.renewalOf || null,
    notes: input.notes || null,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: actorUserId,
  };

  const batch = adminDb.batch();
  batch.set(leaseRef, leaseData);

  // Sync leaseIds on each tenant
  for (const tenantId of input.tenantIds) {
    const tenantRef = adminDb.collection('llcs').doc(llcId).collection('tenants').doc(tenantId);
    batch.update(tenantRef, {
      leaseIds: FieldValue.arrayUnion(leaseRef.id),
    });
  }

  batch.set(auditRef, {
    actorUserId,
    action: 'create',
    entityType: 'lease',
    entityId: leaseRef.id,
    entityPath: `llcs/${llcId}/leases/${leaseRef.id}`,
    changes: {
      after: {
        propertyId: input.propertyId,
        unitId: input.unitId,
        tenantIds: input.tenantIds,
        status: input.status || 'draft',
      },
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
  return { id: leaseRef.id, ...leaseData };
}

/**
 * Update an existing lease
 */
export async function updateLease(
  llcId: string,
  leaseId: string,
  input: UpdateLeaseInput,
  actorUserId: string
) {
  const leaseRef = adminDb.collection('llcs').doc(llcId).collection('leases').doc(leaseId);
  const leaseDoc = await leaseRef.get();

  if (!leaseDoc.exists) {
    throw new Error('Lease not found');
  }

  const currentData = leaseDoc.data();
  const updateData: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (input.startDate !== undefined) updateData.startDate = input.startDate;
  if (input.endDate !== undefined) updateData.endDate = input.endDate;
  if (input.rentAmount !== undefined) updateData.rentAmount = input.rentAmount;
  if (input.dueDay !== undefined) updateData.dueDay = input.dueDay;
  if (input.depositAmount !== undefined) updateData.depositAmount = input.depositAmount;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.notes !== undefined) updateData.notes = input.notes;

  if (input.terms) {
    const currentTerms = currentData?.terms || {};
    updateData.terms = { ...currentTerms, ...input.terms };
  }

  const batch = adminDb.batch();
  batch.update(leaseRef, updateData);

  // If status changed to ended/terminated, remove leaseId from tenants
  const newStatus = input.status;
  const oldStatus = currentData?.status;
  if (newStatus && newStatus !== oldStatus && (newStatus === 'ended' || newStatus === 'terminated')) {
    const tenantIds: string[] = currentData?.tenantIds || [];
    for (const tenantId of tenantIds) {
      const tenantRef = adminDb.collection('llcs').doc(llcId).collection('tenants').doc(tenantId);
      batch.update(tenantRef, {
        leaseIds: FieldValue.arrayRemove(leaseId),
      });
    }
  }

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();
  batch.set(auditRef, {
    actorUserId,
    action: 'update',
    entityType: 'lease',
    entityId: leaseId,
    entityPath: `llcs/${llcId}/leases/${leaseId}`,
    changes: {
      before: { status: currentData?.status, rentAmount: currentData?.rentAmount },
      after: updateData,
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
  return { id: leaseId, ...currentData, ...updateData };
}

/**
 * Get a single lease
 */
export async function getLease(llcId: string, leaseId: string) {
  const leaseRef = adminDb.collection('llcs').doc(llcId).collection('leases').doc(leaseId);
  const leaseDoc = await leaseRef.get();

  if (!leaseDoc.exists) {
    return null;
  }

  return { id: leaseDoc.id, ...leaseDoc.data() };
}

/**
 * List leases for an LLC, optionally filtered by propertyId or unitId
 */
export async function listLeases(llcId: string, propertyId?: string, unitId?: string) {
  let query = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('leases')
    .orderBy('startDate', 'desc') as FirebaseFirestore.Query;

  if (propertyId) {
    query = query.where('propertyId', '==', propertyId);
  }
  if (unitId) {
    query = query.where('unitId', '==', unitId);
  }

  const snapshot = await query.get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Delete a lease (only if status is 'draft').
 * Removes leaseId from tenants' leaseIds.
 */
export async function deleteLease(
  llcId: string,
  leaseId: string,
  actorUserId: string
) {
  const leaseRef = adminDb.collection('llcs').doc(llcId).collection('leases').doc(leaseId);
  const leaseDoc = await leaseRef.get();

  if (!leaseDoc.exists) {
    throw new Error('Lease not found');
  }

  const leaseData = leaseDoc.data();

  if (leaseData?.status !== 'draft') {
    throw new Error('Only draft leases can be deleted. Change status to ended or terminated instead.');
  }

  const batch = adminDb.batch();
  batch.delete(leaseRef);

  // Remove leaseId from tenants
  const tenantIds: string[] = leaseData?.tenantIds || [];
  for (const tenantId of tenantIds) {
    const tenantRef = adminDb.collection('llcs').doc(llcId).collection('tenants').doc(tenantId);
    batch.update(tenantRef, {
      leaseIds: FieldValue.arrayRemove(leaseId),
    });
  }

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();
  batch.set(auditRef, {
    actorUserId,
    action: 'delete',
    entityType: 'lease',
    entityId: leaseId,
    entityPath: `llcs/${llcId}/leases/${leaseId}`,
    changes: {
      before: {
        propertyId: leaseData?.propertyId,
        unitId: leaseData?.unitId,
        tenantIds: leaseData?.tenantIds,
        status: leaseData?.status,
      },
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
  return { id: leaseId, deleted: true };
}
