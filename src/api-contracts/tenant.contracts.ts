/**
 * AUTO-GENERATED FILE - DO NOT EDIT
 *
 * Source: parking-api/src/shared/contracts/tenant.contracts.ts
 * Generated at: 2026-06-08T06:02:53.093Z
 *
 * To regenerate, run: npm run sync:contracts
 */

import type { AuthTokens } from './auth.contracts';
import type { ManagerRole } from './area-administrators.contracts';

/**
 * Tenant (multi-tenant 기관) contracts shared with the back office.
 * The signup-tenant flow surfaces these to let an admin either join an
 * existing tenant by 사업자등록번호 or register a brand-new one.
 */

export interface TenantPublicDto {
  /** Internal tenant id */
  id: string;
  /** Display name = 기관명 */
  name: string;
  /** Legal business name from the registry (사업자명) — may be null for legacy tenants */
  businessName: string | null;
  /** Representative name (대표자명) — may be null for legacy tenants */
  representativeName: string | null;
  /** Managed province (담당 시·도) */
  region1: string | null;
  /** Managed districts (담당 구·군) — multi-select */
  region2: string[] | null;
}

// ---- POST /tenants/check-business-reg ----

export interface CheckBusinessRegRequest {
  /** Korean business registration number — accepts dashed or raw 10 digits */
  businessRegNumber: string;
}

export interface CheckBusinessRegResponse {
  /** Whether a tenant exists for this 사업자등록번호 */
  exists: boolean;
  /** Public tenant info — populated only when exists=true */
  tenant?: TenantPublicDto;
}

// ---- POST /tenants/register ----

export interface RegisterTenantRequest {
  /** 기관명 */
  name: string;
  /** Korean business registration number */
  businessRegNumber: string;
  /** Managed province */
  region1: string;
  /** Managed districts — multi-select */
  region2: string[];

  // Account info — first manager is created with super_admin role
  username: string;
  password: string;

  // Manager profile
  fullName: string;
  phone: string;
  /** OTP verification token issued after phone verification */
  verificationToken: string;
  email?: string;

  termsAgreed: boolean;
  privacyAgreed: boolean;
}

export interface RegisterTenantResponse {
  data: {
    tenant: TenantPublicDto;
    userId: string;
    role: ManagerRole;
    tokens: AuthTokens;
  };
}

// ---- GET /tenants/region2-availability?region1=... ----

/**
 * Per-district availability — `taken` districts are already managed by another
 * active tenant in the given region1, and must be disabled in the signup form.
 */
export interface Region2AvailabilityResponse {
  region1: string;
  taken: string[];
}

// ---- PATCH /tenants/me/regions ----

/**
 * Append one or more districts (구·군) to the current tenant's managed region2
 * list. super_admin only — adds new areas the organization manages. region1 is
 * fixed per tenant, so only region2 is supplied. Accepts a single string or an
 * array for multi-select.
 */
export interface AddTenantRegion2Request {
  /** District(s) (구·군) to add to the tenant's managed area */
  region2: string | string[];
}

export interface AddTenantRegion2Response {
  /** Updated tenant public info (region2 now includes the new district) */
  tenant: TenantPublicDto;
}
