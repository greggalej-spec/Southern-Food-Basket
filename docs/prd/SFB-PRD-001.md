# SOUTHERN FOOD BASKET
## Master Product Requirements Document (PRD) and Repository Modernization Specification

**Document ID:** SFB-PRD-001  
**Version:** 1.0 | **Prepared:** 27 October 2026 (America/New_York)  
**Prepared for:** Southern Food Basket / Trinovata delivery team  
**Status:** Consolidated requirements baseline; client approval and repository audit outstanding  
**Product:** Recruitment-first corporate supermarket website, promotional engagement system, customer accounts, and separated operational portals  
**Existing public prototype:** https://southern-food-basket.vercel.app/  
**Classification:** Working specification, not proof that any proposed functionality is already implemented

> **Authority hierarchy:** (1) explicitly approved client decisions and provided meeting transcript; (2) approved business requirements from discussions; (3) confirmed behavior observable on the public prototype; (4) proposed engineering recommendations, which require validation. Actual repository contents, integrations and permissions must be audited before implementation. Where these conflict, log a decision rather than silently overriding existing functionality.

---

## Table of contents

1. Executive decision brief
2. Evidence, scope authority and decision log
3. Vision, positioning, goals and non-goals
4. Personas, roles and access principles
5. Experiences, information architecture and route map
6. End-to-end user journeys
7. Functional requirements: public corporate website
8. Functional requirements: recruitment and applicant portal
9. Functional requirements: promotional engagement and customer profiles
10. Functional requirements: staff dashboard
11. Functional requirements: HR dashboard
12. Functional requirements: store administration
13. Cross-platform authentication, authorization and security
14. Data model, relationships and migration readiness
15. Content management, photography and media pipeline
16. Brand, design system, motion and accessibility
17. UI reference library and component adoption matrix
18. Technical architecture and integration strategy
19. Nonfunctional requirements and measurable service levels
20. Analytics, reporting and experimentation
21. Release stages, dependencies and milestones
22. Definition of finished: universal and module-specific
23. Test strategy, QA matrix and evidence requirements
24. Migration, launch, rollback and operations
25. Backlog, prioritization and acceptance criteria
26. Risks, dependencies, open decisions and assumptions
27. Delivery governance and AI coding agent execution directive
28. Appendices: state machines, examples, templates and references

---

# 1. Executive decision brief

## 1.1 Product statement

Southern Food Basket requires a **premium, recruitment-first corporate website** representing its supermarket and wholesale identity in south Trinidad. The website will showcase the company, its locations, departments, weekly specials, flash sales, events, company story and available jobs. It will provide intuitive public browsing without forcing account creation. The digital experience must be modern, polished, visually distinctive, accessible, and genuinely usable on mobile.

A separate but integrated **operations application** will manage staff, HR and authorized store publishing. Job applicants will use a candidate portal to submit documents and follow progress. Registered promotional users will have a lightweight profile to obtain restricted deals or promotional codes. Future loyalty integration must be anticipated without prematurely implementing a full loyalty program.

## 1.2 Foundational constraints

- **Do not start from scratch by default.** Inspect the current repository and preserve proven functional infrastructure.
- **Recruitment is the primary business focus.** Do not allow retail commerce features to redirect scope.
- **No stock-level catalogue, shopping cart, checkout or online ordering** without a new authorized business decision.
- **Exactly two mandatory account-registration triggers at launch:** applying for jobs and accessing account-restricted/exclusive specials or promotional codes. Browsing, public specials, branches, departments, events and general newsletter subscription remain accessible without an account.
- **Customers have profiles, not a full operations dashboard.** Applicants have a portal; staff, HR and store administrators have role-specific operational views.
- **Approved homepage direction:** “Main Grand Entrance” base; departments from “Option E”; “Try Me Deals” relabeled **Specials**; approved existing brand color scheme retained subject to exact asset verification.
- **All major layouts must work on mobile.** Broken mobile layouts and visible sky/cloud seams are release blockers.
- **Content authenticity matters.** Public prototype calls itself an unofficial concept and includes illustrative/demo materials. Approval and licensing of media, pricing, store information and legal footer are mandatory prior to official launch.

## 1.3 Outcomes

| Outcome | Meaning | Measurement and baseline approach |
|---|---|---|
| Recruitment conversion | Candidates discover and complete applications | Job-view → application-start → submitted funnel; establish baseline in pilot |
| Applicant transparency | Candidates can monitor stage and messages | % applications with current readable state; contact volume per application |
| Marketing reach | Increase permissioned weekly-promotion audience | Verified email subscribers, verified phone opt-ins, unsubscribe rate |
| Promotional engagement | Visitors find weekly and flash specials | Unique views, clicks, saves/claims where enabled; campaign conversion |
| Store discovery | Customers identify a branch and directions quickly | Store-detail visits and directions clicks; mobile task success |
| Publishing autonomy | Staff maintain content without developers | Median time from approved draft to publication; change/audit history |
| Operational clarity | HR and authorized staff can perform role-specific workflows | Task success, reduced manual handoff, audit completeness |
| Experience quality | High-end visual delivery without speed/accessibility regressions | Core Web Vitals, accessibility audit, screen-size QA, visual regressions |

**Numerical business targets must be jointly approved after audit/baseline.** Technical release thresholds are defined later in this document as proposed acceptance criteria.

## 1.4 Delivery workstreams

1. Existing-repository and integration audit.
2. Brand/content/photography validation.
3. Public site design system and responsive overhaul.
4. Recruitment and applicant lifecycle.
5. Promotions and consent-based CRM acquisition.
6. Staff, HR and store-admin operations platform.
7. Analytics, security, performance and QA.
8. Future loyalty compatibility and provider discovery.

# 2. Evidence, scope authority and decision log

## 2.1 Evidence incorporated

- Meeting transcript: “Website design feedback session” with homepage direction, portal definitions, mobile, photo needs, specials, loyalty and demo requirements.
- Spoken follow-up: registration strategy; customer data; newsletters; promotional codes; distinct profile/portal/dashboard terminology; separate operations destination.
- Curated 22 design resources: seven creative sites and fifteen GitHub repositories.
- Public prototype reviewed 27 October 2026: entrance, “Try Me deals,” departments, store locations, careers and staff portal visible; footer labels it an unofficial concept. **This is a surface-level public-site review, not a source-code audit.**

## 2.2 Decision record

| ID | Decision | Classification | Consequence |
|---|---|---|---|
| DEC-001 | Main Grand Entrance is homepage starting point | Confirmed | Preserve core visual concept; repair execution |
| DEC-002 | Use simpler departments composition from Option E | Confirmed | Redesign browse hierarchy |
| DEC-003 | Replace “Try Me Deals” terminology with “Specials” | Confirmed | Rename UI, headings, metadata and internal labels where applicable |
| DEC-004 | Retain approved color scheme | Confirmed | Extract exact tokens from approved assets; no arbitrary rebrand |
| DEC-005 | Recruitment primary focus | Confirmed | Careers prominent in IA, home calls-to-action and metrics |
| DEC-006 | Only job applications and restricted promotional access require signup | Confirmed | Public browse and newsletter are guest-accessible |
| DEC-007 | Customer has profile; applicant portal; staff/HR/admin dashboards | Confirmed | Five experiences; four distinct portal classes |
| DEC-008 | Public and internal operations separated | Confirmed intent | Final domain, topology and hosting subject to audit |
| DEC-009 | Weekly specials and flash sales publishable by authorized staff | Confirmed | CMS and campaign scheduling required |
| DEC-010 | Existing loyalty program/contact and Google Form data must be investigated | Confirmed | No migration until provenance and consent audit |
| DEC-011 | Interactive southwest Trinidad map with clickable pins | Preferred concept | Provide accessible list fallback; map provider TBD |
| DEC-012 | Bright product/exterior/location photography, approximately 25 initial shots | Confirmed direction | Shot list, rights tracking, alt text, responsive assets |
| DEC-013 | No live inventory display | Confirmed | Specials are promotional content, not a stock guarantee |
| DEC-014 | User wants an existing-repo modernization, not one-shot replacement | Confirmed | Audit-first delivery and incremental PRs |
| DEC-015 | Optional phone and birthday in profile | Proposed detail | Validate privacy and minimum-data requirements |
| DEC-016 | Proposed default stack: Next.js, React, TypeScript, Tailwind, shadcn | Conditional | Adopt only if compatible with existing audited stack |
| DEC-017 | Public site/ops on separate domains or apps, shared trusted identity | Proposed solution | Security and deployment architecture review |

## 2.3 Requirement priority vocabulary

- **P0 / Release blocking:** Without this the approved release is incomplete or unsafe.
- **P1 / Required:** Must be delivered for agreed functional launch unless formally deferred.
- **P2 / Enhancement:** Useful next-stage functionality after core outcomes work.
- **P3 / Exploratory:** Not an authorized delivery commitment.
- **FUTURE:** Data contracts may be prepared now; functional build excluded from current launch.

## 2.4 Requirement state vocabulary

`Approved`, `Proposed`, `Needs client validation`, `Audit-dependent`, `Deferred`, `Implemented`, `Verified`, `Rejected`. Every feature ticket must name both a priority and an approval state. **A feature tagged P1 is not automatically client-approved.**

# 3. Vision, positioning, goals and non-goals

## 3.1 Public positioning

Southern Food Basket is presented as a recognizable supermarket and wholesale business serving south Trinidad. Messaging should make available: the organization's identity and values, branches, department offerings, promotions, events and job opportunities. Brand copy such as “Fresh finds. Southern roots.” is **conceptual**, requiring approval rather than being treated as established brand language.

## 3.2 Primary and secondary user jobs

**Primary:** “I want to find a suitable Southern Food Basket job, apply with documents, and understand what happens next.”

**Secondary:** “I want to find current public specials, branch details, company information or promotions, and optionally join the newsletter.”

**Restricted promotional:** “I have an exclusive code or account-only special; I need a profile so I can view or claim it.”

