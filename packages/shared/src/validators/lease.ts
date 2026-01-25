import { z } from 'zod';
import { LEASE_STATUSES } from '../constants/statuses';

export const leaseStatusSchema = z.enum([
  LEASE_STATUSES.draft,
  LEASE_STATUSES.active,
  LEASE_STATUSES.ended,
  LEASE_STATUSES.eviction,
  LEASE_STATUSES.terminated,
]);

export const leaseTermsSchema = z.object({
  petPolicy: z.enum(['allowed', 'not_allowed', 'case_by_case']).optional(),
  petDeposit: z.number().nonnegative().optional(),
  parkingSpaces: z.number().int().min(0).optional(),
  utilitiesIncluded: z.array(z.string().max(50)).optional(),
  specialTerms: z.string().max(5000).optional(),
});

export const createLeaseSchema = z.object({
  propertyId: z.string().min(1),
  unitId: z.string().min(1),
  tenantIds: z.array(z.string().min(1)).min(1),
  startDate: z.string().min(1), // ISO date string
  endDate: z.string().min(1),
  rentAmount: z.number().positive(),
  dueDay: z.number().int().min(1).max(28),
  depositAmount: z.number().nonnegative(),
  status: leaseStatusSchema.default('draft'),
  terms: leaseTermsSchema.optional(),
  renewalOf: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export const updateLeaseSchema = z.object({
  startDate: z.string().min(1).optional(),
  endDate: z.string().min(1).optional(),
  rentAmount: z.number().positive().optional(),
  dueDay: z.number().int().min(1).max(28).optional(),
  depositAmount: z.number().nonnegative().optional(),
  status: leaseStatusSchema.optional(),
  terms: leaseTermsSchema.optional(),
  notes: z.string().max(2000).optional(),
});
