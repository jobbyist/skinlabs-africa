/**
 * Academy rollout + membership helpers (presentation only — the database decides access).
 * Mirrors academy_catalogue_open() and academy_user_tier()/academy_user_course_access() in
 * 20261007100000_academy_foundations.sql.
 */
import type { MembershipTier } from "@/hooks/use-membership";

export type AcademyStage = "disabled" | "preview" | "public";

export interface AcademyPublicConfig {
  stage: AcademyStage;
  catalogueOpen: boolean;
  paidEnrolmentEnabled: boolean;
  certificatesEnabled: boolean;
  reviewsEnabled: boolean;
}

/** Safe default while loading or if the call fails: nothing is open, nothing looks operational. */
export const ACADEMY_CLOSED: AcademyPublicConfig = {
  stage: "disabled",
  catalogueOpen: false,
  paidEnrolmentEnabled: false,
  certificatesEnabled: false,
  reviewsEnabled: false,
};

const STAGES: readonly string[] = ["disabled", "preview", "public"];

export const parseAcademyConfig = (raw: unknown): AcademyPublicConfig => {
  if (!raw || typeof raw !== "object") return ACADEMY_CLOSED;
  const r = raw as Record<string, unknown>;
  const stage = typeof r.stage === "string" && STAGES.includes(r.stage) ? (r.stage as AcademyStage) : "disabled";
  return {
    stage,
    catalogueOpen: r.catalogue_open === true,
    paidEnrolmentEnabled: r.paid_enrolment_enabled === true,
    certificatesEnabled: r.certificates_enabled === true,
    reviewsEnabled: r.reviews_enabled === true,
  };
};

/** True when Academy pages should render as a live product (vs. the "coming soon" treatment). */
export const isAcademyLive = (config: AcademyPublicConfig): boolean => config.stage === "public" && config.catalogueOpen;

export type AcademyRole = "academy_admin" | "instructor" | "reviewer" | "assessor";

export interface AcademyRoles {
  isAdmin: boolean;
  roles: Array<{ role: AcademyRole; courseId: string | null }>;
}

export const NO_ACADEMY_ROLES: AcademyRoles = { isAdmin: false, roles: [] };

const ROLE_NAMES: readonly string[] = ["academy_admin", "instructor", "reviewer", "assessor"];

export const parseAcademyRoles = (raw: unknown): AcademyRoles => {
  if (!raw || typeof raw !== "object") return NO_ACADEMY_ROLES;
  const r = raw as { is_admin?: unknown; roles?: unknown };
  const roles = Array.isArray(r.roles)
    ? r.roles.flatMap((x) => {
        const row = x as { role?: unknown; course_id?: unknown };
        return typeof row?.role === "string" && ROLE_NAMES.includes(row.role)
          ? [{ role: row.role as AcademyRole, courseId: typeof row.course_id === "string" ? row.course_id : null }]
          : [];
      })
    : [];
  return { isAdmin: r.is_admin === true, roles };
};

/** Anyone who may see Studio navigation (UI hint only; every studio RPC re-checks). */
export const isAcademyStaff = (roles: AcademyRoles): boolean => roles.isAdmin || roles.roles.length > 0;

export const hasAcademyRole = (roles: AcademyRoles, role: AcademyRole, courseId?: string): boolean =>
  roles.isAdmin || roles.roles.some((r) => r.role === role && (r.courseId === null || courseId === undefined || r.courseId === courseId));

/** Course membership inclusion, e.g. member_tiers_included = ['insider','vip']. Explorers are never included. */
export const isTierIncluded = (tier: MembershipTier, included: readonly string[]): boolean => tier !== "explorer" && included.includes(tier);
