import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface CreateResidentialTenantInput {
  type: 'residential';
  propertyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  ssn4?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  notes?: string;
}

export interface CreateCommercialTenantInput {
  type: 'commercial';
  propertyId: string;
  businessName: string;
  dba?: string;
  businessType: string;
  einLast4?: string;
  stateOfIncorporation?: string;
  primaryContact: {
    name: string;
    title?: string;
    email?: string;
    phone?: string;
  };
  email: string;
  phone?: string;
  notes?: string;
}

export type CreateTenantInput = CreateResidentialTenantInput | CreateCommercialTenantInput;

export interface UpdateTenantInput {
  type: 'residential' | 'commercial';
  propertyId?: string;
  email?: string;
  phone?: string;
  notes?: string;
  // Residential fields
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  ssn4?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  // Commercial fields
  businessName?: string;
  dba?: string;
  businessType?: string;
  einLast4?: string;
  stateOfIncorporation?: string;
  primaryContact?: {
    name: string;
    title?: string;
    email?: string;
    phone?: string;
  };
}

/**
 * Create a new tenant under an LLC
 */
export async function createTenant(
  llcId: string,
  input: CreateTenantInput,
  actorUserId: string
) {
  const tenantRef = adminDb.collection('llcs').doc(llcId).collection('tenants').doc();
  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();

  const baseTenantData = {
    llcId,
    propertyId: input.propertyId,
    type: input.type,
    email: input.email,
    phone: input.phone || null,
    notes: input.notes || null,
    leaseIds: [],
    stripeCustomerId: null,
    userId: null,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: actorUserId,
  };

  let tenantData: Record<string, unknown>;
  let auditSummary: Record<string, unknown>;

  if (input.type === 'residential') {
    tenantData = {
      ...baseTenantData,
      firstName: input.firstName,
      lastName: input.lastName,
      dateOfBirth: input.dateOfBirth || null,
      ssn4: input.ssn4 || null,
      emergencyContact: input.emergencyContact || null,
    };
    auditSummary = { name: `${input.firstName} ${input.lastName}`, type: 'residential' };
  } else {
    tenantData = {
      ...baseTenantData,
      businessName: input.businessName,
      dba: input.dba || null,
      businessType: input.businessType,
      einLast4: input.einLast4 || null,
      stateOfIncorporation: input.stateOfIncorporation || null,
      primaryContact: input.primaryContact,
    };
    auditSummary = { name: input.businessName, type: 'commercial' };
  }

  const batch = adminDb.batch();
  batch.set(tenantRef, tenantData);
  batch.set(auditRef, {
    actorUserId,
    action: 'create',
    entityType: 'tenant',
    entityId: tenantRef.id,
    entityPath: `llcs/${llcId}/tenants/${tenantRef.id}`,
    changes: { after: auditSummary },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
  return { id: tenantRef.id, ...tenantData };
}

/**
 * Update an existing tenant
 */
export async function updateTenant(
  llcId: string,
  tenantId: string,
  input: UpdateTenantInput,
  actorUserId: string
) {
  const tenantRef = adminDb.collection('llcs').doc(llcId).collection('tenants').doc(tenantId);
  const tenantDoc = await tenantRef.get();

  if (!tenantDoc.exists) {
    throw new Error('Tenant not found');
  }

  const currentData = tenantDoc.data();
  const updateData: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  // Shared fields
  if (input.propertyId !== undefined) updateData.propertyId = input.propertyId;
  if (input.email !== undefined) updateData.email = input.email;
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.notes !== undefined) updateData.notes = input.notes;

  // Type-specific fields
  if (input.type === 'residential') {
    if (input.firstName !== undefined) updateData.firstName = input.firstName;
    if (input.lastName !== undefined) updateData.lastName = input.lastName;
    if (input.dateOfBirth !== undefined) updateData.dateOfBirth = input.dateOfBirth;
    if (input.ssn4 !== undefined) updateData.ssn4 = input.ssn4;
    if (input.emergencyContact !== undefined) updateData.emergencyContact = input.emergencyContact;
  } else {
    if (input.businessName !== undefined) updateData.businessName = input.businessName;
    if (input.dba !== undefined) updateData.dba = input.dba;
    if (input.businessType !== undefined) updateData.businessType = input.businessType;
    if (input.einLast4 !== undefined) updateData.einLast4 = input.einLast4;
    if (input.stateOfIncorporation !== undefined) updateData.stateOfIncorporation = input.stateOfIncorporation;
    if (input.primaryContact !== undefined) updateData.primaryContact = input.primaryContact;
  }

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();
  const batch = adminDb.batch();

  batch.update(tenantRef, updateData);
  batch.set(auditRef, {
    actorUserId,
    action: 'update',
    entityType: 'tenant',
    entityId: tenantId,
    entityPath: `llcs/${llcId}/tenants/${tenantId}`,
    changes: {
      before: { email: currentData?.email, type: currentData?.type },
      after: updateData,
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
  return { id: tenantId, ...currentData, ...updateData };
}

/**
 * Get a single tenant
 */
export async function getTenant(llcId: string, tenantId: string) {
  const tenantRef = adminDb.collection('llcs').doc(llcId).collection('tenants').doc(tenantId);
  const tenantDoc = await tenantRef.get();

  if (!tenantDoc.exists) {
    return null;
  }

  return { id: tenantDoc.id, ...tenantDoc.data() };
}

/**
 * List all tenants for an LLC, optionally filtered by propertyId
 */
export async function listTenants(llcId: string, propertyId?: string) {
  let query = adminDb
    .collection('llcs')
    .doc(llcId)
    .collection('tenants')
    .orderBy('createdAt', 'desc') as FirebaseFirestore.Query;

  if (propertyId) {
    query = query.where('propertyId', '==', propertyId);
  }

  const snapshot = await query.get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Delete a tenant (hard delete — only if no active leases)
 */
export async function deleteTenant(
  llcId: string,
  tenantId: string,
  actorUserId: string
) {
  const tenantRef = adminDb.collection('llcs').doc(llcId).collection('tenants').doc(tenantId);
  const tenantDoc = await tenantRef.get();

  if (!tenantDoc.exists) {
    throw new Error('Tenant not found');
  }

  const tenantData = tenantDoc.data();

  // Check for active leases
  if (tenantData?.leaseIds && tenantData.leaseIds.length > 0) {
    throw new Error('Cannot delete tenant with active leases. Remove lease associations first.');
  }

  const auditRef = adminDb.collection('llcs').doc(llcId).collection('auditLogs').doc();
  const batch = adminDb.batch();

  batch.delete(tenantRef);
  batch.set(auditRef, {
    actorUserId,
    action: 'delete',
    entityType: 'tenant',
    entityId: tenantId,
    entityPath: `llcs/${llcId}/tenants/${tenantId}`,
    changes: {
      before: { email: tenantData?.email, type: tenantData?.type },
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
  return { id: tenantId, deleted: true };
}