**Internal:** “I need controlled access to staffing, recruitment, my work information or published promotions, based on role.”

## 3.3 In-scope capabilities

- Publicly accessible homepage, About/heritage, departments, store finder, store detail pages, promotions, events/news, careers and legal/help pages.
- Accessible navigation, dynamic editorial content, content scheduling, CMS roles and asset optimization.
- Job-listing search/filter, job-detail pages, application account, draft/save, uploads, submission and candidate status tracking.
- HR review, applicant state handling, documents, communication templates, notes, access controls and audit logging.
- Guest newsletter signup, subscription preference management, consent evidence and list hygiene.
- Customer accounts for restricted specials; personal profile and unique identifier; controlled promo-code claim/redeem model if approved.
- Staff dashboard foundation with access to relevant shifts/pay information **only if a verified authoritative data source exists**; otherwise explicit integration/placeholder scope.
- Store administrator content publishing, branch-scoped permissions, scheduled promotions and approval options.
- Performance, security, SEO, accessibility, monitoring and regression protections.

## 3.4 Explicit non-goals

- E-commerce basket, payment collection, fulfillment/delivery, shopping checkout.
- Real-time product stock, price accuracy promises without verified publication dates, complete product catalog.
- Full payroll engine or authoritative payroll calculation.
- In-house loyalty ledger, points accrual, reward redemptions or POS integration at launch.
- AI shopping concierge as a release feature.
- Automatic employment decision-making or scoring of candidates using AI.
- Bulk unsolicited marketing to existing application records or imported Google Form contacts.
- Unverified company facts, speculative promotions, third-party brand imagery without rights.

# 4. Personas, roles and access principles

| Persona | Key need | Authentication | Scope |
|---|---|---|---|
| Guest visitor | Understand brand, offers and stores | None | Published public content |
| Newsletter subscriber | Weekly specials via email | No account; verified/consented subscription | Own preferences/unsubscribe |
| Promotional member | Restricted offer, code, identity | Customer account | Own profile/eligible offers |
| Job seeker / applicant | Apply and track status | Applicant account | Own submissions and messages |
| Employee | Shifts, relevant personnel information | Provisioned staff login | Own assigned data |
| Recruiter / HR reviewer | Manage hiring cases | Authorized staff identity | Assigned applications |
| HR administrator | HR operations/training/hiring oversight | Authorized HR identity | Approved workforce and recruitment scope |
| Store content administrator | Manage specials/posts for permitted branches | Authorized staff identity | Assigned branches/campaigns |
| Platform administrator | Access configuration, grants and audit | Strictly privileged and MFA-protected | Narrowly delegated admin tasks |
| Content approver | Approve or reject publication | Authorized staff identity | Assigned content scope |

**Multi-role identity:** The same human may be a customer and applicant. Entitlements are scoped memberships, not an exclusive one-role flag. Employee privileges must be provisioned/verified separately from consumer signup. Possession of a company-domain email is an eligibility signal, never sufficient authorization by itself.

## 4.1 Access invariants

- Every protected server operation checks role, tenant/branch scope, object ownership and action authorization.
- Hiding a menu item does not constitute access control.
- Applicant data must never be visible to regular store content administrators.
- Public campaign data must never leak draft information or other users' codes.
- Staff payroll/shift information must be inaccessible to public accounts.
- Organization account grants are auditable, revocable and time-bound where feasible.
- Sensitive role elevation requires administrator approval and reauthentication/MFA.

# 5. Experiences, information architecture and route map

## 5.1 Five experiences

1. **Public website + lightweight customer profile**, customer-facing branding and promotions.
2. **Applicant portal**, candidate tasks and application lifecycle.
3. **Staff dashboard**, employee-specific information.
4. **HR dashboard**, recruiting and authorized people operations.
5. **Store administration dashboard**, branch content and campaign publishing.

## 5.2 Logical route architecture (illustrative, not a migration mandate)

```text
Public site (domain TBD)
/
/about
/departments
/specials
/specials/[slug]
/stores
/stores/[slug]
/events
/events/[slug]
/careers
/careers/[job-slug]
/newsletter/preferences
/account/sign-in
/account/register
/account/profile
/account/offers
/privacy /terms /accessibility /contact

Applicant experience (same app or protected sub-app, TBD)
/applicant
/applicant/applications
/applicant/applications/[id]
/applicant/documents
/applicant/messages
/applicant/profile

Separate operations app (e.g., ops.[approved-domain], decision pending)
/staff
/staff/shifts
/staff/pay
/staff/profile
/hr
/hr/jobs
/hr/applications
/hr/applications/[id]
/hr/training
/store-admin
/store-admin/specials
/store-admin/campaigns
/store-admin/locations
/store-admin/media
/admin/users
/admin/roles
/admin/audit
```

## 5.3 Navigation rules

- Guests see public sections and a contextual **Sign in** entry; careers and restricted deals provide just-in-time signup.
- Logged-in promotional users see **Profile**, not **Dashboard**.
- Logged-in applicants see **Applicant portal**.
- Authorized employees see **Staff dashboard**; HR and store administrators see corresponding modules.
- For multi-role accounts, present a clearly labeled account/role switcher, not a confusing automatic redirect.
- Operational applications can navigate externally from the public domain, with secure session handoff or independent SSO as authorized.
- Global mobile navigation should not hide careers or locations inside complex animations.

## 5.4 Navigation fallback and progressive enhancement

- Screen readers and keyboard users can bypass decorative entrance animation via “Skip the welcome animation.”
- Motion is never a prerequisite to accessing page content.
- All public URLs have meaningful metadata, permanent slugs, canonical handling, not-found behavior and direct link support.

# 6. End-to-end user journeys

## 6.1 Career application

`Guest → Careers → Filter jobs → View job → Apply → Sign in / Create applicant account → Complete form → Upload docs → Review → Submit → Confirmation → Applicant portal → Track status → Receive notifications → Follow next action`

**Error/edge cases:** expired vacancy, role closed mid-application, duplicate submission, unsupported file, interrupted upload, existing account with different role, email verification, accessibility submission, HR request for revised documentation, withdrawal.

**Required behavior:** guest can see full opportunity information before registering; applicant can save and resume; final submission generates immutable versioned application snapshot; applicant receives a reference ID; HR sees a timestamped event; notification failure does not cancel stored submission.

## 6.2 Weekly-specials discovery

`Guest → Specials → Filter by category / branch / active date → Open deal → Read validity, restrictions and eligible locations → Optionally visit branch/get directions → Optionally subscribe to weekly newsletter`

**No login required for public specials.** If a special is marked restricted, show clear eligibility and prompt registration only when viewing/claiming restricted details as configured.

## 6.3 Exclusive promotional offer

`Guest receives link/code → Offer landing → Clear offer eligibility and expiry → Sign in/register → Confirm eligibility → View/claim assigned code → Present code/QR in store if supported → Record claim/redemption when integrated`

**Critical:** If no POS validation or redemption integration exists, do not claim automatic in-store redemption. Support a manual policy or phase-gate feature. Prevent guessing codes, replay and arbitrary ID enumeration.

## 6.4 Newsletter subscription

`Guest → Email entry → Granular marketing consent disclosure → Submit → Verification/confirmation workflow → Active subscription → Weekly campaign → Preference center → Unsubscribe`

**No account required.** Do not automatically add job applicants or users who merely create profiles to marketing lists.

## 6.5 Store publishing

`Store admin → Authorized ops login → Draft promotion → Upload artwork → Apply approved banner template → Assign branch/category/date → Preview mobile/desktop → Submit for approval if configured → Schedule/publish → Monitor → Expire/archive → Audit history`

## 6.6 Applicant review

`HR login → Assigned queue → View application and documents → Add private notes → Change internal stage → Approve candidate-facing status/message → Notify applicant → Request documents/interview → Close case → Apply retention policy`

**Never show blunt “Not Hired” messaging as a default UI status.** Use respectful public copy and, for final decisions, an approved notification/letter. “Deferred” must describe an actual deferred decision, not disguise a rejection.

# 7. Functional requirements: public corporate website

## 7.1 Homepage (WEB-001 to WEB-014)

| ID | Requirement | Priority | Definition of successful behavior |
|---|---|---|---|
| WEB-001 | Grand Entrance visual | P0 | Immersive hero renders consistently across supported viewport sizes |
| WEB-002 | Hero seam correction | P0 | No sky/cloud seam or visible compositing break in tested motion loop |
| WEB-003 | Entrance skip control | P0 | Mouse, touch, keyboard and screen-reader users can bypass entrance |
| WEB-004 | Hero copy/CTAs | P1 | Prominent Careers, Specials and Stores pathways; copy approved |
| WEB-005 | Who We Are | P1 | Approved company overview, values and story with quality imagery |
| WEB-006 | Departments Option E | P1 | Clean scannable category cards; no cumbersome visual density |
| WEB-007 | Specials preview | P1 | Published current deals with accurate validity and route to listings |
| WEB-008 | Locations preview | P1 | Exactly approved published branches, no fictional store info |
| WEB-009 | Events/news preview | P1 | Published timely events and notices, graceful empty state |
| WEB-010 | Careers preview | P0 | Current opportunities and link to all jobs; visible on mobile |
| WEB-011 | Global navigation | P0 | Consistent desktop/mobile menus and role-sensitive access entry |
| WEB-012 | Footer and trust | P0 | Correct legal/business status; working contact, policy links |
| WEB-013 | Performance fallback | P0 | Text/CTAs remain functional if hero animation fails or disabled |
| WEB-014 | Editorial polish | P1 | Approved copy, clean hierarchy, aligned grids, no placeholders |

**Homepage acceptance scenarios:**

- **Given** a 320px mobile viewport **when** the site loads **then** there is no horizontal overflow, overlapping CTA or unusable motion layer.
- **Given** reduced motion is enabled **when** the visitor opens the homepage **then** a static meaningful hero appears and all CTAs work.
- **Given** a promotional campaign ends **when** its expiration passes **then** it is absent from active specials, including homepage cards.
- **Given** the Careers CTA is selected **then** the visitor reaches open jobs without authentication.

