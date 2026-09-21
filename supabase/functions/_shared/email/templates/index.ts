// Side-effect import: each of these files calls registerTemplate() at
// module load time. Importing this one file registers the whole taxonomy.
import "./auth.ts";
import "./account.ts";
import "./membership.ts";
import "./billing.ts";
import "./skynn.ts";
import "./forms.ts";
import "./admin.ts";
import "./marketing.ts";

export { getTemplate, allTemplates, missingRequiredVars } from "./registry.ts";
export type { EmailTemplateDefinition, EmailCategory, TemplateVars } from "./registry.ts";
