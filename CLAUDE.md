

# MyPlanningGuide — Cursor Instructions

Read this file before every task. These rules apply to every file 
you create or modify in this project.

## Design System — Non-Negotiable

Every page and component must match website_template.html exactly.
That file is the visual source of truth. Open it and study it before 
building any UI.

### Font
- Outfit only, loaded via next/font/google
- Weights used: 300, 400, 500, 600, 700, 800
- Never use system fonts, Inter, or any other font

### Colours — use these exact values
- Background primary: #FFFFFF
- Background subtle: #F7F9F7  
- Background alt: #F0F4F1
- Text primary: #0A0F0C
- Text secondary: #4A5C50
- Text muted: #8FA896
- Border default: #E2E8E3
- Border mid: #C8D4CA
- Accent dark: #0B4D2C
- Accent mid: #126B3A
- Accent bright: #18A056
- Accent light: #EBF5EF
- Amber: #C49A3C
- Red: #D94040

### Tailwind v4 Token Reference
This project uses Tailwind v4 with CSS-first configuration.
All tokens are defined in src/app/globals.css using @theme inline.
Do NOT invent token names. Only use tokens that exist in globals.css.

CORRECT token classes to use:
- bg-background → #FFFFFF (page backgrounds)
- bg-secondary → #F7F9F7 (subtle backgrounds)  
- bg-muted → #F0F4F1 (alt backgrounds)
- text-foreground → #0A0F0C (primary text)
- text-muted-foreground → #4A5C50 (secondary text)
- text-muted-brand → #8FA896 (muted brand text)
- border-border → #E2E8E3 (default borders)
- ring → #C8D4CA (mid borders)
- bg-primary → #126B3A (accent mid green)
- text-primary → #126B3A
- bg-accent → #18A056 (accent bright green)
- text-accent → #18A056
- bg-brand-dark → #0B4D2C (dark green, used for hero/footer)
- bg-brand-light → #EBF5EF (light green tint)
- text-brand-dark → #0B4D2C
- bg-amber → #C49A3C (warning/flag colour)
- text-amber → #C49A3C
- bg-danger → #D94040 (fail/error colour)
- text-danger → #D94040