## 7.2 Department directory (WEB-020 to WEB-026)

- Display department name, approved category imagery, concise description and optional current specials.
- Follow Option E clean directory composition; prioritize readability over experimental interactions.
- Department links must resolve to informational/category pages or filtered specials, not imply a live inventory system.
- Branch-specific availability language must not be inferred from category presence.
- Accessible cards, sensible empty states, search/filter only if content scale warrants them.
- Admin-managed ordering and publication status; no developer required for simple text/image changes.
- **Done:** all approved departments appear across devices, labels and images are approved, cards are keyboard navigable, no inventory claim, content editable.

## 7.3 Store finder and location details (WEB-030 to WEB-039)

- Responsive store directory with readable address, operating hours, contact number, images, map link and directions CTA.
- A dedicated page for each approved branch; branch-specific photographs and local specials where supported.
- Concept map: zoom/focus to **southwest Trinidad**, click pins for a concise store card; verify geocoding and exact store coordinates before publication.
- Accessible synchronized text list is the primary fallback for map API failure, reduced bandwidth and keyboard use.
- Verify operational hours/phones with client; external Google Maps values are preliminary and may become stale.
- Show last-updated date where useful; support holiday exceptions if content available.
- Address ambiguous maps data and duplicate branch names by approved canonical branch IDs.
- Never require geolocation permission for basic store discovery.
- **Done:** each approved branch can be found, opened and navigated to by keyboard/touch; location details have provenance and approval; map failure degrades to working list.

## 7.4 About, heritage, values and events (WEB-040 to WEB-049)

- Editable About page with approved history and mission, actual business claims, values and photography.
- Editorial styling inspired by creative references without copying external website designs.
- Events content model with date/time/location, publication dates, status, image, related branch and CTA.
- Future events vs archived events automatically distinguishable by dates; event times use Trinidad timezone.
- News/articles support rich text with safe sanitization, metadata, image alt text, draft and scheduled publication.
- No unverified brand heritage claims or invented event calendar.
- **Done:** content is accurate, client-signed, accessible and CMS-managed with meaningful empty/archive states.

# 8. Recruitment and applicant portal

## 8.1 Job listing system (REC-001 to REC-012)

- List approved open roles with title, location(s), department, employment type, opening/closing date, summary and application CTA.
- Filters: branch, department and type when data warrants; search by title/keyword.
- Job details: responsibilities, requirements, application steps, required documents, closing policy, privacy notice and contact guidance.
- HR-authorized users create, edit, duplicate, schedule, publish, pause, close and archive jobs.
- Stable job IDs, unique slugs, version history and indexed public pages.
- Closing a role disables new submissions but preserves candidate access to submitted applications.
- Hiring deadlines are evaluated in declared local timezone; show explicit date and time when deadline sensitive.
- No salary disclosure claim until HR approves policy; prototype wording must be reviewed.

## 8.2 Candidate identity and application form (REC-020 to REC-038)

- Registration required at point of **Apply**, not for browsing jobs.
- Email verification, account recovery, anti-abuse protections and terms/privacy acknowledgment.
- Application fields configurable by approved job/form definition: contact, location, education, work experience, availability, role-specific questions, optional CV and supporting materials.
- Collect no irrelevant protected or excessive personal information by default.
- Form validation inline, accessible, clear and preserves non-sensitive drafts.
- Save/resume: autosave or explicit save, clear draft-state indicator, interrupted network recovery.
- Document upload: allowlisted types and sizes, scanning, safe storage, private signed retrieval, optional replacement by version.
- Duplicate rules: same person and same job can resume/withdraw/reapply only per approved business policy.
- Submission confirmation: reference ID, timestamp, email receipt if subscribed to transactional emails (not marketing consent), next-step statement.
- Applicant can view submission summary, upload requested documents, update contact data, withdraw when permitted and read messages.
- Status changes must be recorded with actor, time, reason, prior/new values and notification outcome.

## 8.3 Applicant-facing status model (REC-040)

| Internal stage | Candidate-facing label (suggested) | Trigger | Communication behavior |
|---|---|---|---|
| draft | Draft | Applicant saved but not submitted | No HR notification |
| submitted | Application received | Form submitted and validated | Transactional receipt |
| screening | Under review | HR starts screening | Optional update |
| documents_requested | Action required: documents | HR requests missing documents | Clear instructions and due date |
| interview | Interview stage | Authorized HR scheduling | Details by approved channel |
| on_hold | Application on hold | Legitimately deferred decision | Neutral explanation if approved |
| offer | Offer stage | Formal approved offer workflow | Confidential communication |
| hired | Successful application | Hiring finalization | Next steps, secure onboarding |
| declined | Application closed | Authorized HR final decision | Approved courteous letter, not “Not Hired” badge |
| withdrawn | Withdrawn | Candidate or authorized HR action | Confirmation |
| closed | Position closed | Closure without selection | Approved contextual message |

**State machine rules:** protected transitions only; illegal transitions rejected by server; applicant never controls HR decision; a final-state reopening requires HR audit; candidate messages remain coherent with internal states; “Deferred” must not be used as a euphemism for declined. The final public vocabulary requires HR sign-off.

## 8.4 HR intake and review (REC-050 to REC-068)

- Queue/table with authorized filters, job, location, stage, age, updated date, assignment and missing documents.
- Candidate profile detail with submitted version, private documents, contact, timeline, reviewer assignment and notes.
- Private notes do not appear in applicant UI or outbound notifications.
- Template-based status communications requiring preview and permission to send.
- CSV export is permission-gated, logged and scoped; restrict sensitive columns.
- Avoid automated hiring/rejection decisions and biased ranking by inferred protected attributes.
- Data retention and deletion workflow tied to approved HR/legal retention schedule.
- **Done:** complete end-to-end test from guest job discovery to HR decision and applicant notification, with strict ownership and access tests.

# 9. Promotional engagement and customer profiles

## 9.1 Promotional content model (MKT-001 to MKT-016)

Support **weekly specials** and **flash sales** as different campaign types, plus editorial evergreen promotions. Each campaign stores: ID, title, description, branch scope, optional department, visible price/discount information when client verified, hero/card artwork, start/end timestamps, timezone, disclaimers, eligibility, audience, promotion status, priority, landing destination, CTA, creation and approval metadata.

- Public weekly specials visible without login.
- Restricted specials visibly labeled with eligibility and require signup/login only to access restricted benefits/details.
- Dates control future/active/expired status server-side, including daylight-saving-independent Trinidad local times.
- A rush-style flash banner is a **visual inspiration**, not a copy of any other website.
- Promotional cards have reusable templates: choose approved media; overlay offer labels, pricing/legal copy and correct brand colors; manual preview and cropping controls.
- External image upload must be validated, optimized and moderated for rights.
- Promotional details include validity date, participating branches and relevant terms; don't imply stock guarantee.
- Role permissions define who can draft, approve, schedule, publish, unpublish and archive.
- Empty state explains that no live specials are currently published.
- **Done:** create→preview→approve→schedule→activate→expire→archive works without source-code edits and is audit logged.

## 9.2 Account-creation policy (MKT-020)

**Mandatory accounts only for:**

1. A person applying for a job, so they can track status and supply documents.
2. A person accessing an account-restricted special, specific discount or promo code.

**Not mandatory for:** browsing brand content, branches, departments, events, careers/job details, public specials and weekly newsletter signup.

**Do not use generalized registration gates to collect marketing data from every visitor.** Instead use prominent but optional email signup and clear exclusive-offer value propositions.

## 9.3 Customer profile (MKT-025 to MKT-036)

- Fields: name and verified email required; phone and birthday optional or purpose-specific after business/legal review; preferred branch optional.
- Birthday deals require a distinct eligibility rule, validity window, rate limiting and communication preference.
- Unique internal account ID created; optional QR presented only when a real in-person verification/redemption workflow is approved.
- QR should use expiring/rotatable opaque token rather than encoding email, phone or date of birth.
- Profile supports contact editing, notification preferences, consent history view, account deletion/request flow and secure session management.
- No customer dashboard with operational analytics, scores or empty loyalty functionality at launch.
- Multi-role members can transition between personal profile and applicant portal without duplicating identity.

## 9.4 Newsletter subscription and campaigns (MKT-040 to MKT-057)

- Guest email capture form on homepage, specials and relevant footer; no login prerequisite.
- Clear disclosure of purpose, frequency and identity of sender; explicit channel-specific opt-in where applicable.
- Maintain a consent ledger: actor, email/phone, purpose, wording version, capture source, timestamp and opt-out history.
- Double opt-in or comparable verification policy recommended for list quality; business/legal approval required.
- Email provider integration with templates for weekly specials, product/service highlights, branch-specific offers, events and birthday campaigns.
- Separate transactional application notices from promotional email and SMS.
- List segmentation only from consented fields and approved lawful data; no HR application-based profiling for marketing.
- Publishing schedule, preview, test-send, audience estimate, unsubscribe link, suppression list and send audit.
- Bounce/spam complaint processing and automated suppression; campaign failure does not affect live site.
- Do not promise Microsoft integration until exact Outlook/Microsoft 365/CRM requirement is confirmed. Possible uses: authenticated sending, Outlook distribution, Microsoft 365 staff account provisioning.

## 9.5 Restricted code lifecycle (MKT-060 to MKT-076)

Define two supported modes subject to integration:

- **Display/claim only:** account sees a code/QR with terms; redemption is recorded manually if store POS is not integrated.
- **Validated redemption:** unique code or token validated by a trusted POS/scanning service, with transactional one-time claim/redemption tracking.

Server-side code entitlements must validate active period, branch scope, customer eligibility, use limit, global cap and repeat-claim policies. Avoid predictable codes and client-only redemption state. Lock against concurrent double-redemption with atomic transaction constraints when enabled. Capture audit events without exposing sensitive profile data in public URLs.

**Launch gate:** If no verified redemption mechanism exists, the public copy must not say “instantly redeem in any store.”

