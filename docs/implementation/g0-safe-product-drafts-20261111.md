# Asian Furniture — G0-safe product draft hardening (2026-11-11)

## Scope and provenance
Repository: `Munna882/Asian-Fruniture`
Base: `main` at `73fdc64fe79aa05572eba80b5e374e2d547ee018`
Branch: `phase-1b-g0-safe-product-drafts-20261111`
Status: **REVIEW ONLY — NOT DEPLOYED, NOT MERGED, NO DATABASE MIGRATIONS.**

## Findings verified in the base commit
- `src/app/admin/products/actions.ts`: no server-side authentication/authorization, arbitrary user-supplied image bytes written to a public file path, float-based prices, randomized SKU, implicit opening stock.
- `src/app/admin/layout.tsx`: only logged-in session check, so a customer session could reach administrative UI.
- `src/app/shop/page.tsx`, `src/app/product/[id]/page.tsx`, and `src/app/collections/[category]/page.tsx`: no Product.status=PUBLISHED visibility gate.
- `src/app/page.tsx`: hardcoded stock photographs and categories not matching management's five approved categories.
- `src/app/checkout/page.tsx`: sample cart entries and presentation of payment methods without a verified provider integration.
- No GitHub Actions workflow runs found on main at inspection time.
- Investigation branch diverges from main, is not a validated merge candidate.
- Remote Phase 1A remediation branch not found among three listed remote branches.

## Changes made
1. Product creation action enforces authenticated, active account and a temporary SUPER_ADMIN-only draft-creation policy. This temporary rule is NOT the final editor/approver RBAC design.
2. SKU must come from approved source; decimal BDT converted exactly to integer poisha. New product starts DRAFT with stock=0.
3. Public filesystem media uploads and unscoped opening stock are fail-closed until dedicated storage and authorized inventory workflows are approved. No media is uploaded by this draft UI.
4. Replace old form with a draft-only product form. Explicitly disclose restricted media/stock functionality.
5. Filter storefront product queries and metadata by PUBLISHED status; remove exposed numeric stock count on the product detail page.
6. Admin layout rejects CUSTOMER and inactive user sessions (server actions still require their own authorization).

## Mandatory reviewer checks
- Confirm TypeScript, ESLint, build, Vitest and regression tests in an isolated environment; NO CI/test results are asserted.
- Exercise unauthenticated, CUSTOMER, inactive, non-editor staff, and allowed editor roles directly against the server action (including forged FormData).
- Verify SKU duplicate handling, Unicode text, price edge cases, oversized descriptions, invalid category, and draft nonvisibility across every public API/page/metadata route.
- Audit all other server actions and route handlers for RBAC; a layout redirect alone does not secure them.
- Review the restricted draft-only behavior against the approved product-editor role, maker/checker and publication policy.
- Validate schema/history reconciliation and G0 security gates before merging.
- Replace public storage with owner-approved private media, content sniffing, file limits, malware scanning, image processing, private approvals and short-lived publish URLs.
- Replace the mock checkout and unapproved payment claims before any public launch.
- Reconcile SRS five-main-banner wording against the later locked FOUR-hero management decision through a formal addendum.
- No changes to data, Prisma schema/migrations, payment endpoints, environment secrets, branches main, or deployment have been performed by this patch.

## Release gate
**DO NOT MERGE OR DEPLOY** until the independent security/QA reviewer approves, the G0 blockers have been resolved, authorized staging tests are captured, and product-publishing controls are designed and reviewed.
