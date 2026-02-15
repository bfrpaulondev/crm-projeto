// CRM Entity Types

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string;
  role: UserRole;
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'SALES_REP' | 'READ_ONLY';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
}

export type TenantPlan = 'free' | 'starter' | 'professional' | 'enterprise';

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName?: string;
  status: LeadStatus;
  notes?: string;
  ownerId?: string;
  owner?: User;
  createdAt: string;
  updatedAt: string;
}

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'UNQUALIFIED';
export type LeadSource = 'WEBSITE' | 'REFERRAL' | 'COLD_CALL' | 'EMAIL_CAMPAIGN' | 'SOCIAL_MEDIA' | 'TRADE_SHOW' | 'OTHER';

export interface Opportunity {
  id: string;
  name: string;
  value?: number;
  amount: number;
  status: OpportunityStatus;
  stage?: OpportunityStage;
  probability: number;
  stageId?: string;
  accountId?: string;
  contactId?: string;
  expectedCloseDate?: string;
  assignedTo?: User;
  lead?: Lead;
  createdAt: string;
  updatedAt: string;
}

export type OpportunityStatus = 'OPEN' | 'WON' | 'LOST';
export type OpportunityStage = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';

export interface Stage {
  id: string;
  name: string;
  order: number;
  probability: number;
  color?: string;
  isActive: boolean;
}

export interface Account {
  id: string;
  name: string;
  domain?: string;
  website?: string;
  industry?: string;
  type?: AccountType;
  tier?: AccountTier;
  createdAt: string;
}

export type AccountType = 'PROSPECT' | 'CUSTOMER' | 'PARTNER' | 'COMPETITOR' | 'VENDOR';
export type AccountTier = 'ENTERPRISE' | 'MID_MARKET' | 'SMB' | 'STARTUP';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  accountId?: string;
  createdAt: string;
}

// Auth Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
  tenantSlug: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantName: string;
  tenantSlug: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

// Lead Mutations
export interface CreateLeadInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName?: string;
}

export interface UpdateLeadInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  status?: LeadStatus;
  source?: LeadSource;
  estimatedValue?: number;
  notes?: string;
}

export interface QualifyLeadInput {
  leadId: string;
  notes?: string;
}

export interface ConvertLeadInput {
  leadId: string;
  createOpportunity?: boolean;
  opportunityName?: string;
  opportunityAmount?: number;
  stageId?: string;
}

// Dashboard Types
export interface DashboardStats {
  totalLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  totalOpportunities: number;
  openOpportunities: number;
  totalPipelineValue: number;
  wonValue: number;
  lostValue: number;
}

export interface LeadConversionStats {
  source: string;
  total: number;
  converted: number;
  conversionRate: number;
}

export interface ActivityStats {
  type: string;
  count: number;
  completed: number;
}

// Pagination Types (Relay-style)
export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
  totalCount: number;
}

export interface Edge<T> {
  node: T;
  cursor: string;
}

export interface Connection<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
}

// Filter Types
export interface LeadFilters {
  status?: LeadStatus;
  search?: string;
  minScore?: number;
}

export interface OpportunityFilters {
  status?: OpportunityStatus;
  stageId?: string;
  minAmount?: number;
  maxAmount?: number;
}

// Bulk Operations
export interface BulkOperationResult {
  success: boolean;
  processedCount: number;
  successCount: number;
  failedCount: number;
  errors: BulkError[];
}

export interface BulkError {
  index: number;
  error: string;
}

// Attachment
export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}

// Activity Types
export interface Activity {
  id: string;
  type: ActivityType;
  subject: string;
  description?: string | null;
  status: ActivityStatus;
  priority: ActivityPriority;
  dueDate?: string | null;
  completedAt?: string | null;
  relatedToType?: string | null;
  relatedToId?: string | null;
  leadId?: string | null;
  lead?: Lead;
  ownerId?: string;
  owner?: User;
  assignedToId?: string | null;
  assignedTo?: User | null;
  createdById?: string;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

export type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'TASK' | 'NOTE';
export type ActivityStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ActivityPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface CreateActivityInput {
  type: ActivityType;
  subject: string;
  description?: string;
  priority?: ActivityPriority;
  dueDate?: string;
  leadId?: string;
  assignedToId?: string;
}

export interface UpdateActivityInput {
  type?: ActivityType;
  subject?: string;
  description?: string;
  status?: ActivityStatus;
  priority?: ActivityPriority;
  dueDate?: string;
  leadId?: string;
  assignedToId?: string;
}

// Email Template Types
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailTemplateInput {
  name: string;
  subject: string;
  body: string;
  variables?: string[];
}

export interface UpdateEmailTemplateInput {
  name?: string;
  subject?: string;
  body?: string;
  variables?: string[];
}
