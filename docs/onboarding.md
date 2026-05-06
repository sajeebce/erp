# Onboarding — Feature Plans

> Living document. Lean MVP plans only. Out-of-scope items are explicitly listed under each section.

---

## Build Order (Recommended)

Ship in this order — each step unlocks real value, no step depends on a future step:

1. **Self-Declaration Form** (~2 days) — applicant ticks the admin's required skills → meaningful auto-score immediately
2. **Tag-based Requirements input** (~2 days) — chip UX + suggestion master so the same skill vocabulary is reused across postings
3. **Shareable Public Job Link** (~1 day) — copy-link button on admin recruitment list/detail
4. **Filter & Search bar** (~2 days) — admin filters applicants by score, skills, search

Total: ~1 week of focused work for the complete recruitment loop.

---

## 1. Recruitment — Self-Declared Eligibility Form

> **Foundation.** Build this first.

### Goal

Public apply form at `/careers/{orgSlug}/{jobSlug}` mirrors the job's requirements as form fields. Applicant directly **selects/declares** which requirements they meet. The existing scoring engine reads this declared data — no AI/CV-parser needed.

### Mental Model

Admin sets on `/hr/recruitment/new`:
- Min education: Masters
- Min experience: 3 years
- Required skills: 5 items
- Required languages: 2 items
- Required certifications: 1 item

Public form shows those exact items as checkboxes/dropdowns. Applicant ticks what they have. Score = ratio of ticked-to-required, weighted by the existing scoring weights.

### Form Layout

```
Personal Info: Name*, Email*, Phone, Address

Eligibility:
  Highest education *  [Masters ▾]
  Years of experience* [_____] years

  Which of these skills do you have? *
    ☐ Project Management
    ☐ Monitoring & Evaluation
    ☐ Excel
    ☐ Donor Reporting
    ☐ Bengali Typing

  Which languages do you speak? *
    ☐ English        Level: [Fluent ▾]
    ☐ Bengali        Level: [Native ▾]

  Which certifications do you hold?
    ☐ PMP

Documents (optional):
  CV (PDF/DOCX, max 5MB)
  Cover letter

Cover note (optional textarea)

☐ I confirm the above information is accurate
[Submit]
```

### Schema — No changes

Existing `JobApplication` fields are reused with new semantics:

| Form input | Stored in | Read by scoring engine |
|---|---|---|
| Education dropdown | `parsedEducation = [{ degree: 'Masters' }]` | `scoreEducation` |
| Experience input | `totalExperienceYears` | `scoreExperience` |
| Skills checkboxes (ticked only) | `parsedSkills = [...]` | `scoreSkills` |
| Language checkboxes + level | `parsedLanguages = [{language, level}]` | `scoreLanguages` |
| Certification checkboxes | `parsedCertifications = [...]` | `scoreCertifications` |
| CV file (optional) | `cvFilePath` | Not used for scoring |

### API Changes

**Public job detail** — extend response to include `requiredSkills`, `requiredLanguages`, `requiredCertifications`, `minEducation`, `minExperience` so the form can render dynamic options.

**Public apply** — accept new body fields:
```ts
{
  // existing personal info + cv/cover...
  declaredEducation: 'MASTERS',
  declaredExperienceYears: 5,
  declaredSkills: ['Project Management', 'Excel'],   // subset of posting.requiredSkills
  declaredLanguages: [{ language: 'English', level: 'Fluent' }],
  declaredCertifications: ['PMP'],
}
```

Server validation: declared arrays must be a **subset** of the posting's required arrays (reject extras to prevent gaming). After insert, `autoScoreApplication` (already wired) runs and produces a real score.

### Admin View

On `/hr/recruitment/applications/[id]`, rename the "Parsed CV" panel → **"Applicant Self-Declaration"**. Note: *"Verify these claims at interview."* No other changes — score breakdown already renders from the same fields.

### Acceptance

- Form renders dynamic checkboxes from the posting's required arrays
- Submitting persists declared data into existing `parsed*` fields
- Auto-score reflects ratio of ticked-to-required (e.g., 3/5 skills → 60% of skills weight)
- Posting with no requirements → that section hidden, full marks for that dimension (existing behavior)
- Server rejects skills not in the posting's `requiredSkills`

### Out of Scope

- AI CV parser (defer indefinitely — self-declaration solves the core need)
- Admin override to edit declared values (defer until requested)
- Verification layer comparing declared vs CV text (defer)

### Steps

1. Extend public job detail API response with required arrays + min education/experience
2. Build the Eligibility form section (dynamic checkbox/dropdown render)
3. Extend public apply API with declared-* fields, subset validation, write to `parsed*` fields
4. Rename admin panel label
5. Test: post job with 5 skills + Masters + 3 yr → apply with 3/5 + Bachelors + 2 yr → verify partial score

---

## 2. Recruitment — Tag-based Requirements input

