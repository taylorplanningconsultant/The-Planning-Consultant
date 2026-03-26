# MyPlanningGuide - Single Source of Truth

This document is the canonical product, technical, and delivery reference for MyPlanningGuide.  
All development should follow this specification unless explicitly superseded.

---

## 1) Product Overview

### Product Identity

| Item | Value |
| --- | --- |
| Product name | MyPlanningGuide |
| Secondary domain/brand | MyPlanningConsultant |
| Domains owned | myplanningguide.com, myplanningguide.co.uk, myplanningconsultant.com, myplanningconsultant.co.uk, theplanningconsultant.com |
| Target markets | UK homeowners, architects, planning agents, property developers, small builders |

### Core Problem

The UK planning system is opaque, slow, and expensive to navigate. Homeowners spend hundreds of pounds on pre-application consultations just to discover project viability. Architects and planning professionals manually check constraints across fragmented local authority portals for every site.

### Core Value Proposition

Instant AI-powered planning constraint reports and planning statement drafts for any UK address in under 60 seconds, at a fraction of consultant cost.

---

## 2) Design System

Reference design source: `website_template.html` at the project root.  
All pages and components must match this design exactly.

### Typography

- Font family: Outfit (Google Fonts)
- Allowed weights: 300, 400, 500, 600, 700, 800
- No serif fonts anywhere

### Color Tokens

| Token Group | Values |
| --- | --- |
| Primary accent | `#126B3A` (mid green), `#18A056` (bright green), `#0B4D2C` (dark green) |
| Background | `#FFFFFF` (primary), `#F7F9F7` (subtle), `#F0F4F1` (alt) |
| Text | `#0A0F0C` (primary), `#4A5C50` (secondary), `#8FA896` (muted) |
| Border | `#E2E8E3` (default), `#C8D4CA` (mid) |

### Radius, Shadows, and Patterns

- Border radius:
  - `6px` default
  - `10px` medium
  - `16px` large
- Shadows must use CSS vars:
  - `--shadow-sm`
  - `--shadow-md`
  - `--shadow-lg`
- CTA button style:
  - `linear-gradient(135deg, #126B3A, #18A056)`
  - with box-shadow
- Dot pattern backgrounds:
  - radial-gradient dots
  - 7% opacity
  - 24px spacing
- Hero section:
  - gradient mesh background (green radial overlays)
  - dot grid overlay

### Section Composition Pattern

Use this sequence consistently:
1. `sec-label` (uppercase, 12px, green)
2. `sec-h` (headline, 800 weight)
3. `sec-sub` (body copy, 400 weight)

### Implementation Rules

- Build all UI as reusable React + Tailwind components.
- Tailwind config must be extended with the exact design tokens above.
- Avoid ad-hoc styling divergence from `website_template.html`.

---

## 3) Tech Stack

| Concern | Technology |
| --- | --- |
| Framework | Next.js (App Router, latest stable - 16) |
| Styling | Tailwind CSS v4 with custom theme tokens |
| UI components | shadcn/ui (reusable primitives themed to brand tokens) |
| Auth | Supabase Auth (email/password + magic link) |
| Database | Supabase PostgreSQL, Supabase JS client v2 |
| Payments | Stripe Billing (subscriptions) + Stripe Checkout (one-off) |
| CMS (blog) | Sanity.io |
| PDF generation | `react-pdf` or Puppeteer (server-side via API route) |
| Maps | Leaflet (locked-interaction report map view) |
| Transactional email | Resend |
| Newsletter provider | Beehiiv or Loops (TBD, behind service abstraction) |
| Planning data | planning.data.gov.uk API + OS Data Hub API |
| Hosting | Vercel |
| Analytics | Vercel Analytics + Google Search Console |
| Package manager | pnpm |
| Language | TypeScript strict mode |

---