## 9.6 Future loyalty compatibility (MKT-FUTURE)

The system shall reserve stable identity IDs, external identifier mappings, consent provenance and event interfaces to support an **existing third-party loyalty program**. Do **not** create a local loyalty balance as a fake placeholder. Investigate current provider owner, POS integrations, existing membership identifiers, data-sharing rights, reconciliation, deduplication and migration permissions. A pre-existing Google Form contact list is not automatically a legal or technical source for newsletter enrollment.

**Future proofing definition:** exportable data dictionary, external identity mapping, versioned integration contracts, approved data retention policy and provider discovery summary. Actual points/rewards integration is a separate project.

# 10. Staff dashboard

## 10.1 Scope and dependency

The staff dashboard must show **only verified authoritative employee information**. Requested concepts include shifts, pay and cumulative data. The relevant HRIS/payroll/scheduling system is not identified, so implementation must be staged.

| ID | Capability | Priority | Dependency |
|---|---|---|---|
| STF-001 | Provisioned staff sign-in and access grants | P0 | Directory/HR approval |
| STF-002 | Employee home and profile | P1 | Verified employee record |
| STF-003 | Shift schedule / upcoming shifts | P1 conditional | Approved source of truth; no simulated production data |
| STF-004 | Pay/earnings summary | P1 conditional | Authorized payroll integration, legal/privacy validation |
| STF-005 | Cumulative work data | P2 | Definitions, source and approval |
| STF-006 | Training links/acknowledgments | P2 | HR module |
| STF-007 | Announcements and policies | P1 | Admin-managed content |

**Done for initial staff access:** employees can sign in, reach only permitted views, see real authorized data or an explicitly unavailable module, and cannot view other employees' records. Do not mark payroll integration done until reconciled against an authoritative source.

# 11. HR dashboard

## 11.1 Modules

- Recruiting operations: job creation, application queue, status updates, reviewer assignment, private notes, document requests and candidate communications.
- Workforce directory: minimally necessary employee records and provisioning management, subject to HR approval.
- Training: manage required courses, assignment/completion evidence, reminders and learning materials if content is supplied.
- Reporting: position-level funnel, applications by stage, backlog, time-to-review and basic operational metrics.
- Templates: standard approved communications, public job fields and applicant help content.
- Access: role-based assignment for HR reviewers vs HR administrators; branch scoping where applicable.

## 11.2 HR finished criteria

- A permitted HR reviewer can complete the defined application lifecycle end-to-end.
- Unauthorized users cannot access HR records by guessing URLs or API IDs.
- Candidate-facing messages are reviewed, accurate and consistently delivered or visibly queued for retry.
- Every state change and document access is attributable to an authenticated actor.
- Retention and secure disposal of employment applications is documented and implemented per approved policy.
- Training module is considered finished only if content ownership, assignment rules and evidence of completion are defined. Otherwise it remains an explicit phase-2 item.

# 12. Store administration dashboard

## 12.1 Admin capabilities

| ID | Capability | Priority | Acceptance |
|---|---|---|---|
| ADM-001 | Role-scoped login | P0 | Branch membership validated on server |
| ADM-002 | Promotional calendar | P1 | Weekly/flash schedules visible per permitted branch |
| ADM-003 | Campaign composer | P1 | Templates, media, text, disclaimer, valid date, preview |
| ADM-004 | Draft/publish workflow | P1 | Configurable approval and audit |
| ADM-005 | Branch information | P1 | Approved editors update store metadata with review |
| ADM-006 | Events/news publishing | P1 | Draft, preview, schedule, archive |
| ADM-007 | Newsletter campaign requests | P1 conditional | Only authorized marketing roles can send |
| ADM-008 | Analytics | P2 | View clicks/engagement for authorized branches |
| ADM-009 | Media library | P1 | Search, reuse, alt text, rights metadata |
| ADM-010 | User/role admin | P0 platform admin | Least privilege, MFA, audit |

## 12.2 Content governance

A promotion's **author** may differ from **approver**. Set an approval threshold for high-visibility campaigns, brand-affecting imagery or advertised prices. Flag changes to active campaigns. Preserve revisions to restore accidentally overwritten media/content. Admin surfaces prioritize dense, legible UI over decorative motion.

# 13. Cross-platform authentication, authorization and security

## 13.1 Identity decisions

- Audit existing auth before selecting Clerk, Auth.js, Supabase Auth or other provider; do not duplicate or migrate users without mapping plan.
- Distinguish `identity`, `profile`, `membership`, `authorization grant` and `subscription` in the domain model.
- Consumer passwordless sign-in may reduce friction; applicant sessions require reliable recovery and data protection.
- Staff, HR and store admins must be explicitly provisioned, ideally via verified organization identity and MFA.
- Company email domains alone do not create elevated privileges.
- Session handling across public and ops sites must guard redirect, CSRF, fixation, cross-origin leakage, token storage and logout propagation.

## 13.2 Security acceptance requirements

- Enforce TLS; secure HttpOnly cookies where applicable; CSP, HSTS and safe headers according to deployment environment.
- Protect forms from spam, brute force and credential stuffing; rate-limit auth, coupon claim, uploads and newsletter endpoints.
- Private documents in protected storage with short-lived authorized access; virus/malware scan and file-type verification.
- Role tests include horizontal/vertical privilege escalation and branch scoping.
- Encryption at rest via selected platform, secure secrets management and no credentials in repository.
- Audit critical actions (grant/revoke, HR status, document access, campaign publish, code redemption).
- Minimize personal information; document retention, export and deletion workflows.
- Run dependency/security scans in CI; define incident response and breach escalation.
- **Done:** no unresolved critical/high security defects accepted into production without documented risk disposition and approval.

# 14. Data model, relationships and migration readiness

## 14.1 Proposed conceptual schema (implementation naming not mandated)

```text
Identity 1---N RoleGrant N---1 Organization/Branch
Identity 1---1 CustomerProfile
Identity 1---1 ApplicantProfile
Identity 1---N Application N---1 JobPosting
Application 1---N ApplicationDocument
Application 1---N ApplicationStatusEvent
Application 1---N ApplicantMessage
Identity 1---N ConsentEvent
Identity 1---N ExternalIdentityLink
NewsletterSubscription 1---N ConsentEvent (by email/contact identity)
Branch 1---N Promotion
Branch 1---N StorePhoto
Branch 1---N Event
Promotion 1---N PromotionAsset
Promotion 1---N PromoCodeBatch/Entitlement
Entitlement 1---N RedemptionEvent (future or integration-dependent)
ContentRevision N---1 PublishableResource
AuditEvent N---1 Actor(Identity)
```

## 14.2 Suggested entities and essential fields

| Entity | Essential fields / constraints | Security/retention considerations |
|---|---|---|
| identities | UUID, verified emails, auth-provider IDs, timestamps | Canonical identity mapping |
| role_grants | identity_id, role, branch_id nullable, granted_by, expiry/revocation | Least privilege; audit |
| customer_profiles | identity_id, display name, optional phone/DOB/preferred branch | Sensitive field minimization |
| applicant_profiles | identity_id, legal/contact details required for application | HR-bound privacy separation |
| jobs | ID, slug, status, branch, department, dates, content version | Only published jobs public |
| applications | ID, identity_id, job_id, stage, submitted snapshot, timestamps | Applicant ownership/RLS |
| application_documents | ID, application_id, storage ref, checksum, mime, scan status | Private, versioned, expiring URLs |
| application_events | ID, application_id, prior/new stage, actor, visibility, reason | Immutable audit trail |
| branches | ID, approved address/hours/coords, contacts, status | Provenance and review |
| promotions | ID, campaign type, audience, branch, validity, artwork, status | Public vs restricted isolation |
| promo_entitlements | ID, identity, campaign, token hash, claim/redeem status | Atomic one-time rules |
| newsletter_subscriptions | normalized address, status, preferences, source | Consent verification and suppression |
| consent_events | contact, channel, purpose, wording version, time, evidence | Append-only audit |
| external_identity_links | identity_id, provider, external_id, match confidence/approval | Future loyalty; dedup controls |
| media_assets | storage ref, dimensions, license, alt text, checksum | Rights/provenance |
| audit_events | actor, resource, action, before/after safe summary, time | Access-restricted; no secrets |

## 14.3 Data constraints

- Prefer UUIDs or opaque IDs to prevent enumeration; enforce relational integrity and uniqueness.
- Normalize contact identifiers carefully; never silently merge two identities based on an unverified phone number.
- Separate operational data from marketing consent. A candidate's job data must not automatically populate campaign audiences.
- Version published content; do not mutate historical submitted application snapshots after submission.
- Define deletion and archival policy with business/legal stakeholders before collecting new data.
- Migrations must be versioned, reversible where feasible and tested on copies with redacted/anonymized records.

## 14.4 Importing Google Form and loyalty records

**Pre-import checklist:** identify owner, export schema, collection notice, consent/purpose, duplicates, records age, permitted uses, legal retention, phone/email verification, provider identifiers and contractual permissions. Produce a dry-run duplicate report and sample mapping; require explicit approval before write. Never infer marketing consent merely because personal data exists in a form.

# 15. Content management, photography and media pipeline

## 15.1 Content inventory

Create a structured spreadsheet with page/section, source, draft copy, approver, owner, status, image ID, rights, timestamp and publish readiness. Every homepage/store/promotion/careers text block must have an identified owner. Use real brand materials and approved proof points.

## 15.2 Initial ~25-shot photo brief (proposed shot list; adjust with client)