> Improves data quality at source. Build after Self-Declaration so the suggestion list is meaningful.

### Goal

On `/hr/recruitment/new`, replace the three plain text inputs (Required Skills / Languages / Certifications) with **chip-style tag inputs + autocomplete suggestions**. Same skill vocabulary reused across postings.

### UX

- Type → comma / Enter / Tab → input becomes a removable chip
- Each chip has an **× button** (mouse + keyboard accessible)
- Backspace on empty input removes last chip
- Suggestions dropdown shows matching tags as user types, ranked by usage
- Click suggestion or new chip → adds to list. New chips persist to org-level master.

### Component

`src/components/shared/tag-input.tsx`

```ts
interface TagInputProps {
  value: string[]
  onChange: (next: string[]) => void
  suggestions?: string[]
  onCreateSuggestion?: (s: string) => void  // fires when a brand-new tag is added
  placeholder?: string
  caseInsensitive?: boolean  // default true (dedupe "PMP" vs "pmp")
}
```

### Schema — One table

```prisma
model RecruitmentTag {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String   @db.Uuid
  type           RecruitmentTagType   // SKILL | LANGUAGE | CERTIFICATION
  name           String                // canonical display
  nameLower      String                // dedupe key
  usageCount     Int      @default(0)
  createdAt      DateTime @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id])

  @@unique([organizationId, type, nameLower])
  @@index([organizationId, type, usageCount(sort: Desc)])
}

enum RecruitmentTagType {
  SKILL
  LANGUAGE
  CERTIFICATION
}
```

> One table with a `type` enum. Languages don't need a separate model until language `level` becomes part of the master (currently it's per-application).

### API

```
GET  /api/v1/hr/recruitment/tags?type=SKILL&q=...&limit=50
POST /api/v1/hr/recruitment/tags    { type, name }   // upserts, increments usageCount
```

Job posting create/update endpoint internally upserts every submitted tag — keeps the master in sync even if the UI bypasses the suggestion API.

### Seed (Bangladesh/NGO context)

**Skills:** Project Management, Monitoring & Evaluation, Report Writing, Microsoft Office, Excel, Field Survey, Beneficiary Management, Microfinance, Loan Processing, Community Mobilization, Bengali Typing, Bicycle Riding, First Aid, Counseling, Donor Reporting, Budget Management, Procurement

**Languages:** Bengali, English, Hindi, Arabic, Urdu

**Certifications:** PMP, ACCA, CA, CMA, NGOAB Compliance, IFRS, IPSAS

### Acceptance

- Three fields render as chip lists, not comma-separated text
- Comma / Enter / Tab commits the chip; whitespace ignored; case-insensitive dedupe
- Each chip has a working × button
- Suggestions appear ranked by usage; clicking adds the chip
- A brand-new chip auto-saves to the org master so it appears next time
- Submit/reload preserves chips
- Auto-scoring still works (no change to scoring engine)

### Out of Scope

- Skill levels per chip (Beginner/Intermediate/Expert)
- Synonyms / aliases ("MS Excel" = "Excel")
- Cross-org global skill library
- Bulk import from CSV

### Steps

1. Add `RecruitmentTag` model + migration
2. GET/POST endpoints
3. Seed starter vocabulary
4. Build `<TagInput />` component
5. Wire into `/hr/recruitment/new` (and edit page if exists), switch state to `string[]`
6. Auto-upsert tags on job posting save

---

## 3. Recruitment — Shareable Public Job Link

> Smallest, ships fastest. Backend already exists.

### Goal

Admin sees a **Copy Link** button on each PUBLISHED job in `/hr/recruitment` and on the detail page. Clicking copies `http://localhost:4000/careers/{orgSlug}/{jobSlug}` to clipboard. Anyone with the link can view the JD and apply.

### Backend — Already Built

| Piece | Path |
|---|---|
| Public list page | [src/app/(public)/careers/[orgSlug]/page.tsx](../src/app/(public)/careers/%5BorgSlug%5D/page.tsx) |
| Public detail + apply | [src/app/(public)/careers/[orgSlug]/[jobSlug]/page.tsx](../src/app/(public)/careers/%5BorgSlug%5D/%5BjobSlug%5D/page.tsx) |
| List API (PUBLISHED only) | [src/app/api/v1/public/careers/[orgSlug]/route.ts](../src/app/api/v1/public/careers/%5BorgSlug%5D/route.ts) |
| Detail API | [src/app/api/v1/public/careers/[orgSlug]/[jobSlug]/route.ts](../src/app/api/v1/public/careers/%5BorgSlug%5D/%5BjobSlug%5D/route.ts) |
| Apply API (auto-scores after submit) | [src/app/api/v1/public/careers/[orgSlug]/[jobSlug]/apply/route.ts](../src/app/api/v1/public/careers/%5BorgSlug%5D/%5BjobSlug%5D/apply/route.ts) |
| Slug field | `JobPosting.slug` (auto-generated from title+location) |