## 4) Required Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
SANITY_PROJECT_ID=
SANITY_DATASET=
SANITY_API_TOKEN=
RESEND_API_KEY=
OS_DATA_HUB_API_KEY=
ANTHROPIC_API_KEY=
```

---

## 5) Database Schema (Supabase)

### `profiles`

```sql
id uuid references auth.users primary key
email text
full_name text
role text default 'user' -- 'user' | 'admin'
subscription_tier text default 'free' -- 'free' | 'starter' | 'pro' | 'agency'
stripe_customer_id text
created_at timestamptz default now()
```

### `reports`

```sql
id uuid primary key default gen_random_uuid()
user_id uuid references profiles(id) -- nullable for anonymous
email text -- captured pre-payment for anonymous users
address text not null
postcode text not null
lpa_name text
lpa_code text
constraint_data jsonb -- full constraint payload
approval_score integer -- 0-100
report_type text -- 'basic' | 'full'
pdf_url text
share_token uuid default gen_random_uuid()
created_at timestamptz default now()
```

### `statements`

```sql
id uuid primary key default gen_random_uuid()
user_id uuid references profiles(id)
report_id uuid references reports(id) -- optional link
address text
proposal_text text not null
generated_content text
lpa_name text
status text default 'draft'
created_at timestamptz default now()
```

### `subscriptions`

```sql
id uuid primary key default gen_random_uuid()
user_id uuid references profiles(id) unique
stripe_customer_id text
stripe_subscription_id text
plan text -- 'starter' | 'pro' | 'agency'
status text -- 'active' | 'cancelled' | 'past_due'
current_period_end timestamptz
created_at timestamptz default now()
```

### `leads`

```sql
id uuid primary key default gen_random_uuid()
email text not null
postcode text
source text -- 'hero' | 'report_gate' | 'newsletter'
report_id uuid references reports(id)
converted boolean default false
created_at timestamptz default now()
```

### `professionals`

```sql
id uuid primary key default gen_random_uuid()
user_id uuid references profiles(id)
company_name text
professional_type text -- 'architect' | 'planning_agent' | 'developer' | 'surveyor'
postcode text
coverage_radius_miles integer default 25
active boolean default true
stripe_subscription_id text
created_at timestamptz default now()
```

### `lpa`

```sql
CREATE TABLE lpa (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  lpa_code text not null unique,
  region text,
  website_url text,
  planning_portal_url text,
  local_plan_name text,
  local_plan_adopted_date date,
  article4_coverage text,
  conservation_area_count integer,
  listed_building_count integer,
  green_belt_coverage boolean default false,
  flood_risk_level text,
  average_decision_weeks integer,
  approval_rate_percent integer,
  applications_per_year integer,
  pre_app_advice_offered boolean default false,
  planning_email text,
  summary_paragraph text,
  key_policy_notes text,
  hero_image_url text,
  population integer,
  created_at timestamptz default now()
);
```

Column reference:
- `slug`: URL-safe identifier e.g. 'london-borough-of-hackney'
- `lpa_code`: ONS/planning.data.gov.uk reference e.g. 'E09000012'
- `region`: e.g. 'Greater London', 'North West', 'South East'
- `article4_coverage`: 'high' | 'medium' | 'low' | 'none'
- `flood_risk_level`: 'high' | 'medium' | 'low'
- `summary_paragraph`: 2-3 sentence human-reviewed intro unique to that authority
- `key_policy_notes`: notable local planning quirks or requirements
- `hero_image_url`: curated image stored in Supabase Storage or external URL
- `population`: seeded from ONS data

---

## 6) Route Structure

### Public Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page (from `website_template.html`) |
| `/check` | Constraint checker tool (primary product flow) |
| `/report/[shareToken]` | Public read-only report view |
| `/statement` | Planning statement generator |
| `/pricing` | Full pricing page |
| `/blog` | Blog index |
| `/blog/[slug]` | Blog post page from Sanity |
| `/author/[slug]` | Author profile |
| `/planning-permission/[lpaSlug]` | Programmatic Local Planning Authority landing page |
| `/about` | About page |
| `/contact` | Contact form |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/professionals` | Professionals landing page |

### Auth Routes

- `/login`
- `/signup`
- `/forgot-password`

### Dashboard Routes (authenticated)

- `/dashboard`
- `/dashboard/reports`
- `/dashboard/reports/[id]`
- `/dashboard/statements`
- `/dashboard/statements/[id]`
- `/dashboard/subscription`
- `/dashboard/settings`

### Admin Routes (`role = 'admin'`)

- `/admin`
- `/admin/users`
- `/admin/users/[id]`
- `/admin/posts`
- `/admin/reports`
- `/admin/leads`
- `/admin/professionals`

---

## 7) Core Features - MVP (Phase 1)

### 7.1 Planning Constraint Checker (`/check`)

