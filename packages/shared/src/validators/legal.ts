import { z } from 'zod';
import {
  CASE_STATUSES,
  CASE_VISIBILITIES,
  TASK_STATUSES,
  TASK_PRIORITIES,
} from '../constants/statuses';

export const caseTypeSchema = z.enum([
  'eviction',
  'collections',
  'property_damage',
  'contract_dispute',
  'personal_injury',
  'code_violation',
  'other',
]);

export const caseStatusSchema = z.enum([
  CASE_STATUSES.open,
  CASE_STATUSES.stayed,
  CASE_STATUSES.settled,
  CASE_STATUSES.judgment,
  CASE_STATUSES.closed,
]);

export const caseVisibilitySchema = z.enum([
  CASE_VISIBILITIES.restricted,
  CASE_VISIBILITIES.llcWide,
]);

export const createCaseSchema = z.object({
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  tenantId: z.string().optional(),
  court: z.string().min(1).max(200),
  jurisdiction: z.string().min(1).max(50),
  docketNumber: z.string().max(100).optional(),
  caseType: caseTypeSchema,
  status: caseStatusSchema.default('open'),
  visibility: caseVisibilitySchema.default('llcWide'),
  opposingParty: z.string().max(200).optional(),
  opposingCounsel: z.string().max(200).optional(),
  ourCounsel: z.string().max(200).optional(),
  filingDate: z.string().datetime().optional(),
  nextHearingDate: z.string().datetime().optional(),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const updateCaseSchema = createCaseSchema.partial();

export const taskStatusSchema = z.enum([
  TASK_STATUSES.pending,
  TASK_STATUSES.in_progress,
  TASK_STATUSES.completed,
  TASK_STATUSES.canceled,
]);

export const taskPrioritySchema = z.enum([
  TASK_PRIORITIES.low,
  TASK_PRIORITIES.medium,
  TASK_PRIORITIES.high,
  TASK_PRIORITIES.urgent,
]);

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  dueDate: z.string().datetime(),
  status: taskStatusSchema.default('pending'),
  priority: taskPrioritySchema.default('medium'),
  assignedToUserId: z.string().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const documentTypeSchema = z.enum([
  'filing',
  'evidence',
  'notice',
  'correspondence',
  'court_order',
  'settlement',
  'other',
]);

export const createDocumentSchema = z.object({
  title: z.string().min(1).max(200),
  type: documentTypeSchema,
  fileName: z.string().min(1).max(255),
  storagePath: z.string().min(1),
  contentType: z.string().min(1).max(100),
  sizeBytes: z.number().positive(),
});
