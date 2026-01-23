import { z } from 'zod';
import { PROPERTY_TYPES, PROPERTY_STATUSES, UNIT_STATUSES } from '../constants/statuses';

export const addressSchema = z.object({
  street1: z.string().min(1).max(200),
  street2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().length(2),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
  country: z.string().default('US'),
});

export const propertyTypeSchema = z.enum([
  PROPERTY_TYPES.residential,
  PROPERTY_TYPES.commercial,
  PROPERTY_TYPES.mixed,
]);

export const propertyStatusSchema = z.enum([
  PROPERTY_STATUSES.active,
  PROPERTY_STATUSES.inactive,
  PROPERTY_STATUSES.sold,
]);

export const createPropertySchema = z.object({
  name: z.string().max(200).optional(),
  type: propertyTypeSchema,
  address: addressSchema,
  status: propertyStatusSchema.default('active'),
  purchaseDate: z.string().datetime().optional(),
  purchasePrice: z.number().positive().optional(),
  notes: z.string().max(2000).optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

export const unitStatusSchema = z.enum([
  UNIT_STATUSES.available,
  UNIT_STATUSES.occupied,
  UNIT_STATUSES.maintenance,
  UNIT_STATUSES.unavailable,
]);

export const createUnitSchema = z.object({
  unitNumber: z.string().min(1).max(50),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().min(0).max(20).optional(),
  sqft: z.number().positive().optional(),
  status: unitStatusSchema.default('available'),
  marketRent: z.number().positive().optional(),
  notes: z.string().max(2000).optional(),
});

export const updateUnitSchema = createUnitSchema.partial();