### What's Missing

- Admin-side **Copy Link** button on `/hr/recruitment` rows + `/hr/recruitment/[id]` header
- Slug stability — title edit on a PUBLISHED posting should NOT regenerate slug (would break shared links)
- OG meta tags on the public detail page so WhatsApp/LinkedIn previews render properly

### Component

`src/components/hr/share-job-link-button.tsx`

```ts
interface ShareJobLinkButtonProps {
  orgSlug: string
  jobSlug: string
  status: JobPostingStatus  // disabled if not PUBLISHED
}
```

Renders a popover with a read-only URL input + Copy button + "Open in new tab". Uses `window.location.origin` as base. Shows tooltip "Publish to enable sharing" when disabled.

### Slug Freeze

In the PATCH endpoint for `/api/v1/hr/recruitment/jobs/[id]`: if `status === 'PUBLISHED'`, do not regenerate `slug` even if title changes.

### OG Tags

In the public detail page's `generateMetadata()`:
- `og:title` = job title
- `og:description` = first 160 chars of description
- `og:image` = org logo
- `og:url` = canonical public URL

### Acceptance

- Published job shows a Copy icon on row + detail page
- Click copies URL to clipboard with toast confirmation
- Opening URL in incognito shows the JD and apply form
- DRAFT/CLOSED postings cannot be opened by URL guess (404)
- Editing PUBLISHED title does not break the existing share URL
- WhatsApp/LinkedIn link preview shows job title + org name

### Out of Scope

- QR code generator
- Social media deep-link buttons (WhatsApp/Facebook/Email/LinkedIn)
- Application source tracking (`?src=whatsapp` etc.)
- JSON-LD `JobPosting` schema for Google for Jobs
- Custom slug field
- Captcha / rate limiting on public form

### Steps

1. Build `<ShareJobLinkButton />`
2. Wire into `/hr/recruitment` list rows
3. Wire into `/hr/recruitment/[id]` header
4. Add slug-freeze guard in PATCH endpoint
5. Add OG meta tags in public detail page

---

## 4. Recruitment — Filter & Search Bar

> Admin productivity for triaging applicants. Build after Self-Declaration so there's real score data to filter on.

### Goal

On `/hr/recruitment/[id]` Pipeline tab, add a sticky filter bar above the kanban: search by name/email, filter by min auto-score, filter by required-skill overlap.

### Filter Bar

```
[ Search name/email... ]  [Min score: ▮▮▮▮▯ 60+]  [Skills: Excel ×, M&E × +]  [Reset]
```

Filter state lives in URL query params (refresh-safe, shareable):
```
/hr/recruitment/{jobId}?minScore=60&skills=Excel,M%26E&q=rahim
```

### API Extension

`GET /api/v1/hr/recruitment/jobs/[id]/applications` accepts:
- `q` — search in `applicantName`, `applicantEmail`
- `minScore` — `autoScore >= N`
- `skills[]` — application's `parsedSkills` must include ALL of these (case-insensitive)

Existing default sort `autoScore DESC` stays — top candidates always on top.

### Acceptance

- Filter bar applies via URL query params
- Search returns matches within 300ms for ~1000 applications
- Skills filter narrows the kanban columns to matching applicants
- Reset clears all filters
- Clicking an applicant card still opens the detail page (existing behavior preserved)

### Out of Scope

- Table view toggle (kanban is enough)
- Bulk actions (shortlist/reject multiple at once)
- CSV / Excel export
- Side-by-side comparison view (API exists at [compare/route.ts](../src/app/api/v1/hr/recruitment/jobs/%5Bid%5D/compare/route.ts), UI deferred)
- Filter by education / experience / source — add only if requested

### Steps

1. Extend applications API with `q`, `minScore`, `skills[]` params
2. Build filter bar component with URL-state sync
3. Wire into `/hr/recruitment/[id]` Pipeline tab
4. Test with seeded ~50 applications

---

## Summary — What Will Be Implemented

| # | Feature | Days | Schema change | Priority |
|---|---|---|---|---|
| 1 | Self-Declaration Form | ~2 | None (reuses existing fields) | P0 — foundation |
| 2 | Tag input + master suggestions | ~2 | +1 table (`RecruitmentTag`) | P1 |
| 3 | Share link button + slug freeze + OG tags | ~1 | None | P1 |
| 4 | Filter & search bar | ~2 | None | P2 |

**Total: ~7 days** for the full recruitment loop polish.

**Explicit non-goals** (do NOT build, asked or otherwise):
- AI CV parser
- Application source tracking
- Bulk actions / CSV export / comparison UI
- QR code / social deep links / JSON-LD
- Skill levels / synonyms / cross-org tag library
- Custom landing page builder
- Multi-language toggle on public page
- Email notifications on new application
- Captcha / rate limiting (add only at production hardening)