| # | Subject | Composition/use |
|---|---|---|
| 01 | Main exterior hero | Wide daytime facade, clean sky, brand signage |
| 02 | Secondary exterior angle | Architectural context and entrance |
| 03 | Store entrance close-up | Doors, recognizable welcome visual |
| 04 | Employee welcome/group | Approved uniforms and consented people |
| 05 | Produce wide aisle | Bright fresh display |
| 06 | Produce detail | Color-rich close-up fruit/vegetables |
| 07 | Bakery wide | Department ambient shot |
| 08 | Bakery detail | Fresh baked goods close-up |
| 09 | Meat/seafood display | Hygienic, accurate presentation |
| 10 | Dairy/chilled aisle | Bright merchandising |
| 11 | Pantry aisle | Depth and wayfinding |
| 12 | Household goods | Category context |
| 13 | Wholesale stock/display | Wholesale identity |
| 14 | Cashier/service interaction | Consent, service positioning |
| 15 | Trolley/basket detail | Brand and texture |
| 16 | Specials promo surface | Space for graphic overlays |
| 17 | Weekly feature item A | Product isolated with rights/brand checked |
| 18 | Weekly feature item B | Product isolated with rights/brand checked |
| 19 | Weekly feature item C | Product isolated with rights/brand checked |
| 20 | Branch 1 exterior | Location page identifier |
| 21 | Branch 2 exterior | Location page identifier |
| 22 | Branch 3 exterior | Location page identifier |
| 23 | Branch 4 exterior | Location page identifier |
| 24 | Branch 5 exterior | Location page identifier |
| 25 | Team/culture image | About and careers storytelling |

**Supplementary assets:** approved logo variants, iconography, permitted brand textures, store interior panoramas and exterior reference photos for optional AI-assisted cartoon-style illustrative experiments. AI imagery must be labeled internally as generated and not misrepresent real premises or products.

## 15.3 Production standards

- Capture raw/high-resolution masters; deliver licensed web exports in AVIF/WebP with appropriate fallback and responsive sizes.
- Prefer natural/bright daylight, true product colors, consistent white balance and legible signage.
- Compose with safe-crop zones for 16:9 hero, 4:5 campaign, square card and narrow mobile.
- Store original, edited master, derivative sizes, photographer, shoot date, rights and model releases.
- Photos of identifiable staff/customer subjects require appropriate permission and brand approval.
- No distorted logos, fabricated price labels or falsely depicted locations.
- Editorial approval workflow includes subject truthfulness, legal use, alt text and performance optimization.

# 16. Brand, design system, motion and accessibility

## 16.1 Brand strategy

Keep the approved existing color palette. Extract actual token values from brand/logo files and current repository; do **not** invent authoritative brand hex codes. Distinguish primary brand hues, neutrals, semantic status colors and contrast-safe variants. Preserve logo clear-space and legibility.

## 16.2 Design tokens

- Color: surface, elevated surface, text-primary, text-secondary, border, brand-primary, brand-secondary, accent, error, warning, success, focus ring.
- Typography: display/editorial, body/UI, caption/legal, numeric/tabular; responsive clamp scales and readable line lengths.
- Spacing: consistent 4/8-based scale adapted to approved comps; content container and gutters.
- Shape: border radius by role, surface elevations, image crop ratios, icon stroke style.
- Motion: duration small/medium/hero, easing, stagger limits, transition priorities, reduced-motion variants.
- Components: buttons, cards, chips, search, form fields, stepper, status badges, modals, command menus, disclosures, tables, dialogs, side navigation, carousels only when accessible.

## 16.3 Homepage design principles

1. Hero remains memorable but must lead to a clear business action quickly.
2. Recruitment CTA prominent enough to reflect strategic priority.
3. Promotional banners and weekly specials are highly scannable, not full ecommerce inventory.
4. Photography is primary proof of business identity; motion supports the story.
5. Mobile visitors get fast access to Specials, Stores and Careers.
6. Editorial About sections convey heritage without overwhelming practical navigation.
7. Consistent transitions between sections and no visible hero compositing seams.

## 16.4 Animation engineering

- Prefer transform/opacity, composited layers and controlled animation budgets.
- Prevent visual seams through seamless asset coverage, continuity, masking/cropping and loop testing.
- Avoid expensive blur/filter stacks and layout-triggering frame updates on mobile.
- Defer offscreen effects; lazy-load nonessential animations; favor static poster fallback when constrained.
- Honor `prefers-reduced-motion`, `save-data` where accessible and animation-free error fallback.
- Distinguish decorative motion from essential feedback such as form success and navigation loading.

## 16.5 Accessibility standards

Target **WCAG 2.2 AA** for public and portal experiences, with documented exceptions and remediation ownership. Implement semantic headings/landmarks, skip link, labeled inputs, errors linked to fields, logical focus management, minimum hit targets, keyboard support, screen reader announcements, sufficient color contrast, alt text and captioning for meaningful media. No auto-moving carousel without pause controls. Map must have equivalent textual store navigation.

# 17. UI reference library and component adoption matrix

**Reference philosophy:** sources inform transferable patterns and technical approaches, not wholesale copying of artwork, layout or intellectual property. Verify current package APIs, accessibility, licensing and maintenance before adoption.

## 17.1 Seven creative websites

| Resource | URL | Proposed application | Caution |
|---|---|---|---|
| Danilo De Marco | https://www.danilodemarco.com | Editorial brand storytelling and typography | Keep performance practical |
| Niccolò Miranda | https://www.niccolomiranda.com | Heritage/editorial narrative | Avoid sacrificing legibility |
| bleibtgleich.dev | https://bleibtgleich.dev | Exploratory navigation concepts | Do not obstruct task flow |
| 2xa Studio | https://2xa.studio | Hero art direction and composition | No direct visual copying |
| Thibaut.cool | https://www.thibaut.cool | Microinteraction/playfulness | Touch/keyboard parity |
| Bulbs by Simon Dupety | https://bulbs.simondupety.com | Lighting/experimental effects | Use sparingly and with reduced motion |
| Ollivere | https://ollivere.webflow.io | Page transitions and rhythm | Verify responsiveness |

## 17.2 Fifteen GitHub resources

| # | Resource | URL | Adoption tier | Candidate use |
|---|---|---|---|---|
| 8 | shadcn/ui | https://github.com/shadcn-ui/ui | Foundation | Accessible composable UI |
| 9 | React Bits | https://github.com/DavidHDev/react-bits | Selective | Hero text and reveal effects |
| 10 | Magic UI | https://github.com/magicuidesign/magicui | Selective | Promotional visual polish |
| 11 | Motion Primitives | https://github.com/ibelick/motion-primitives | High | Transition/microinteraction patterns |
| 12 | Kokonut UI | https://github.com/kokonut-labs/kokonutui | Selective | Buttons, cards, interactive UI |
| 13 | SmoothUI | https://github.com/educlopez/smoothui | Evaluate | Card/detail interactions |
| 14 | coss UI / Origin UI | https://github.com/cosscom/ui | High | Dense navigation and admin UI |
| 15 | ShadcnSpace | https://github.com/shadcnspace/shadcnspace | Evaluate | Responsive blocks/dashboard |
| 16 | Vibeset | https://github.com/Mun1to/Vibeset | Tooling | Component registry discovery |
| 17 | 21st MCP | https://github.com/21st-dev/magic-mcp | Tooling | Agent-assisted discovery |
| 18 | Vercel AI Elements | https://github.com/vercel/ai-elements | Future only | AI interface primitives |
| 19 | LocalMode AI | https://github.com/LocalMode-AI/LocalMode | Future only | Local-first AI exploration |
| 20 | Awesome shadcn/ui | https://github.com/birobirobiro/awesome-shadcn-ui | Index | Discover component alternatives |
| 21 | Vercel AI Chatbot | https://github.com/vercel/ai-chatbot | Future only | Future assistant architecture reference |
| 22 | Magic UI MCP | https://github.com/magicuidesign/mcp | Tooling | Search/reuse animation components |

The prior reference library mentions a potential AI Elements migration by late November 2026. Treat it as an **unverified, time-sensitive dependency note** and reconfirm before adopting.

## 17.3 Component selection contract

For every imported component, log: origin URL and commit/version, license and redistribution terms, accessibility behavior, bundle-size impact, dependency conflicts, visual fit, ability to theme, keyboard/touch support, maintenance owner and fallback. **No blanket installation of all libraries.** Favor internal copies of licensed small patterns where permitted over long dependency chains.

## 17.4 Three design exploration directions

- **A. Refined Grand Entrance:** preserve current visual story, fix sky seam, premium photography, light editorial motion; lowest migration risk.
- **B. Editorial Southern Heritage:** larger typography, story-led brand sections, restrained transitions; distinctive About/Careers execution.
- **C. Promotional Energy:** stronger campaign visuals, flash-sale banners and lively card motion; guard against retail-over-recruitment bias.

**Recommendation for approval:** A as structural baseline; selected editorial language from B; restrained promotional accents from C. These are proposals for review, not already approved final compositions.

# 18. Technical architecture and integration strategy

## 18.1 Repository-first rule

Before editing, inspect package manager, framework versions, routes, build scripts, component tree, CSS/tokens, assets, auth, CMS, database, storage, server routes, deployment, environment config, CI, monitoring, branch strategy and known errors. Produce a dependency map and baseline screenshots. Existing source code is authoritative for actual implementation, not necessarily for approved product behavior.

## 18.2 Preferred logical components

```text
Browser / Mobile Web
    │
    ├── Public site (SSR/SSG/ISR where appropriate)
    │      ├── Home / About / Stores / Departments / Specials / Careers
    │      ├── Guest newsletter capture
    │      └── Customer profile and Applicant portal
    │
    └── Authenticated operations app
           ├── Staff
           ├── HR / Recruitment
           └── Store admin / Content

Shared infrastructure (private services / vetted integrations)
    ├── Identity and role grants
    ├── Relational database (separate authorization boundaries)
    ├── Media/document object storage
    ├── Content management + publishing jobs
    ├── Email provider + consent/suppression management
    ├── Audit / analytics / observability
    └── Future loyalty / payroll / POS adapters (not assumed available)
```

## 18.3 Recommended engineering patterns

