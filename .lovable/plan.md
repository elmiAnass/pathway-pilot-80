# White-Label Study Abroad SaaS — Build Plan

This is a large multi-tenant B2B SaaS. I'll build it in phases so you can validate each layer before stacking the next. I'll need to enable **Lovable Cloud** (managed Postgres + Auth + Storage + RLS) before any backend work.

---

## Phase 0 — Foundation
- Enable Lovable Cloud.
- Design system in `src/styles.css`: dark theme (`#1A1C23`), gold accent (`#F5A623`), green/red status tokens, typography, RTL support utilities.
- i18n scaffolding (Arabic RTL + French LTR) with a language switcher; `dir` toggled on `<html>`.
- Layout primitives: bottom nav, FABs (Chat right, AI left), gold-accented buttons, status pills.

## Phase 1 — Multi-Tenant Schema + RLS
Tables (all carry `agency_id` where applicable):
- `agencies` (id, name, primary_color, logo_url, custom_domain)
- `profiles` (id = auth.uid, agency_id, role, name, current_step, must_change_password)
- `user_roles` (user_id, role enum: superadmin | agency_admin | student) — separate table to avoid privilege-escalation
- `documents` (id, user_id, agency_id, type, url, status, feedback, is_mandatory)
- `universities` (id, agency_id, name, location, price, ranking, badges[])
- `applications` (id, user_id, agency_id, university_id, status)
- `step_progress` (user_id, step, status, approved_by, approved_at)

Security:
- `has_role()` SECURITY DEFINER function.
- `current_agency_id()` SECURITY DEFINER returning the caller's agency.
- RLS on every table: rows visible only when `agency_id = current_agency_id()`, with superadmin override.
- Storage bucket `documents` (private) with RLS keyed on `agency_id/user_id` path.

## Phase 2 — Auth (Invite-Only)
- No public signup; `/login` only.
- Forced password change on first login (`must_change_password` flag → `/reset-password`).
- AgencyAdmin "Invite Student" form → server function using admin client to create auth user + profile + send invite email with temp password.
- Auth guard layout `_authenticated` + role-based child guards.

## Phase 3 — Agency CRM (built before student portal so admins can seed data)
- Dashboard with KPIs (total students, pending validations, upcoming visas).
- Student Kanban (7 columns = 7 steps) with drag-and-drop (dnd-kit).
- Validation Center: document viewer + Approve / Reject(with reason). Approving all mandatory docs auto-unlocks Step 3.
- Universities manager (CRUD for agency catalog).
- Invite Manager.
- Branding settings (logo + primary color → drives runtime theming).

## Phase 4 — Student Portal (7-step locked pipeline)
- Home: vertical timeline, 7 nodes (green-check / yellow-dashed / gray-padlock), greeting + progress bar.
- Step gating: Step N locked until Step N-1 is 100% complete AND approved.
- Step 1: Personal/Academic multi-step form + YouTube tutorial iframe.
- Step 2: Mandatory/Optional document upload zones, status indicators.
- Step 3: University card list, max 5 selectable, badges.
- Step 4: Read-only tracking of 5 applications.
- Step 5: Admission letters + payment receipts upload.
- Step 6: Visa checklist + appointment date.
- Step 7: Flight + arrival logistics.
- Bottom nav (Back, Forward, Home, Notifications, Menu) + FABs.

## Phase 5 — White-Label Runtime
- On login, fetch agency branding → inject CSS variables (`--primary`, logo) at runtime.
- Custom-domain field stored; routing by domain is out of scope for preview (documented).

## Phase 6 — Polish
- Notifications panel.
- Chat FAB (stub UI; real chat is a follow-up).
- AI Support FAB (wired to Lovable AI Gateway with a study-abroad system prompt).
- Empty states, skeletons, toasts, error boundaries.

---

## Scope I'm proposing to defer (call out now)
- Real custom-domain routing (DNS-level) — UI/data only.
- Real-time chat (only UI shell in v1).
- Email template customization per agency.
- Payment processing (only receipt uploads).

---

## A few decisions before I start

1. **Default language** on first load: Arabic or French?
2. **AI Support FAB** — wire it to Lovable AI Gateway (Gemini) now, or leave as stub?
3. **Drag-and-drop Kanban** — dnd-kit is the cleanest fit; OK to add?
4. **Superadmin** — should I scaffold a separate `/superadmin` area in v1, or focus v1 on Agency + Student and ship Superadmin in v2?

Reply with answers (or just "go with your defaults: French, wire AI, dnd-kit yes, defer Superadmin") and I'll start at Phase 0.
