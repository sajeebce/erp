# Onboarding Feature Test Plan

Use this checklist to test the recruitment onboarding features end to end.

Dev URL: `http://localhost:4000`

## 0. Before Testing

1. Make sure the app is running on port `4000`.
2. Log in as an admin/HR user.
3. Open `/hr/recruitment`.

Expected:
- Recruitment page loads.
- Existing jobs list appears.
- No page-level error is shown.

## 1. Create Job With Tag Requirements

Go to `/hr/recruitment/new`.

Fill required job fields:
- Title: `Field Coordinator Test`
- Department: select any department
- Location: `Dhaka`
- Deadline: choose a future date
- Description, Responsibilities, Qualifications: add any text
- Preferred Skills: `KoBoToolbox, field reporting, stakeholder coordination`
- Benefits: `Festival bonus, mobile allowance, field travel support`

In Requirements:
- Minimum education: `Masters`
- Minimum experience: `3`
- Required skills: add `Project Management`, `Excel`, `Donor Reporting`
- Required languages: add `Bengali`, `English`
- Required certifications: add `PMP`

Test tag behavior:
- Type a skill and press Enter.
- Type another and press comma.
- Click a suggestion.
- Remove one chip with the `x` button, then add it again.
- Refresh the page and confirm suggestions still appear.

Submit the job.

Expected:
- Job is created successfully.
- You are redirected to the job detail page.
- Requirements show as chips/badges in the job detail.

## 2. Publish And Copy Public Link

On the job detail page:

1. Click `Publish`.
2. Click the link/copy icon in the header.
3. Click `Copy`.
4. Click `Open`.

Also test from `/hr/recruitment` list:

1. Find the published job row.
2. Click the link/copy icon.
3. Confirm the same public URL appears.

Expected:
- Draft jobs have sharing disabled.
- Published jobs allow Copy and Open.
- Public URL opens `/careers/{orgSlug}/{jobSlug}`.

## 3. Public Job Detail And Self-Declaration Form

Open the public job link in a browser/incognito window.

Expected:
- Job details load without admin login.
- Self-declaration section appears.
- Education, experience, required skills, languages, and certifications are rendered from the job requirements.
- CV upload is optional.

Submit a partial-match application:
- Name: `Rahim Test`
- Email: use a unique email, e.g. `rahim.test.001@example.com`
- Education: `Bachelors`
- Experience: `2`
- Skills: select `Excel` only
- Languages: select `Bengali`
- Certifications: leave `PMP` unchecked
- Confirm accuracy checkbox: checked

Expected:
- Application submits successfully.
- Success message appears.

Validation checks:
- Submit again with the same email.
- Submit without name.
- Submit without email.
- Submit with invalid email.
- Submit without required education/experience.
- Submit without confirming accuracy.

Expected:
- Duplicate email is rejected.
- Missing/invalid required fields are rejected.
- Missing accuracy confirmation is rejected.

## 4. Admin Application Review

Return to the admin job detail page.

Open the Pipeline tab.

Expected:
- New application appears in the `APPLIED` column.
- Auto score is shown after scoring completes.

Click the applicant card.

Expected:
- Application detail page opens.
- Panel title says `Applicant Self-Declaration`.
- It shows declared education, experience, skills, languages, and certifications.
- Note says: `Verify these claims at interview.`
- Score breakdown is visible if auto-scoring completed.

## 5. Auto-Score Behavior

Use the same job requirements:
- Masters
- 3 years
- 3 skills
- 2 languages
- 1 certification

Create another public application with a stronger match:
- Education: `Masters`
- Experience: `3`
- Skills: select all required skills
- Languages: select both required languages
- Certifications: select `PMP`

Expected:
- Stronger application gets a higher auto-score than the partial-match application.
- Missing dimensions reduce the score.
- If a job has no requirements for a dimension, that dimension should receive full marks from existing scoring behavior.

## 6. Pipeline Filter And Search

On `/hr/recruitment/{jobId}` Pipeline tab:

Test search:
- Search by applicant name.
- Search by applicant email.

Test min score:
- Set min score to `60`.
- Increase to `80`.

Test skill filter:
- Click `Excel`.
- Click another required skill.
- Click selected skill again to remove it.

Test URL state:
- Apply filters.
- Refresh the browser.
- Copy the filtered URL and open it in another tab.
- Click Reset.

Expected:
- Search narrows applicants.
- Min score narrows applicants.
- Skill filter only shows applicants with all selected skills.
- URL query params preserve filters.
- Reset clears all filters.
- Applicant card click still opens detail page.

## 7. Server-Side Subset Validation

This test confirms applicants cannot submit skills/certs/languages that are not on the posting.

Use browser devtools or API client and POST to:

`/api/v1/public/careers/{orgSlug}/{jobSlug}/apply`

Try adding an extra skill:

```json
{
  "applicantName": "Invalid Skill Test",
  "applicantEmail": "invalid.skill.test@example.com",
  "declaredEducation": "Masters",
  "declaredExperienceYears": 3,
  "declaredSkills": ["Excel", "Fake Skill"],
  "declaredLanguages": [{ "language": "Bengali", "level": "Fluent" }],
  "declaredCertifications": ["PMP"]
}
```

Expected:
- Request is rejected.
- Error says declared skills contain an option not required for this posting.

Repeat with:
- Extra language
- Extra certification

Expected:
- Both are rejected.

## 8. Regression Checks

Check these existing flows still work:

1. `/hr/recruitment` loads.
2. `/hr/recruitment/new` can create a draft job.
3. Existing published public jobs still load.
4. Existing applications still open.
5. Application advance/reject buttons still work.
6. Score All button still works or fails gracefully if endpoint is unavailable.

## Verification Commands

Run:

```powershell
npx.cmd tsc --noEmit
```

Run scoped lint for the changed recruitment files:

```powershell
npx.cmd eslint 'src/app/(public)/careers/[orgSlug]/[jobSlug]/page.tsx' 'src/app/(dashboard)/hr/recruitment/applications/[id]/page.tsx' 'src/app/(dashboard)/hr/recruitment/new/page.tsx' 'src/app/(dashboard)/hr/recruitment/page.tsx' 'src/app/(dashboard)/hr/recruitment/[id]/page.tsx' 'src/app/api/v1/public/careers/[orgSlug]/[jobSlug]/route.ts' 'src/app/api/v1/public/careers/[orgSlug]/[jobSlug]/apply/route.ts' 'src/app/api/v1/hr/recruitment/jobs/route.ts' 'src/app/api/v1/hr/recruitment/jobs/[id]/route.ts' 'src/app/api/v1/hr/recruitment/jobs/[id]/applications/route.ts' 'src/app/api/v1/hr/recruitment/tags/route.ts' 'src/components/shared/tag-input.tsx' 'src/components/hr/share-job-link-button.tsx' 'src/lib/recruitment-tags.ts'
```

Expected:
- TypeScript passes.
- Scoped lint passes.

Note:
- Full `npm run lint` may still fail because the repo has unrelated existing lint errors outside this work.
