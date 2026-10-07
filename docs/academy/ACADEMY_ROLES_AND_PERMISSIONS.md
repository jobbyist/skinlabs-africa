# SkinLabs® Academy — Roles and Permissions

## 1. Principles
- **One identity system.** Supabase Auth. No Academy-specific accounts or passwords.
- **Global roles untouched.** `app_role` (`admin, moderator, user`) is not altered. Academy roles are scoped assignments in `academy_role_assignments` (optionally per course).
- **Least privilege by RPC.** Roles are checked in SECURITY DEFINER functions (`academy_has_role`), not by client flags. UI hiding is convenience only.
- **PII minimisation.** Instructors see aggregates, not learner emails; assessors see only the submissions they mark (display handle + submission); only admins see learner identities.
- **Separation of duties.** An author cannot review/approve their own version; the person who publishes is an admin; the person who verifies accreditation is an admin and is recorded.
- **Everything privileged is audited** in `academy_audit_log`.

## 2. Learner roles (derived, not stored as roles)

| State | How determined | Can |
|---|---|---|
| Visitor | no session | Browse catalogue/landing pages, read free-preview lessons, verify a certificate, join waitlist (via sign-up intent). |
| Registered learner | any signed-in user | Enrol in `free` courses, save courses, bookmark/note on accessible lessons, enrol-intent flows, view own data. |
| Member learner | `useMembership` tier ∈ course `member_tiers_included` (trial counts as tier, per existing convention) | Access to membership-included courses while the membership is live (progress kept if it lapses; access pauses). |
| Paid learner | enrolment `source='purchase'` | Permanent access (or until `access_expires_at`) to the purchased course/version. |
| Granted learner | `admin_grant`/`giveaway` enrolment | As paid; reason recorded. |
| Completed learner / alumni | `enrolments.completed_at` | Certificate issue/download, review course, continued access. |
| Learner with accommodation | `academy_accommodations` row | Extended assessment time. |

## 3. Staff roles

### instructor *(scoped to course(s) or academy-wide)*
Create/edit own draft versions, upload assets for their courses, write lessons, sources, assessments and keys, submit for review, view **aggregate** course analytics (enrolments, completion, pass rates, item difficulty), respond to course reviews, mark assignments for their courses if also `assessor`. Cannot: publish, change price/access model, see learner identities, grant enrolments, edit published versions (must create a new draft).

### reviewer *(editorial / subject-matter / accessibility)*
Read drafts in review, record checklist + decision, comment per lesson, verify sources (`checked/verified`). Cannot review a version they authored. Cannot publish.

### assessor
Claim and mark assignment submissions for assigned courses using the rubric, return feedback, mark pass/fail. Sees submission content and the learner's display handle only. Cannot change pass marks or reset attempts.

### academy_admin
Everything academy-scoped: publish/unpublish/archive, set price/access model/refund window, assign roles, grant/revoke enrolments (with reason), refund-revoke, reset attempts, issue/revoke certificates, moderate reviews, manage accommodations, verify accreditation, change `academy_config`, view audit log and learner-level data.

### Platform admin (`has_role(uid,'admin')`)
Implicitly academy_admin. The four existing admin accounts therefore gain Academy admin on day one; role assignment rows are needed only for non-admin staff.

### Platform moderator (`has_role(uid,'moderator')`)
Allowed to moderate **course reviews only** (consistent with comment moderation intent). No other Academy rights. (Decision D9.)

### service_role
Edge functions only: purchase-to-enrolment grant, scheduled jobs, lifecycle email enqueue. Never in the browser.

## 4. Permission matrix

C = create, R = read, U = update, D = delete/archive, X = execute action. "own" = rows where `user_id = auth.uid()`. "course" = role scoped to that course.

| Capability | Visitor | Learner | Instructor | Reviewer | Assessor | Academy admin |
|---|---|---|---|---|---|---|
| Read published catalogue & outline | R | R | R | R | R | R |
| Read preview lesson bodies | R | R | R | R | R | R |
| Read full lesson bodies | – | R (enrolled w/ access) | R (course) | R (course, in review) | R (course) | R |
| Enrol (free/membership) | – | X | – | – | – | X (grant) |
| Purchase course | – | X | – | – | – | – |
| Progress, bookmarks, notes, saved | – | CRUD own | – | – | – | R via audit tools only |
| Attempt quizzes | – | X own | – | – | – | – (preview mode in studio, no records) |
| Submit assignments | – | C own | – | – | – | – |
| Mark assignments | – | – | – | – | X (course) | X |
| Author drafts (content, assessments, keys) | – | – | CRU (course) | – | – | CRUD |
| Submit version for review | – | – | X (course) | – | – | X |
| Review / approve version | – | – | – (not own) | X | – | X |
| Publish / unpublish / archive | – | – | – | – | – | X |
| Set price / access model / prerequisites | – | – | R | – | – | CRU |
| Issue certificate | – | X own, via completion rules | – | – | – | X (exceptional, audited) |
| Verify a certificate | X | X | X | X | X | X |
| Revoke certificate | – | – | – | – | – | X |
| Rate/review a course | – | C own (progress gate) | – | – | – | – |
| Moderate reviews | – | – | – | – | – | X (+ platform moderator) |
| Manage accreditation | – | – | R (status) | – | – | CRU / verify |
| View learner identities | – | own | – (aggregates) | – | handle only | R |
| Assign roles | – | – | – | – | – | X |
| Change `academy_config` | – | – | – | – | – | X |
| Read audit log | – | – | – | – | – | R |

## 5. Enforcement layers
1. **RLS** (read boundaries; see DB spec §8).
2. **SECURITY DEFINER RPCs** (all writes that change state): check `auth.uid()`, role helper, resource scope, version immutability.
3. **Edge functions** verify the JWT themselves (existing pattern) and use service role only for payment-to-enrolment.
4. **Frontend**: `useAcademyRoles()` (single RPC `academy_my_roles()`, cached like `fetchMembershipRow`) shows/hides studio navigation; never authoritative.
5. **Probes**: every row in the matrix above that says "–" gets a negative SQL probe as anon and as an unrelated authenticated user.

## 6. Account lifecycle and privacy (POPIA)
- Account deletion (`account-delete`) must be extended to remove notes, bookmarks, saved courses, submissions and their storage objects, and to **anonymise** certificates (keep verification validity, drop name — D8) and enrolments needed for financial records (payment records already retained separately).
- Data export (`generateAccountDataPdf`) gains Academy sections (enrolments, progress summary, notes, certificates).
- Privacy Policy, Terms and Cookie Policy updates are legal prerequisites to `public` rollout.
- Staff access to submissions is logged; assessor queue never exposes email.