- Use existing Next.js/React if verified; otherwise weigh modernization cost before adopting new stack.
- TypeScript strictness for domain logic; schema validation on server and client; reusable domain DTOs.
- Use server components and caching deliberately for public content, dynamic personalized requests only where necessary.
- Separate presentation, application services, domain rules, persistence and external adapters to avoid coupled business logic.
- Strong branching, PR review and checks; migrations in small reversible increments.
- Storage service and email service should be replaceable through narrow interfaces.
- Explicit staging with production-like seeded/redacted data; do not use real applicants in demo accounts.
- Manage environment secrets through hosting secret manager; no plaintext team-shared keys.

## 18.4 Integration inventory to validate

| System | Purpose | Status | Action |
|---|---|---|---|
| Existing source repository | Source of truth for current implementation | Unknown | Inspect first |
| Existing database/auth provider | Identity/content/application records | Unknown | Trace schema and ownership |
| Vercel deployment | Prototype hosting | Public URL observed | Verify project ownership/settings |
| Email service / Microsoft ecosystem | Weekly promotions, transactionals and staff provisioning | Undetermined | Confirm exact products/permissions |
| Maps provider | Branch map and directions | Undetermined | Select with cost/terms/fallback |
| Document storage/scanning | Applicant uploads | Undetermined | Security/retention design |
| Loyalty system | Future member integration | Existing effort mentioned, unverified | Contact provider and request contracts |
| Google Forms | Pre-existing records | Data reported, not inspected | Audit provenance and consent |
| Payroll and scheduling | Staff dashboard data | Unknown | Identify authoritative systems |
| POS/coupon validation | In-store restricted offers | Unknown | Confirm if redemption in launch scope |
| Analytics/observability | Measurement and incidents | Unknown | Establish baseline |

# 19. Nonfunctional requirements and measurable service levels

**Proposed release thresholds; confirm measurement conditions after technical audit.**

| Area | Target / gate | Method |
|---|---|---|
| Responsiveness | No clipped navigation, overlapping controls or horizontal scroll at 320, 375, 390, 768, 1024, 1280, 1440, 1920px | Automated screenshots + manual QA |
| Mobile browser coverage | Latest two major Safari iOS, Chrome Android; desktop Chrome, Edge, Safari where available | Device/browser matrix |
| Accessibility | WCAG 2.2 AA target; no unaddressed critical keyboard/screen-reader blockers | axe + manual keyboard + SR checks |
| LCP | <= 2.5s at p75 measured field target for key public templates | Web Vitals instrumentation |
| INP | <= 200ms at p75 field target | Web Vitals |
| CLS | <= 0.1 at p75 field target | Web Vitals |
| Preview performance | No blocking hero load; functional page during motion fallback | Low-end device test |
| Availability | Proposed 99.9% monthly uptime objective for public site, subject to contract | Uptime monitoring |
| Errors | No unresolved release-blocking bugs; usable offline/network/error states | QA regression |
| Privacy | Consent and unsubscribe behavior verified; no cross-role data leak | Security tests |
| Content publishing | Scheduled campaign activates/expires according to T&T time | Clock/UTC boundary tests |
| Critical recovery | Backup, tested restore, rollback package and documented RTO/RPO | Recovery rehearsal |
| SEO | Correct canonical, metadata, robots/sitemap, structured data only when accurate | Crawl and metadata review |
| Observability | Errors, failed forms, failed sends, auth anomalies, deployment alerts observable | Runbook/alerts review |

Targets represent goals rather than claims about current prototype performance. Field percentiles may require traffic volume; use lab-based approximations until sufficient data exists.

# 20. Analytics, reporting and experimentation

## 20.1 Event taxonomy

| Event name | Payload boundaries | Purpose |
|---|---|---|
| page_view | Route, device class, referrer category | Traffic/engagement |
| hero_skip | Variant, device class | Hero friction |
| career_list_view | Filter selections only | Career discovery |
| job_detail_view | Job ID | Openings interest |
| application_start | Job ID | Funnel start |
| application_save | Job ID, step, no PII | Drop-off |
| application_submit | Job ID, anonymous event token | Completion |
| applicant_status_view | Stage category, no personal data | Candidate engagement |
| specials_view | Campaign ID, branch filter | Interest |
| special_claim | Campaign ID, outcome | Promo adoption |
| store_detail_view | Branch ID | Location intent |
| directions_click | Branch ID | Store traffic proxy |
| newsletter_signup | Placement, consent outcome | Acquisition |
| newsletter_unsubscribe | Channel, reason optional | List health |
| campaign_publish | Campaign ID, actor reference in admin log | Admin operations |

Do not emit names, emails, phone numbers, application contents, employment documents or raw coupon tokens to analytics platforms. Consent for cookies/tracking must match applicable requirements and chosen vendor configuration.

## 20.2 Reporting

- Weekly: careers funnel, active jobs, review backlog, published specials, newsletter growth, unsubscriptions, branch directions clicks.
- Monthly: content performance, device split, web vitals, incidents, publishing latency and applicant experience.
- KPI definitions and numerator/denominator documented before targets; do not treat page views as confirmed store visits.

# 21. Release stages, dependencies and milestones

**Stage numbering specifies dependency and acceptance, not a fixed calendar.** A six-week implementation was previously discussed in adjacent proposal work, but it must not be assumed feasible for every capability in this expanded scope. Effort, staffing, dates and commercial terms require audit and explicit client agreement.

| Stage | Major area | Outputs | Exit gate |
|---|---|---|---|
| **S0** | Discovery and safeguards | Repo audit, workflow map, route inventory, deployment/DB inventory, baseline screenshots, risk register | Critical unknowns documented, recovery branch and baseline build established |
| **S1** | Product/content/design approval | Approved IA, journey maps, brand tokens, content inventory, 3 homepage comps, media plan | Written sign-off on A/B/C direction and functional scope |
| **S2** | Design system and mobile foundation | Shared components, nav, responsive grid, auth shell, motion standards | QA matrix passes representative templates; no major overflow |
| **S3** | Public site experience | Hero, About, departments, branch pages, events, public specials | All published content source-approved; polished responsive demo |
| **S4** | Recruitment core | Jobs, applicant signup, drafts, upload, submission, portal, HR queue/status | Test candidate completes full workflow, HR processes safely |
| **S5** | Promotions and CRM | Newsletter consent, campaign CMS, weekly/flash publishing, profiles, restricted offers | Scheduled publish and consent tested; restricted access enforced |
| **S6** | Internal operations | Staff foundation, HR refinements, store admin, branch permissions | Real/approved integrations; RBAC and audit fully tested |
| **S7** | Hardening and prelaunch | Security, accessibility, performance, training, migration validation, UAT | Release checklist green or approved deferrals documented |
| **S8** | Production rollout | Backups, rollout, monitoring, smoke tests, incident/rollback plan | Stakeholder acceptance and production checks passed |
| **S9** | Postlaunch optimization | Bug remediation, analytics review, content tuning, loyalty-provider specification | Operational ownership/handover and phase-2 backlog accepted |

## 21.1 Dependencies and parallel tracks

```text
S0 Audit ──> S1 Decisions ──> S2 Shared foundation ──> S3 Public UX ──┐
                                      ├──────────────> S4 Recruitment ──┤
                                      ├──────────────> S5 Marketing ────┤──> S7 QA ──> S8 Launch
                                      └──────────────> S6 Operations ───┘

Parallel from S0: photo shoot + verified company content + loyalty discovery
Parallel after S1: brand asset production + CRM/legal review + staff integration discovery
S9 follows launch; loyalty implementation is separate authorization/project.
```

**Stage flex:** Recruitment can be developed before the public storytelling polish is complete, but the shared auth/data access design must be settled. A client demo may showcase S3 before S4-S6 are complete, provided features are honestly labeled and no broken route is presented as operational.

## 21.2 Proposed delivery packages

- **Package A: Polished client demo**: visual hero fixed, responsive homepage, specials mock content clearly labeled, department directory, store cards, recruitment flow demonstration, no fake live HR/loyalty functionality.
- **Package B: Public launch**: approved public content, public specials, locations, careers and secure application capture, with operational users able to manage core content.
- **Package C: Operational enablement**: full HR, store-admin, staff-source integrations and broader marketing automation as authorized.
- **Package D: Loyalty enablement**: provider-approved identity mapping and future loyalty functionality, separately estimated.

# 22. Definition of finished

## 22.1 Universal definition of finished (DoF)

A feature is **not finished** simply because it renders or a coding agent reports task completion. To label it **Verified**, all applicable conditions must be met:

1. **Scope:** linked requirement IDs, approved behavior, explicit non-goals and acceptance scenarios.
2. **Implementation:** deployed on a review environment; no mock data masquerading as production truth.
3. **UX:** desktop/tablet/mobile functional, loading/empty/error/success states, focus/hover/touch, responsive copy and controls.
4. **Accessibility:** relevant WCAG 2.2 AA tests, keyboard and screen-reader paths; reduced-motion alternative.
5. **Data:** validated input, ownership authorization, appropriate persistence, migration and deletion/retention behavior.
6. **Security:** least privilege enforced server-side, abuse protections, secrets secured, required logs and document privacy.
7. **Quality:** unit, integration and end-to-end tests on primary and edge cases; no critical regressions.
8. **Performance:** within agreed thresholds/budgets, including real mobile and network-constrained use.
9. **Content:** client-approved copy/prices/store facts, legally usable photography, alt text and correct metadata.
10. **Operations:** instrumentation, alerts, documentation, rollback instructions and designated owner.
11. **Review:** design review, technical review and user acceptance completed; sign-off evidence linked.
12. **Traceability:** change log, screenshots/video evidence and status of associated tickets updated.

## 22.2 Module-level DoF matrix

