import { Timestamp } from './common';
import { MemberRole, MemberStatus } from '../constants/roles';

/**
 * Platform account - top-level account that owns LLCs
 */
export interface PlatformAccount {
  id: string;
  ownerUserId: string;
  stripeCustomerId?: string;
  billingStatus: 'active' | 'past_due' | 'canceled';
  createdAt: Timestamp;
}

/**
 * LLC entity - primary organizational unit
 */
export interface LLC {
  id: string;
  platformAccountId: string;
  legalName: string;
  einLast4?: string;
  stripeConnectedAccountId?: string;
  settings: LLCSettings;
  createdAt: Timestamp;
}

export interface LLCSettings {
  timezone: string;
  currency: string;
  lateFeeEnabled: boolean;
  lateFeeAmount?: number;
  lateFeeGraceDays?: number;
}

/**
 * LLC Member - user's access to an LLC
 */
export interface LLCMember {
  userId: string;
  role: MemberRole;
  propertyScopes?: string[]; // Optional: limit to specific properties
  caseScopes?: string[]; // Optional: limit to specific cases
  status: MemberStatus;
  invitedBy?: string;
  invitedAt?: Timestamp;
  joinedAt?: Timestamp;
  createdAt: Timestamp;
}

/**
 * User profile (stored separately from auth)
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
}