ARBITRARY values (use when no token exists):
- Use hex directly: text-[#0F7040], bg-[#EDFAF3] etc
- These always work in Tailwind v4

DO NOT use these (they don't exist as tokens):
- bg-accent-mid, bg-accent-bright, bg-accent-dark
- text-primary (conflicts — use text-foreground for body text,
  text-primary only for the green accent colour)
- Any token not listed above

PRIMARY CTA BUTTON (correct classes):
bg-gradient-to-br from-primary to-accent text-white
font-semibold px-6 py-3 rounded-lg shadow-md
hover:opacity-90 transition-opacity

CARDS (correct classes):
bg-background border border-border rounded-2xl shadow-sm p-6

TEXT INPUT (correct classes):
w-full border border-border rounded-lg px-4 py-3
text-foreground placeholder:text-muted-brand
focus:outline-none focus:ring-2 focus:ring-accent
focus:border-transparent bg-background

STATUS TAGS (use arbitrary values):
- Pass: bg-[#EDFAF3] text-[#0F7040]
- Flag: bg-[#FEF7E6] text-[#8A6010]  
- Fail: bg-[#FDECEA] text-[#991818]

DARK GREEN SECTIONS (hero, professionals, CTA):
bg-brand-dark text-white

DOT PATTERN (utility class already defined):
dot-bg (use this class name directly)

HERO GRADIENT (utility class already defined):
hero-mesh (use this class name directly)

### Spacing and Layout
- Page max width: max-w-5xl or max-w-4xl centered with mx-auto
- Page padding: px-6 md:px-8 on all pages
- Section padding: py-16 md:py-24
- Card padding: p-6 or p-8
- Gap between sections: space-y-8 or gap-6

### Component Patterns

CARDS:
bg-white border border-[#E2E8E3] rounded-2xl shadow-sm p-6

SECTION LABEL (always appears above headlines):
text-[#18A056] text-xs font-bold uppercase tracking-widest mb-3

HEADLINES:
text-3xl md:text-4xl font-extrabold text-[#0A0F0C] tracking-tight

BODY TEXT:
text-[#4A5C50] text-base font-normal leading-relaxed

MUTED TEXT:
text-[#8FA896] text-sm

PRIMARY CTA BUTTON:
bg-gradient-to-br from-[#126B3A] to-[#18A056] text-white
font-semibold px-6 py-3 rounded-lg shadow-md
hover:opacity-90 transition-opacity

OUTLINE BUTTON:
border border-[#C8D4CA] text-[#4A5C50] font-medium px-6 py-3
rounded-lg hover:bg-[#F0F4F1] transition-colors

TEXT INPUT:
w-full border border-[#E2E8E3] rounded-lg px-4 py-3
text-[#0A0F0C] placeholder-[#8FA896]
focus:outline-none focus:ring-2 focus:ring-[#18A056]
focus:border-transparent bg-white

STATUS TAGS:
- Pass: bg-[#EDFAF3] text-[#0F7040] text-xs font-semibold px-2 py-1 rounded
- Flag: bg-[#FEF7E6] text-[#8A6010] text-xs font-semibold px-2 py-1 rounded  
- Fail: bg-[#FDECEA] text-[#991818] text-xs font-semibold px-2 py-1 rounded

STATUS DOTS:
- Pass: w-2 h-2 rounded-full bg-[#18A056]
- Flag: w-2 h-2 rounded-full bg-[#C49A3C]
- Fail: w-2 h-2 rounded-full bg-[#D94040]

DOT PATTERN BACKGROUND (used on alternate sections):
bg-[radial-gradient(#0B4D2C12_1px,transparent_1px)]
[background-size:24px_24px]

HERO GRADIENT BACKGROUND:
bg-[radial-gradient(ellipse_70%_60%_at_65%_40%,rgba(24,160,86,0.09),transparent)]

### Page Structure Template
Every page must follow this structure:
```tsx
<main className="min-h-screen bg-white">
  <div className="max-w-4xl mx-auto px-6 md:px-8 py-12 md:py-20">
    {/* Section label */}
    <p className="text-[#18A056] text-xs font-bold uppercase tracking-widest mb-3">
      Label
    </p>
    {/* Headline */}
    <h1 className="text-3xl md:text-4xl font-extrabold text-[#0A0F0C] 
      tracking-tight mb-4">
      Headline
    </h1>
    {/* Body */}
    <p className="text-[#4A5C50] text-base leading-relaxed mb-8">
      Body copy
    </p>
    {/* Content */}
  </div>
</main>
```

### Navigation
- Always use the existing Nav component from src/components/layout/Nav.tsx
- Always use the existing Footer component from src/components/layout/Footer.tsx
- Every page must include both

### Rules
- Tailwind utility classes only — no inline styles, no CSS modules
- Use cn() from src/utils/cn.ts for all conditional classes
- Every component must be fully typed with TypeScript
- Mobile first — all layouts must work at 375px minimum
- Every page needs loading and error states
- Import and use existing components — never recreate something 
  that already exists in src/components/

## Architecture Rules

### API Routes
- All in src/app/api/
- Always validate input with zod before doing anything else
- Always return { error: string } with correct HTTP status on failure
- Always use the Supabase server client from src/lib/supabase/server.ts
- Never use the browser client in an API route

### Database
- Always import database types from src/types/database.ts
- Use TablesInsert<"tablename"> for insert operations
- Use Tables<"tablename"> for select results
- Never hardcode column names as plain strings without type checking

### Components
- Server components by default
- Add 'use client' only when you need useState, useEffect, 
  event handlers, or browser APIs
- Keep client components as small and low in the tree as possible

### Environment Variables
- Never hardcode API keys or secrets
- Client-safe vars: NEXT_PUBLIC_ prefix only
- Server-only vars: no prefix, only used in API routes and 
  server components

## File Locations
- Page components: src/app/(group)/pagename/page.tsx
- Reusable components: src/components/category/ComponentName.tsx
- Business logic: src/lib/category/filename.ts
- Types: src/types/filename.ts
- Utilities: src/utils/filename.ts

## Before You Build Any UI
1. Open website_template.html and identify the closest matching 
   section or component
2. Match it exactly — colours, spacing, typography, border radius
3. If no matching section exists, follow the component patterns 
   above precisely
4. Always ask: does this look like it belongs on the same site 
   as the landing page?

## When You Finish a Task
Always tell me:
1. Every file created or modified
2. What to test and how to verify it works
3. Any manual steps needed (Supabase, Stripe, etc.)
4. What is deliberately NOT built yet