| Area | Must demonstrate | Evidence required | Owner of acceptance |
|---|---|---|---|
| Hero/homepage | Smooth seam-free entrance, skip, mobile rendering, clear CTA | Screen recording across viewport set, reduced-motion screenshot, performance trace | Client brand + frontend QA |
| About/brand | Accurate identity, approved heritage copy, photography | Content approval list, license records | Client marketing |
| Departments | Option E layout, accurate category linking, mobile ease | Responsive captures, content inventory | Client content + UX |
| Stores/map | Correct branches, clickable pins/list, directions, map fallback | Verified address sheet, keyboard tests, offline/map-error test | Branch owner + QA |
| Public specials | Scheduled valid deals, branch terms, no account gate | Campaign lifecycle test, expiry boundary test | Marketing/store admin |
| Exclusive offers | Auth gate, scoped eligibility, secure code model | Authorization and replay tests, agreed redemption policy | Marketing + security |
| Newsletter | Guest signup, consent proof, email delivery, unsubscribe | Consent ledger, test-send, suppress/bounce test | Marketing + privacy owner |
| Applicant portal | Account, draft, upload, submit, status, document request | E2E candidate test, state audit, authz negative tests | HR + QA |
| HR dashboard | Publish jobs, review queue, status/messaging, private notes | Role matrix tests, candidate communication QA | HR lead |
| Staff dashboard | Authorized access, genuine shifts/pay source or explicit deferred module | Source reconciliation, impersonation/authorization tests | HR/operations |
| Store admin | Draft/preview/approve/schedule/expire and role scoping | Publishing video and change audit | Marketing lead |
| Platform and data | Auth, backups, migration, monitoring, secrets | CI reports, restore drill, penetration review | Technical lead |
| Launch | All P0 gates pass, selected P1s approved, UAT and rollback ready | Signed release report + smoke test | Product owner |

## 22.3 Disqualifiers

A feature is **not finished** when any of these apply: screenshots only; no real backend for a promised workflow; silent failed submission; fake “sent” confirmations; misleading loyalty points; auth checks only in client; real applicant data exposed in demos; unseen mobile layout; broken entrance seam; unauthorized marketing capture; inaccessible form; unapproved prices/store claims; an integration placeholder described as live.

# 23. Test strategy, QA matrix and evidence requirements

## 23.1 Test layers

- Unit: eligibility, date windows, status transitions, validation, identifier generation, permission predicates.
- Integration: database constraints, auth session verification, storage, sending service, schedule workers, RLS/policies.
- E2E: guest browse, newsletter guest signup, applicant lifecycle, HR handling, store-admin publishing, restricted special access.
- Visual regression: every public page template and ops shell at target breakpoints, with animation poster/representative frames.
- Accessibility: automated audit, keyboard-only journeys, screen-reader sampling, error announcements and focus management.
- Security: IDOR, privilege escalation, token/session misuse, coupon brute force, CSRF, upload abuse, data export and secret scanning.
- Performance: lab test on low-end mobile throttling and field instrumentation after launch.

## 23.2 Required viewport and browser matrix

| Width | Scenario | Special checks |
|---|---|---|
| 320px | Small mobile | Menus, text wraps, single-column cards, no overflow |
| 375px | Common mobile | Hero legibility, recruitment CTA, input ergonomics |
| 390px | Modern mobile | Motion fallback, branch cards, special labels |
| 768px | Tablet portrait | Nav breakpoint, grid transitions, tables |
| 1024px | Tablet landscape | Sticky controls, portal tables, sidebars |
| 1280px | Small desktop | Dense internal apps, hero crop |
| 1440px | Standard desktop | Editorial rhythm, layout density |
| 1920px | Large desktop | Max container width, background coverage/seams |

Test current Safari iOS and Chrome Android as priority, plus desktop Chrome/Edge/Safari. Exact OS/browser versions recorded at test execution.

## 23.3 Golden-path release test cases

- `TC-01`: Guest can open home, skip hero, find careers in <= 3 straightforward interactions.
- `TC-02`: Guest can find a valid special and read full details without sign-in.
- `TC-03`: Guest can subscribe by email without creating a profile; unsubscribe works.
- `TC-04`: Guest cannot access restricted code until signed in; access granted only when eligible.
- `TC-05`: Guest can browse job details, create account, save draft, upload safe file and submit.
- `TC-06`: Applicant can return, view owned application status and respond to document request.
- `TC-07`: User B cannot view User A's application by editing URL or calling API.
- `TC-08`: Store admin in Branch X cannot edit Branch Y's restricted promotions.
- `TC-09`: HR reviewer can update case and candidate sees only approved public state.
- `TC-10`: Promo activated at start and hidden at expiry in Trinidad time across timezone boundaries.
- `TC-11`: Failed email provider queues/retries without losing application submission.
- `TC-12`: Unauthorized company-email holder cannot self-assign HR/admin role.
- `TC-13`: Low-motion mobile loads a stable, readable static hero.
- `TC-14`: Map provider fails; location text directory and directions links still function.
- `TC-15`: Image fail or delayed; aspect ratio preserved, no catastrophic CLS.
- `TC-16`: Client sign-off verifies no unofficial-demo footer remains in official release unless explicitly appropriate.

## 23.4 Evidence package

Every release PR must include relevant: requirement IDs, before/after screenshots, mobile video, links to preview deployment, test run logs, accessibility evidence, migration instructions, rollback steps and any unresolved deviations. A single green CI badge is insufficient sign-off.

# 24. Migration, launch, rollback and operations

## 24.1 Pre-change safeguard

Create versioned repository checkpoint, dependency lockfile, sanitized environment inventory, DB schema snapshot, export/backup where authorized, asset index, route crawl and working-flow screen recordings. Identify production hosting and admin owners before moving domains or changing credentials.

## 24.2 Incremental migration sequence

1. Audit old and new feature parity; identify modules to keep/refactor/retire.
2. Introduce design tokens/component wrappers without breaking routes.
3. Add new schema changes behind migrations and feature flags.
4. Build auth/role enforcement behind tests before exposing private portal paths.
5. Migrate content with provenance, preview and approval.
6. Dual-run or shadow-test services where applicable, but never duplicate live emails/redemptions.
7. Switch routes gradually or gate per audience; keep old route redirects.
8. Test rollback on staging with representative migration state.
9. Production launch only after final checks and named approval.

## 24.3 Launch control plan

- Freeze critical content and review all active specials with expiration.
- Smoke-test homepage, careers, guest signup, applicant submission, HR login, coupon gate, store finder and CMS publish.
- Verify canonical domain, DNS/SSL, robots/sitemap, legal documents, sender domain SPF/DKIM/DMARC, monitoring and rate limits.
- Confirm support contacts, incident escalation, release owner, data backups and restore instructions.
- Monitor errors, failed forms, campaign jobs, accessibility regressions and performance after rollout.
- Rollback trigger: auth failures, application data loss, cross-user exposure, broken mobile navigation, repeated promo mispricing, or other critical defect.

## 24.4 Operational handover

Deliver admin user guides, HR lifecycle walkthrough, content approval playbook, photo/media standards, incident response, access-provisioning policy, backup/restore procedure, dependency ownership and maintenance change log. Conduct role-specific acceptance demonstrations before handover.

# 25. Backlog, prioritization and acceptance criteria

## 25.1 Epic register

| Epic | Priority | Stage | Key dependency | Exit deliverable |
|---|---|---|---|---|
| EP-00 Repo audit and baseline | P0 | S0 | Repository access | Audit + preservation plan |
| EP-01 Brand/design system | P0 | S1-S2 | Approved brand files | Token/component system |
| EP-02 Mobile/navigation rebuild | P0 | S2 | Route inventory | Responsive accessible shell |
| EP-03 Hero/visual quality | P0 | S2-S3 | Art assets | Seam-free demo hero |
| EP-04 Corporate pages/content | P1 | S3 | Approved copy/photography | About, departments, events |
| EP-05 Store locator | P1 | S3 | Validated 5 branches | Map/list/details |
| EP-06 Public specials and CMS | P1 | S3-S5 | Promo governance | Live campaign lifecycle |
| EP-07 Applicant authentication | P0 | S4 | Auth audit | Safe signup/access |
| EP-08 Job management | P0 | S4 | HR policy | Open/close/manage jobs |
| EP-09 Application lifecycle | P0 | S4 | Data model/storage | Submit/status/docs |
| EP-10 HR recruitment dashboard | P0 | S4-S6 | Role grants | Protected reviewer workflow |
| EP-11 Guest newsletter | P1 | S5 | Consent and email provider | Subscriber capture/sends |
| EP-12 Customer profiles | P1 | S5 | Identity model | Own profile/eligibility |
| EP-13 Restricted promotions | P1 conditional | S5 | Redemption policy | Secure access/code behavior |
| EP-14 Store admin content | P1 | S5-S6 | Editorial approval | Independent publishing |
| EP-15 Staff scheduling/pay | P1 conditional | S6 | Source of truth | Authorized real data |
| EP-16 Security, analytics and hardening | P0 | S0-S8 | Every epic | Test evidence and monitoring |
| EP-17 Loyalty-provider discovery | P1 discovery | S0-S5 | Provider contact/data rights | Feasibility/integration spec |
| EP-18 Full loyalty implementation | FUTURE | Separate | Integration agreement | Not part of launch |
| EP-19 AI shopping assistant | P3 | Future | New business approval | Not part of launch |

## 25.2 Sample implementation tickets

### TICKET-EP03-01: Repair hero sky/cloud seam

**User story:** As a visitor, I see a continuous polished entrance animation on mobile and desktop without visible seams or compositing artifacts.

**Acceptance:** given each required viewport, capture at least one full loop and inspect frame boundaries; no line/break; poster fallback loads within performance budget; skip/reduced motion work; text never becomes unreadable; interaction doesn't trap scroll/focus.

**Tests:** visual capture regression, mobile Safari/Chrome, reduced-motion, slow-network, static poster.

**DoF evidence:** links to full-loop recordings, asset licenses, screenshot matrix, measured JS/render cost, reviewer sign-off.

### TICKET-EP09-01: Submit job application

**User story:** As a registered applicant, I can complete, save and securely submit one job application.

**Acceptance:** required fields validate; drafts survive navigation; allowed documents scan and upload; submit is atomic; confirmation/reference generated; HR sees exactly one record; duplicate clicks do not create multiple submissions; applicant receives correct transactional confirmation or delivery retry; other users cannot access record.

**Tests:** unit validation, DB transaction, signed file access, E2E, concurrent submit, offline interruption, IDOR.