#### User Flow
1. User lands on `/check` (or submits via homepage hero input).
2. Address input with autocomplete (OS Data Hub Places API).
3. Submit and run server-side constraint checks.
4. Show free result with 5 categories and pass/flag/fail statuses, with locked/blurred remainder.
5. Email gate to unlock full report preview and capture lead.
6. Paid unlock via Stripe Checkout (`GBP 19`) to access full PDF report.

#### Constraint Categories (8 total)
1. Conservation area (planning.data.gov.uk)
2. Listed building (Historic England API / planning.data.gov.uk)
3. Article 4 direction (planning.data.gov.uk)
4. Flood zone (Environment Agency API)
5. Tree Preservation Order (planning.data.gov.uk)
6. Green Belt (planning.data.gov.uk)
7. AONB / National Park (Natural England / planning.data.gov.uk)
8. Permitted Development Rights (derived from constraints)

#### Approval Likelihood Score Logic
- Start score at `85`.
- Hard constraints (listed, conservation, green belt, AONB): deduct `20-30`.
- Soft constraints (Article 4, flood zone 2/3, TPO): deduct `5-15`.
- Clamp output to integer `0-100`.

#### API Contract: `POST /api/check-constraints`
- Input:
  ```json
  { "address": "string", "postcode": "string" }
  ```
- Output:
  ```json
  { "constraints": "ConstraintResult[]", "score": 0, "lpa": "LPAInfo", "reportId": "uuid", "shareToken": "uuid" }
  ```
- Behavior:
  - Calls planning.data.gov.uk and Environment Agency APIs.
  - Stores result in `reports`.
  - Returns report ID and share token.

#### PDF Generation: `POST /api/generate-pdf/[reportId]`
- Server-side route only.
- Use `react-pdf` to generate structured report PDF.
- Upload PDF to Supabase Storage.
- Update `reports.pdf_url`.
- Return signed URL.

#### Report Map Module (Leaflet)
- Include a report map centered on the subject site/local area.
- Restrict interaction in report view:
  - disable drag/pan
  - disable scroll zoom
  - disable double-click zoom
  - disable box zoom and keyboard navigation
- Purpose is local context only, not free exploration.

---

### 7.2 Planning Statement Generator (`/statement`)

#### User Flow
1. User enters address, project type, proposal description.
2. Optional link to existing report to auto-fill address/context.
3. Submit and generate statement with AI.
4. Show first 3 paragraphs for free.
5. Paid unlock:
   - Statement only: `GBP 39`
   - Bundle: `GBP 49`
6. Provide full statement + Word document download after payment.

#### AI Prompt Architecture
- System prompt includes:
  - NPPF guidance context
  - planning statement structure template
- Injected user context:
  - address
  - LPA name
  - local plan policies (from planning.data.gov.uk)
  - proposal description
- Model: `claude-sonnet-4` via Anthropic API.
- Output path: structured markdown -> formatted `.docx` via `docx` library.

#### API Contract: `POST /api/generate-statement`
- Input:
  ```json
  {
    "address": "string",
    "postcode": "string",
    "lpaCode": "string",
    "projectType": "string",
    "proposalText": "string",
    "reportId": "uuid | optional"
  }
  ```
- Behavior:
  - Fetch LPA local plan policies from planning.data.gov.uk.
  - Call Anthropic API.
  - Stream response to client.
  - Persist completed output to `statements`.

---

### 7.3 Email Capture + Lead System

- Every free report creates a lead in `leads`.
- Send report summary + upgrade CTA via Resend.
- 3-email drip sequence for non-converters:
  - day 0
  - day 2
  - day 5
- Include unsubscribe token links.

---

### 7.4 Stripe Payment Integration

#### One-off Products

| Product ID | Price |
| --- | --- |
| `price_full_report` | GBP 19 |
| `price_statement` | GBP 39 |
| `price_bundle` | GBP 49 |

#### B2B Subscriptions

| Product ID | Price |
| --- | --- |
| `price_starter_monthly` | GBP 29/month |
| `price_starter_annual` | GBP 290/year |
| `price_pro_monthly` | GBP 79/month |
| `price_pro_annual` | GBP 790/year |
| `price_agency_monthly` | GBP 199/month |
| `price_agency_annual` | GBP 1,990/year |

#### Webhook: `POST /api/webhooks/stripe`

