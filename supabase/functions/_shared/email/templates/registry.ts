// Central template taxonomy. Each entry is a pure function set (subject,
// preheader, render) plus the metadata the docs/testing/outbox layers need.
// template_id here is only ever a lookup key — the row in email_outbox
// never carries rendering logic itself, so templates can be edited without
// touching the business-event/trigger layer at all.

export type EmailCategory =
  | "AUTH" | "ACCOUNT" | "MEMBERSHIP" | "TRIAL" | "BILLING" | "SKYNN"
  | "ROUTINES" | "PRODUCT" | "SUPPORT" | "FORMS" | "SECURITY" | "SYSTEM"
  | "ADMIN" | "MARKETING";

export type TemplateVars = Record<string, unknown>;

export interface EmailTemplateDefinition {
  id: string;
  category: EmailCategory;
  internalName: string;
  transactional: boolean;
  requiredVars: string[];
  subject: (vars: TemplateVars) => string;
  preheader: (vars: TemplateVars) => string;
  render: (vars: TemplateVars) => string;
}

const registry = new Map<string, EmailTemplateDefinition>();

export function registerTemplate(def: EmailTemplateDefinition): EmailTemplateDefinition {
  registry.set(def.id, def);
  return def;
}

export function getTemplate(id: string): EmailTemplateDefinition | undefined {
  return registry.get(id);
}

export function allTemplates(): EmailTemplateDefinition[] {
  return Array.from(registry.values());
}

export function missingRequiredVars(def: EmailTemplateDefinition, vars: TemplateVars): string[] {
  return def.requiredVars.filter((key) => vars[key] === undefined || vars[key] === null);
}