### TICKET-EP06-01: Schedule weekly special

**User story:** As an authorized store administrator, I can compose, preview and schedule a weekly special without changing code.

**Acceptance:** template has title, approved price/terms if applicable, branch, media and validity; mobile preview; approval if required; scheduled publication at defined Trinidad time; auto-expire; public browsing needs no account; unpublished campaigns unavailable to guests; audit event stored.

### TICKET-EP11-01: Guest newsletter signup

**User story:** As an anonymous visitor, I can subscribe to weekly promotional emails without registering.

**Acceptance:** email validation; explicit consent; successful persistence; confirmation workflow; suppression respected; unsubscribe from every marketing email; auth not required; application forms do not silently opt in.

# 26. Risks, dependencies, open decisions and assumptions

## 26.1 Risk register

| Risk | Severity | Mitigation / owner |
|---|---|---|
| Existing repository may not match assumed stack | High | Audit before architecture choices; technical lead |
| Broken mobile experience damages demo/client trust | High | S2 mobile gate, device QA; frontend lead |
| Sky seam/rough hero undermines perceived quality | High | Isolate and fix before demo; motion lead |
| Hiring data exposure / access errors | Critical | Authz design, RLS, threat model, tests; security lead |
| Wrong price/branch information published | High | Content approval/provenance, expiry; marketing lead |
| Imported Google Form contacts lack valid marketing consent | High | Consent audit and restricted use; privacy owner |
| Loyalty provider cannot supply identifiers/API | Medium | Adapter design and defer implementation; product owner |
| Payroll source missing or unavailable | High | Stage staff module, do not fabricate data; operations |
| Overusing animation breaks performance | High | Bundle/motion budget and poster fallback; frontend lead |
| Library license or dependency conflicts | Medium | Per-component review; engineering lead |
| One person holds several roles | High | Multi-role grants, explicit switcher, scoped authz |
| Approval bottleneck on photography and company details | Medium | Assigned content owners and sign-off schedule |
| Promotion redemption fraud | High | Secure tokens, atomic validation, rate limits; backend lead |
| Expanded scope exceeds intended delivery schedule | High | Gate-based milestones and signed change control |

## 26.2 Unresolved decisions needing formal answers

1. Which repository, branches, project IDs, framework and production deployment are authoritative?
2. Who is the client-side final decision-maker for brand, HR, marketing and engineering?
3. What is the actual brand kit with final logo variants, fonts, exact colors and type licensing?
4. What are the five exact approved branch addresses, hours, phones and public names?
5. Which hero footage/images and approved photographs can be legally used?
6. What recruitment fields, application retention period, HR statuses and communications are approved?
7. Which identity provider, email platform and storage service already exist?
8. Are company email accounts in Microsoft 365, Google Workspace or another system?
9. Who can author and approve specials, and what is the price/discount verification policy?
10. Are promo codes display-only or validated against POS, and who issues them?
11. What existing loyalty provider, membership scheme and identifiers are available?
12. Does the Google Form contain marketing consent and usable provenance?
13. Which scheduling/payroll system provides authorized staff data?
14. Which internal features must be in public launch vs operational follow-up?
15. What accessibility, privacy, commercial support and SLA terms will be contractually agreed?

**These unknowns do not prevent starting the audit, design system, public-page polish and requirements work.** They block claims of completion for affected integrations.

# 27. Delivery governance and AI coding agent execution directive

## 27.1 Operating instructions for Codex, Claude Code or other development agents

> **Role:** Senior frontend architect, backend architect, product engineer and QA lead acting on an existing Southern Food Basket codebase. This PRD defines intended requirements but does not supersede live code reality or client approvals.
>
> **First action:** inspect repository, deployment files and current apps. Output `docs/audit/current-state.md`, `docs/audit/route-map.md`, `docs/audit/integrations.md`, `docs/audit/asset-inventory.md`, and `docs/audit/risk-register.md`. Do not overwrite working modules or start a blanket rewrite.
>
> **Planning:** map each PRD requirement to existing code, gap, dependencies, proposed change, acceptance test and status. Generate work packages grouped by stage and risk, not arbitrary file lists.
>
> **Implementation:** branch per coherent feature; use minimal changes, schema migrations, typed contracts and server-side authorization. Choose components individually from the approved reference matrix and record license/version. Avoid installing all libraries or adding AI functionality not authorized.
>
> **Review:** include before/after screenshots for 320, 390, 768, 1024 and desktop, accessibility notes, test evidence, performance impact, content provenance and migration/rollback notes in each PR.
>
> **Restrictions:** no fake active stock, unapproved prices, live payroll simulation, unauthorized marketing import, production publish, hardcoded secrets, fabricated loyalty points or public exposure of applicant data.
>
> **Completion:** do not mark a ticket done without meeting section 22 and attaching evidence. If blocked by missing business decisions, label `Blocked—decision needed` and proceed with safe independent work.

## 27.2 Required agent-generated artifacts

```text
/docs/
  prd/SFB-PRD-001.md
  audit/current-state.md
  audit/route-map.md
  audit/integrations.md
  audit/risk-register.md
  architecture/identity-and-roles.md
  architecture/data-model.md
  architecture/integration-contracts.md
  design/reference-matrix.md
  design/tokens.md
  design/photography-shot-list.md
  design/responsive-spec.md
  delivery/stage-plan.md
  delivery/requirements-traceability.csv
  qa/test-plan.md
  qa/acceptance-evidence.md
  operations/release-checklist.md
  operations/rollback.md
  operations/incident-runbook.md
```

## 27.3 RACI proposal

| Activity | Business/product owner | Trinovata engineering | HR owner | Marketing/store owner |
|---|---|---|---|---|
| Scope decisions | Accountable | Consulted | Consulted | Consulted |
| Technical architecture/security | Informed | Accountable | Consulted | Consulted |
| Recruitment statuses/docs | Approves | Implements | Accountable domain owner | Informed |
| Promotions/brand content | Approves | Implements | Informed | Accountable domain owner |
| Data privacy/consent | Approves policy | Implements controls | Consulted | Consulted |
| QA and technical DoF | Signs launch | Accountable | UAT | UAT |
| Production launch | Accountable | Executes | Informed | Informed |

Actual people must be named during S0/S1; table defines responsibilities rather than inventing staffing.

## 27.4 Change-control rule

Any request adding payments, ecommerce, AI assistant, full payroll, real loyalty engine, POS integration or other major capability requires a written change request specifying outcome, requirements, dependencies, estimate, risks, impact on stage gates and acceptance authority. Maintaining future-ready interfaces is not authorization to develop the full feature.

# 28. Appendices

## A. Status model cheatsheet

**Promo:** `draft → in_review → approved → scheduled → active → expired → archived`; `rejected` returns to draft; `paused` permits temporary removal; immutable history retained. A direct active→draft mutation should not erase prior publication history.

**Job:** `draft → approved → published → paused/closed → archived`; existing submitted applications remain accessible according to policy even when posting closes.

**Application:** `draft → submitted → screening → documents_requested / interview / on_hold → offer / hired / declined / closed`; applicant can withdraw per policy and eligibility; every transition validated server-side.

**Newsletter:** `pending → active → unsubscribed / bounced / complained`; cannot reactivate suppression without valid new consent.

**Restricted code:** `issued → claimed → redeemed / expired / revoked`; redemption only when a defined authoritative validation exists.

## B. Sample acceptance format

```gherkin
Feature: Guest can browse specials
  Scenario: Public weekly special without login
    Given a promotion is published, active, and marked public
    And I am not signed in
    When I open /specials and select the promotion
    Then I see its approved details, valid dates, participating branches and terms
    And I am not asked to create an account

  Scenario: Restricted promotion requires identity
    Given a promotion requires a verified account
    And I am not signed in
    When I attempt to access its restricted claim details
    Then I receive a clear explanation of the benefit and account requirement
    And I can continue browsing public specials without creating an account
```

```gherkin
Feature: Applicant privacy
  Scenario: Applicant ownership enforced
    Given Applicant A has submitted application A1
    And Applicant B is signed in
    When B requests A1 by direct URL or API
    Then the server refuses access without leaking document metadata
    And the access attempt is appropriately logged
```

## C. Definition of a polished demo

A demo is **presentable** when: opening hero is seamless in recorded playback; all shown pages have purposeful approved content or conspicuously labeled demo data; mobile main navigation and first-screen content work; major interactive buttons navigate to meaningful destinations; company identity and footer truthfully reflect concept/official status; no console-breaking errors; photography and banner assets are clean and properly licensed; any incomplete backend is explicitly described, never simulated as production functionality; presenter has tested a complete storyboard from homepage to Careers, Stores and Specials.

## D. External links and verification note

- Prototype: https://southern-food-basket.vercel.app/
- Creative sites and repositories: full URLs in section 17.
- Referenced technical concepts: WCAG 2.2 AA, Core Web Vitals (LCP, INP, CLS), server-side authorization, privacy-by-design and auditable content publishing.

**Verification note:** This PRD incorporates first-hand discussion material and a limited public inspection of the current prototype. It does not claim to have inspected the private code repository, actual database, payroll system, current loyalty service or client-owned brand files. Tooling and package maintenance/licensing must be verified immediately before adoption.

---

# Formal approval checklist

- [ ] Client approves this PRD as baseline or submits tracked change requests.
- [ ] Client approves homepage design direction and final brand tokens.
- [ ] Client confirms priority: recruitment-first and no ecommerce/stock catalog.
- [ ] Client approves exactly two mandatory registration triggers.
- [ ] HR approves application data, candidate status language and retention.
- [ ] Marketing approves campaign rules, guest opt-in and promo-code policy.
- [ ] Operations approves staff/payroll data scope and integration source.
- [ ] Security/engineering approve auth, RBAC and data boundaries.
- [ ] Client approves photographic/content usage and verified store details.
- [ ] Team completes existing-repo audit, delivery estimates and stage gates.
- [ ] Named product owner signs production launch acceptance.

**End of PRD v1.0**
