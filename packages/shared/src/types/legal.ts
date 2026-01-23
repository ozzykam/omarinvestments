import { Timestamp } from './common';
import { CaseStatus, CaseVisibility, TaskStatus, TaskPriority } from '../constants/statuses';

/**
 * Legal case - lawsuit, eviction, dispute, etc.
 */
export interface Case {
  id: string;
  llcId: string;
  propertyId?: string;
  unitId?: string;
  tenantId?: string;
  court: string;
  jurisdiction: string;
  docketNumber?: string;
  caseType: CaseType;
  status: CaseStatus;
  visibility: CaseVisibility;
  opposingParty?: string;
  opposingCounsel?: string;
  ourCounsel?: string;
  filingDate?: string; // ISO date
  nextHearingDate?: string; // ISO date
  description?: string;
  tags?: string[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export type CaseType =
  | 'eviction'
  | 'collections'
  | 'property_damage'
  | 'contract_dispute'
  | 'personal_injury'
  | 'code_violation'
  | 'other';

/**
 * Case task - deadline or action item
 */
export interface CaseTask {
  id: string;
  caseId: string;
  llcId: string;
  title: string;
  description?: string;
  dueDate: string; // ISO date
  status: TaskStatus;
  priority: TaskPriority;
  assignedToUserId?: string;
  completedAt?: Timestamp;
  completedByUserId?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Case document - file attached to a case
 */
export interface CaseDocument {
  id: string;
  caseId: string;
  llcId: string;
  title: string;
  type: DocumentType;
  fileName: string;
  storagePath: string;
  contentType: string;
  sizeBytes: number;
  uploadedByUserId: string;
  createdAt: Timestamp;
}

export type DocumentType =
  | 'filing'
  | 'evidence'
  | 'notice'
  | 'correspondence'
  | 'court_order'
  | 'settlement'
  | 'other';
