import { Timestamp } from './common';

/**
 * Tenant - a person who rents a unit
 */
export interface Tenant {
  id: string;
  llcId: string;
  userId?: string; // Firebase Auth UID if tenant has login
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string; // ISO date string
  ssn4?: string; // Last 4 digits only
  emergencyContact?: EmergencyContact;
  notes?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

/**
 * Tenant user ID mapping (for tenant portal access)
 */
export interface TenantUserMapping {
  tenantId: string;
  llcId: string;
}