- `checkout.session.completed`:
  - Unlock report/statement purchase
  - Create subscription record if relevant
- `customer.subscription.updated`:
  - Update subscription tier/status in `profiles`
- `customer.subscription.deleted`:
  - Downgrade user to `free`

---

### 7.5 Blog (SEO + GEO)

- Content managed in Sanity.
- ISR enabled with `revalidate: 3600`.
- Post fields:
  - title
  - slug
  - author reference
  - metaDescription
  - targetKeyword
  - body (portable text)
  - publishedAt
  - status
- Author component includes:
  - photo
  - name
  - credentials
  - author page link
- Add JSON-LD:
  - FAQ schema on every post
  - HowTo schema on relevant posts
- Use `next-sitemap` for sitemap generation.

---

### 7.6 Auth + Dashboard

- Supabase Auth:
  - email/password
  - magic link option
- Dashboard features:
  - saved reports list
  - saved statements list
  - usage counter
  - upgrade CTA
- Report detail:
  - full constraint breakdown
  - PDF download
  - share link
- Billing:
  - Stripe Customer Portal link
- Dashboard UX standard:
  - clean and modern visual language inspired by Stripe/Notion dashboards
  - fast-scannable information hierarchy with clear sections
  - polished cards/tables/filters/search and consistent spacing/typography
  - high-quality empty, loading, and error states
  - quick global navigation between landing pages, blog, tools, and dashboard areas

---

## 8) Phase 2 Features (Build immediately after Phase 1 is complete)

1. Professional matching by postcode radius, monetized at `GBP 49/month`.
2. Planning Statement Pro:
   - unlimited statements for Pro/Agency
   - inline editor
   - version history
   - policy reference sidebar
3. Planning notice alerts by postcode based on application feeds.
4. Appeal probability scorer from refusal PDF analysis and appeal database matching.
5. LPA-specific landing pages for all 337 LPAs in England.
6. Building Regulations checker as a separate tool.
7. White-label API with plan-based API keys and rate limits.
8. Newsletter monetization with sponsored slots after 2,000+ subscribers.

---

## 9) SEO Strategy

### Domain Focus

- Primary B2C domain: `myplanningguide.co.uk`
- Primary B2B domain: `myplanningconsultant.co.uk`

### Rules

- One primary keyword target per blog post.
- URL pattern: `/blog/[keyword-slug]`.
- Programmatic local authority URL pattern: `/planning-permission/[lpaSlug]`.
- Required metadata on every page:
  - `title`
  - `description`
  - `og:image`
  - canonical URL
- JSON-LD schema:
  - `FAQPage`
  - `HowTo`
  - `Article`
  - `LocalBusiness` (homepage)
- Auto-generate `sitemap.xml` and `robots.txt` with `next-sitemap`.
- Connect Google Search Console from day one.
- Every post must include CTA and internal links to `/check`.
- Programmatic SEO pages must contain materially unique local value, not keyword/location swaps only.

### Programmatic LPA Landing Pages (SEO)

- Generate pages from a shared template + structured LPA dataset.
- Each page must include:
  - unique LPA-specific intro/context
  - local constraints summary and policy references
  - tailored FAQ content
  - internal links to `/check` and relevant blog posts
- Use unique page-level metadata and JSON-LD schema.
- Use ISR to keep pages fresh without full rebuilds.

### Initial 10 Post Slugs

1. `do-i-need-planning-permission-rear-extension`
2. `planning-permission-loft-conversion-uk`
3. `what-is-a-planning-statement`
4. `how-to-check-planning-constraints-uk`
5. `planning-permission-refused-what-to-do`
6. `permitted-development-rights-explained`
7. `how-long-does-planning-permission-take`
8. `planning-rules-conservation-area`
9. `do-i-need-planning-permission-garden-room`
10. `planning-application-documents-required`

---

## 10) Component and Codebase Structure

```txt
src/
  app/                          Next.js App Router
    (public)/                   Public layout group
      page.tsx                  Landing page
      check/page.tsx
      report/[shareToken]/page.tsx
      statement/page.tsx
      pricing/page.tsx
      blog/page.tsx
      blog/[slug]/page.tsx
      author/[slug]/page.tsx
      planning-permission/[lpaSlug]/page.tsx
      about/page.tsx
      contact/page.tsx
    (auth)/                     Auth layout group
      login/page.tsx
      signup/page.tsx
    (dashboard)/                Dashboard layout group
      dashboard/page.tsx
      dashboard/reports/page.tsx
      dashboard/reports/[id]/page.tsx
      dashboard/statements/page.tsx
      dashboard/subscription/page.tsx
      dashboard/settings/page.tsx
    (admin)/                    Admin layout group
      admin/page.tsx
      admin/users/page.tsx
      admin/posts/page.tsx
    api/
      check-constraints/route.ts
      generate-statement/route.ts
      generate-pdf/[reportId]/route.ts
      webhooks/stripe/route.ts
  components/
    ui/                         Base UI components
      Button.tsx
      Input.tsx
      Badge.tsx
      Card.tsx
      Modal.tsx
    shadcn/                     shadcn/ui wrappers and themed primitives
    layout/
      Nav.tsx
      Footer.tsx
      DashboardShell.tsx
      GlobalCommandMenu.tsx
    landing/
      Hero.tsx
      LogosBar.tsx
      HowItWorks.tsx
      FeatureSection.tsx
      Testimonials.tsx
      ProfessionalsSection.tsx
      PricingSection.tsx
      BlogPreview.tsx
      CTAStrip.tsx
    report/
      ConstraintTable.tsx
      ScoreGauge.tsx
      ReportCard.tsx
      PDFDownloadButton.tsx
    maps/
      ReportLeafletMap.tsx
    lpa/
      LPAHero.tsx
      LPAConstraints.tsx
      LPAFaq.tsx
      LPACTA.tsx
    dashboard/
      ReportsList.tsx
      StatementsList.tsx
      UsageStats.tsx
      UpgradeBanner.tsx
    blog/
      PostCard.tsx
      AuthorBio.tsx
      FAQSection.tsx
  lib/
    supabase/
      client.ts                 Browser client
      server.ts                 Server client
      middleware.ts
    stripe/
      client.ts
      products.ts               Price IDs + plan config
    planning/
      constraints.ts            Constraint check logic
      score.ts                  Approval score calculation
      lpa.ts                    LPA lookup utilities
    lpa/
      content.ts                Programmatic LPA content/template assembly
      seo.ts                    LPA metadata + schema helpers
    ai/
      statement.ts              Planning statement generation
      prompts.ts                System prompts
    pdf/
      generator.ts              PDF generation logic
    email/
      resend.ts
      templates/
  types/
    database.ts                 Supabase generated types
    planning.ts                 Domain types
  utils/
    cn.ts                       classnames helper
    format.ts
```

---

## 11) Coding Conventions

- Use Next.js Route Handlers under `src/app/api/`.
- Server Components by default; add `'use client'` only when needed.
- Supabase SSR auth uses `cookies()` in server client.
- Run typed Supabase queries only (generate DB types and keep updated).
- Verify Stripe webhook signatures with `stripe.webhooks.constructEvent`.
- API errors must return:
  ```json
  { "error": "string" }
  ```
  with appropriate HTTP status codes.
- Only expose client-safe env vars using `NEXT_PUBLIC_`.
- Store monetary amounts in pence integers (Stripe-native); display as pounds in UI.
- Use Tailwind utility classes (no inline styles in components).
- Use shadcn/ui as the default reusable component foundation, themed to this design system.
- Use `cn()` (`clsx` + `tailwind-merge`) for conditional class composition.
- Use `Suspense` and `loading.tsx` for loading states.
- Forms should use `react-hook-form` + `zod` validation.
- Keep navigation and layout components reusable across all major surfaces:
  - landing pages
  - LPA landing pages
  - blog
  - authenticated dashboard
- Global navigation should allow quick movement across key site areas with a consistent, clean IA.

---

## 12) Immediate Build Order (Must Follow)

Build sequentially. Do not skip ahead.  
Each step must be fully working before moving to the next.

| Order | Step |
| --- | --- |
| 1 | Project setup: Next.js app, Tailwind v4, Supabase client, env vars |
| 2 | Landing page: convert `website_template.html` to Next.js components exactly |
| 3 | Supabase schema: create all tables and enable RLS |
| 4 | `/check` page: address input, constraint API, free results UI |
| 5 | Email gate: lead capture modal before full results |
| 6 | Stripe one-off: `GBP 19` full report unlock |
| 7 | PDF generation: report PDF via `react-pdf` |
| 8 | `/dashboard`: basic auth and saved reports list |
| 9 | Subscription billing: Stripe subscriptions, webhooks, plan gating |
| 10 | `/statement` page: AI statement generation via Anthropic |
| 11 | Blog: Sanity schema, post pages, ISR |
| 12 | Admin: user management and core metrics |
| 13 | Programmatic LPA landing pages: shared template + LPA dataset + SEO metadata/schema |
| 14 | Report Leaflet map module: locked-interaction local context map in report views |

---

## 14) LPA Landing Page Specification

### Route
`/planning-permission/[lpaSlug]`

### Data Sources
- Primary: `lpa` table in Supabase (static/seeded data)
- Live: planning.data.gov.uk API (recent applications, constraint boundaries)
- Live: Historic England API (listed building count)
- Map: Leaflet with locked interaction (same config as report map)

### Page Sections (in order)

#### Hero
- Headline: "Planning Permission in [lpa.name]"
- Subheading: "[lpa.name] · [lpa.region]"
- Hero image: lpa.hero_image_url (fallback: regional stock image)
- Primary CTA: "Check your [lpa.name] address free" -> `/check?lpa=[lpa.slug]`

#### Key Stats Bar
- Conservation areas: lpa.conservation_area_count
- Listed buildings: lpa.listed_building_count
- Approval rate: lpa.approval_rate_percent%
- Average decision time: lpa.average_decision_weeks weeks

#### Constraint Overview
- Article 4 coverage level with explanatory callout if 'high'
- Green belt presence
- Flood risk level
- Locked Leaflet map showing constraint overlays for the authority area

#### Local Planning Context
- Current local plan: lpa.local_plan_name (adopted lpa.local_plan_adopted_date)
- Key policy notes: lpa.key_policy_notes
- Pre-application advice: shown if lpa.pre_app_advice_offered is true
- Links: lpa.website_url and lpa.planning_portal_url

#### Unique Introduction
- Render lpa.summary_paragraph
- This must be unique per authority - not a template swap

#### Recent Applications (live)
- Fetch last 10-15 applications from planning.data.gov.uk filtered by lpa_code
- Show: address, application type, status, date received
- Link to full application on council portal

#### FAQ (unique per LPA)
Generate 4 FAQ items using lpa fields:
1. "Do I need planning permission for an extension in [lpa.name]?"
2. "Does [lpa.name] have Article 4 directions affecting my property?"
   - show if article4_coverage is not 'none'
3. "How long does planning permission take in [lpa.name]?"
   - use lpa.average_decision_weeks if populated
4. "How do I contact [lpa.name]'s planning department?"
   - use lpa.planning_email and lpa.planning_portal_url

Add FAQ JSON-LD schema for all 4 questions.

#### Bottom CTA
- "Check your [lpa.name] address - instant constraints report"
- Button: -> `/check?lpa=[lpa.slug]`

### SEO Requirements Per Page
- `<title>`: "Planning Permission in [lpa.name] | MyPlanningGuide"
- `<meta name="description">`: unique, references approval rate and decision time
- Canonical tag: `https://myplanningguide.co.uk/planning-permission/[lpaSlug]`
- JSON-LD: FAQPage + LocalBusiness schema
- og:image: lpa.hero_image_url

### Generation Strategy
- Use `generateStaticParams()` to pre-build all LPA pages at build time
- ISR revalidation: `revalidate = 86400` (daily)
- Seed initial LPA data via a one-time script from planning.data.gov.uk
- Launch with 20 highest-population LPAs fully populated
- Remaining LPAs get placeholder summary_paragraph until manually reviewed

### Content Quality Rules
Each page must have materially unique content. The following must differ
per page and not be template variable swaps only:
- summary_paragraph
- key_policy_notes
- FAQ answer copy for questions 1 and 2
- Constraint overview commentary

Generic near-duplicate pages will be treated as low-value by Google.
Pages without a unique summary_paragraph should not be indexed.
Add `<meta name="robots" content="noindex">` to any LPA page where
summary_paragraph is null or empty.

---

## 13) Operating Principle

This file is the single source of truth for product, architecture, implementation standards, and sequence of delivery for MyPlanningGuide. Future sessions and developers should treat this document as the authoritative build reference unless an explicit revision is approved and committed.
