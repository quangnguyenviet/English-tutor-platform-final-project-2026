# Design System: EnglishPath

> Semantic design language for Google Stitch — tutor-matching LMS with three roles (Admin, Tutor, Student).

---

## 1. Visual Theme & Atmosphere

**"Midnight Academic"** — A sophisticated, data-confident learning platform that bridges the precision of a speed-test dashboard with the warmth of a well-lit study room. The dark theme feels like a command center for tutors; the light theme feels like a clean classroom notebook. Neither is decorative — every element earns its presence through utility.

- **Density:** 6/10 — Information-dense enough for tutors managing multiple students, calm enough for students browsing their progress.
- **Variance:** 5/10 — Predominantly structured grid layouts with intentional asymmetric splits in dashboard stat rows. No uniform 3-column card grids; feature sections alternate between full-width, 2-col, and 3-col based on content priority.
- **Motion:** 4/10 — Restrained. Active-scale feedback on buttons, skeleton shimmer loaders, subtle fade-in entrances. Spring physics feel via `cubic-bezier(0.34, 1.56, 0.64, 1)` for interactive elements. No ambient floating or looping animations unless a component is actively "live" (e.g., a LIVE session indicator with pulse).
- **Dark theme personality:** Deep navy gradient (`#0a0a2e → #1a1a4e → #0d1b3e`), not a flat black void. Cyan (`#00bfff`) is a **secondary highlight-only** accent — used for glow rings on active live sessions, progress bars, and focus states. It is **not** a dominant surface color.
- **Light theme personality:** Cool off-white canvas (`#f8fafc`), white card surfaces, clean structural lines in slate-200.

---

## 2. Color Palette & Roles

### Light Theme

| Token | Hex | Role |
|---|---|---|
| **Canvas White** | `#F8FAFC` | Page background |
| **Pure Surface** | `#FFFFFF` | Card and container fill |
| **Slate Ink** | `#0F172A` | Primary text, Slate-950 equivalent |
| **Muted Steel** | `#64748B` | Secondary text, metadata, placeholders |
| **Whisper Border** | `#E2E8F0` | Card borders, structural lines |
| **Faint Fill** | `#F1F5F9` | Subtle section backgrounds, zebra rows |
| **Sky Accent** | `#3B82F6` | Primary CTAs, active states, focus rings, links — saturated blue, never purple |
| **Sky Accent Hover** | `#2563EB` | Button hover, link hover |
| **Sky Accent Light** | `#EFF6FF` | Light tint for active pill backgrounds |

### Dark Theme

| Token | Hex | Role |
|---|---|---|
| **Deep Canvas** | `#0A0A2E` | Page background (gradient start) |
| **Midnight Navy** | `#1A1A4E` | Gradient mid-point |
| **Deep Blue** | `#0D1B3E` | Gradient end |
| **Surface Glass** | `rgba(255,255,255,0.05)` | Card and sidebar backgrounds |
| **Surface Elevated** | `rgba(255,255,255,0.08)` | Hover states, elevated surfaces |
| **Starlight Text** | `#FFFFFF` | Primary text |
| **Nebula Text** | `#E2E8F0` | Secondary text, Slate-200 |
| **Muted Fog** | `#64748B` | Tertiary text, metadata |
| **Whisper Border Dark** | `rgba(255,255,255,0.10)` | Card borders, dividers |
| **Cyan Highlight** | `#00BFFF` | Secondary accent — live indicators, glow rings, progress fills, focus outlines |
| **Cyan Subtle** | `rgba(0,191,255,0.10)` | Tinted backgrounds for accent-tinted sections |

### Status Colors (both themes)

| Role | Light | Dark |
|---|---|---|
| Success/Emerald | `#10B981` / bg `#D1FAE5` | `#34D399` / bg `rgba(16,185,129,0.10)` |
| Warning/Amber | `#F59E0B` / bg `#FEF3C7` | `#FBBF24` / bg `rgba(245,158,11,0.10)` |
| Danger/Rose | `#EF4444` / bg `#FEE2E2` | `#FB7185` / bg `rgba(244,63,94,0.10)` |
| Info/Indigo | `#6366F1` / bg `#EEF2FF` | `#818CF8` / bg `rgba(99,102,241,0.10)` |

**Banned palette patterns:**
- No neon outer glows on buttons (glow is reserved for rare "live" indicators only)
- No purple/blue neon gradients on large areas
- No AI purple (`#8B5CF6`, `#A855F7`) as a primary accent
- No pure black `#000000` anywhere
- No "rainbow clutter" (mixing 4+ bright accent colors on a single card component). Neutral Slate tints (`bg-slate-100 text-slate-700`) must be used for secondary tags, filters, and metadata.

### Color Restraint & Palette Discipline
- **Rule of 1 Dominant Accent:** Standardize on Blue (`#3B82F6`) as the primary brand color for CTAs, active states, and primary indicators.
- **Strict Semantic Status Colors:** Red/Rose reserved strictly for urgent/destructive actions; Emerald for completed/paid success states; Slate/Blue for neutral metadata.
- **Background Palette Purity:** Card backgrounds must remain neutral white/slate, avoiding random colored background fills (purple, yellow, amber panels).

---

## 3. Typography Rules

- **Primary font:** `Inter` — accepted here as the project standard for readability at small sizes in data-heavy UIs. Rationale: educational app with multilingual users; legibility takes priority over distinctiveness. Pair with a monospace for numbers.
- **Monospace font:** `Geist Mono` for metrics, timestamps, IDs, and high-density numeric data. Loaded via Google Fonts (`Geist Mono` → fallback to `JetBrains Mono`). When density exceeds 7, all numbers use monospace.
- **Heading scale:** Track-tight, controlled. Hierarchy achieved through weight (600/700) and color contrast, not massive type scale.
  - Page titles: `text-2xl font-semibold text-slate-900 dark:text-white`
  - Section headings: `text-base font-bold text-slate-900 dark:text-white`
  - Card headings: `text-sm font-semibold text-slate-900 dark:text-slate-50`
- **Body text:** `text-sm`, line-height relaxed, max-width `65ch` for prose blocks.
- **Micro text:** `text-xs` for metadata, timestamps, badges, helper text. Never below `12px`.
- **Letter spacing:** Section labels use `tracking-wide text-[11px] uppercase` for nav dividers and section headers.

**Banned:**
- No Inter in premium marketing/landing contexts (this rule is waived for this data-driven LMS)
- No generic serif fonts — this is a dashboard/app context; serif is banned entirely
- No decorative gradient text on headlines

---

## 4. Component Stylings

### Buttons

| Variant | Light | Dark |
|---|---|---|
| **Primary** | `bg-blue-500 text-white hover:bg-blue-600` | Same — cyan gradient from Speedtest is reserved for special CTAs only (e.g., "LIVE" session buttons) |
| **Secondary** | `bg-slate-100 text-slate-900 hover:bg-slate-200` | `bg-slate-800 text-slate-100 hover:bg-slate-700` |
| **Ghost** | `text-slate-600 hover:bg-slate-100` | `text-slate-300 hover:bg-slate-800` |
| **Outline** | `border border-slate-200 text-slate-700 hover:bg-slate-50` | `border border-slate-700 text-slate-200 hover:bg-slate-800` |
| **Danger** | `bg-rose-600 text-white hover:bg-rose-700` | Same |

- All buttons: `active:scale-[0.98]` for tactile press feedback
- Sizes: `sm: px-3 py-1.5 text-sm`, `md: px-4 py-2 text-sm`, `lg: px-5 py-2.5 text-base`
- `disabled:opacity-50` always
- `gap-2` icon-to-label spacing
- Never use outer glow shadows on standard buttons

### Cards

- Border radius: `rounded-xl` (12px) — not too soft, not too sharp
- Borders: `border border-slate-200 dark:border-slate-800`
- Fill: white (light) / `rgba(255,255,255,0.05)` glass (dark)
- Shadow light: `box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)`
- Shadow dark: `box-shadow: 0 0 20px rgba(0,191,255,0.10), 0 4px 12px rgba(0,0,0,0.30)` — subtle cyan tint
- Padding: `p-5` default; use `padded={false}` for list-inside cards
- Cards are used when **elevation communicates hierarchy**. In dense list views (e.g., student list), replace with `border-t divide-y` row patterns.

### Inputs

- Label: above the input, `text-sm font-medium text-slate-700 dark:text-slate-300`, never floating
- Input height: `py-2 px-3`
- Light theme: `bg-white border-slate-200 text-slate-900`
- Dark theme: `bg-white/5 border-white/10 text-white`
- Focus: `border-blue-500` light / `border-cyan-400` dark + ring `0 0 0 2px rgba(0,191,255,0.20)`
- Placeholder: `text-slate-400 dark:text-slate-500`
- Error state: red border + `text-sm text-rose-600 dark:text-rose-400` below

### Badges / Pills

- Rounded: `rounded-full px-2.5 py-1 text-xs font-medium`
- Tone variants via background/text pairs from Status Colors above
- Active filter pills: filled with accent color; inactive: ghost outline

### Progress Bars

- Height: default `h-1.5`, small `h-1`
- Background: `bg-slate-100 dark:bg-slate-800`
- Fill: `bg-blue-500` light / `bg-cyan-400` dark (cyan here is appropriate — progress is a highlight)
- Border radius: `rounded-full`

### Avatars

- Rounded-full initials avatars with hash-based palette (blue/emerald/amber/rose/violet)
- Sizes: `sm h-8 w-8 text-xs`, `md h-10 w-10 text-sm`, `lg h-14 w-14 text-lg`
- Real photo avatars: `rounded-2xl object-cover` with ring border

### Loaders

- Skeleton shimmer: `bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 animate-pulse`
- Matches exact layout dimensions — no circular spinners in content areas
- Spinner icon (Lucide `Loader2` with `animate-spin`) only for inline actions (button loading states)

### Empty States

- Centered layout, icon + heading + description + optional CTA
- Icon: `size-12 text-slate-300 dark:text-slate-600`
- Heading: `text-sm font-semibold text-slate-700 dark:text-slate-300`
- Description: `text-xs text-slate-400 dark:text-slate-500`

---

## 5. Layout Principles

### App Shell

- **Sidebar:** Fixed `w-64`, full-height, `flex-col`. `border-r border-slate-200 dark:border-slate-800`. Logo at top, nav in middle (`flex-1 overflow-y-auto`), user footer at bottom.
- **Main area:** `min-w-0 flex-1 flex-col`. TopBar at top, then scrollable content with `overflow-y-auto`.
- **Content max-width:** `max-w-6xl mx-auto` with `px-6 py-8` padding.
- **AI Assistant panel:** Right-side `w-80` aside, slides in when open. Border-left divider.

### Grid System

- Stat cards row: `grid gap-4 sm:grid-cols-2 lg:grid-cols-4` (never 3 equal columns)
- Dashboard main layouts: `lg:grid-cols-5` with asymmetric splits (3+2, never 2+3 equal)
- 2-column layouts: `grid gap-6 lg:grid-cols-2` for balanced pairs
- No flexbox `calc()` hacks — CSS Grid only

### Hero Sections (Login Page)

- Centered vertically and horizontally: `flex min-h-screen items-center justify-center`
- Max-width container: `max-w-2xl`
- Asymmetric inside: logo + role cards in 3-column grid, then info banner below

### Responsive Collapse

- **Below `768px`:** All multi-column grids collapse to single column. Sidebar hidden (hamburger or slide-over). Stat cards: 2 columns on `sm`, 1 on `xs`.
- **Below `640px`:** Card padding reduces from `p-5` to `p-4`. Font sizes scale down via `clamp()` where critical.
- **No horizontal overflow on mobile** — a critical failure condition.

### Full-Height Sections

- Use `min-h-[100dvh]` for pages that need viewport height — never `h-screen` (iOS Safari catastrophic scroll jump)
- `100dvh` for the app shell outer wrapper

---

## 6. Motion & Interaction

### Spring Physics

- Interactive elements (buttons, cards) use `cubic-bezier(0.34, 1.56, 0.64, 1)` for overshoot feel on hover-in
- Active/press state: `scale-[0.98]` with `transition-transform duration-150`
- Spring defaults: `stiffness: 100, damping: 20` feel via CSS `cubic-bezier(0.34, 1.56, 0.64, 1)`

### Staggered Cascade

- List items mount with staggered `animation-delay` (50ms increments per item)
- Use `animation: fadeSlideIn 0.3s ease-out both` with CSS `@keyframes`
- Never mount lists instantly — always use cascade for 3+ items

### Entrance Animations

```css
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
```

### Perpetual Micro-Loops

- **LIVE session indicator:** `animate-pulse` on the LIVE badge and join button — this is the only allowed ambient loop
- **Grading queue count:** badge number uses a subtle scale pulse on mount
- No shimmer loops on non-loading elements

### Performance Rules

- Animate exclusively via `transform` and `opacity`
- Never animate `top`, `left`, `width`, `height`, `margin`, `padding`
- Grain/noise filters on fixed pseudo-elements only (`::before`, `::after` with `filter: url(#noise)`)
- Heavy animations (charts, AI panels) wrapped in Client Components to isolate re-renders

---

## 7. Anti-Patterns (Banned)

### Visual / Rendering
- **No emojis** in UI labels, headings, or badges — use Lucide icons exclusively
- **No pure black** `#000000` — use `#0F172A` (light text) or `#0A0A2E` (dark background)
- **No neon outer glow** on standard buttons — glow reserved only for LIVE session indicators
- **No AI purple** (`#8B5CF6`, `#A855F7`) as a dominant accent color
- **No generic Unsplash links** that may break — use `picsum.photos` with seeds, or SVG placeholders

### Typography
- **No Inter** in premium/editorial contexts (waived for this data-driven app — Inter is acceptable here)
- **No generic serif fonts** (`Times New Roman`, `Georgia`, `Garamond`, `Palatino`) — banned in all dashboard contexts
- **No decorative gradient text** on large headlines
- **No excessive type scale contrast** (huge 4xl headlines next to tiny 2xs body)

### Layout
- **No centered Hero sections** — use left-aligned or split-screen for primary content areas
- **No 3-column equal card grids** for feature sections — use asymmetric splits (3+2, 2+1, etc.)
- **No overlapping elements** — every element occupies its own clean spatial zone
- **No absolute-positioned stacking** of content — use proper CSS Grid and Flexbox
- **No flexbox percentage math** (`flex: 0 0 33.333%`) — use CSS Grid instead

### Content
- **No generic placeholder names** ("John Doe", "Acme Corp", "Nexus") — use realistic Vietnamese names
- **No fake round statistics** ("99.99% accuracy", "50+ students") unless they are actual mock data
- **No AI copywriting clichés:** "Elevate your learning", "Unleash your potential", "Next-Gen", "Seamless", "Game-changing"

### Interaction
- **No custom mouse cursors** — use system defaults
- **No bouncing chevrons** or "scroll to explore" filler UI
- **No circular spinners** in content areas — skeleton loaders only
- **No floating/hover parallax** on non-hero decorative elements

---

## 8. Role-Specific Visual Profiles

### Tutor Role
- **Personality:** Command-center confidence. Dense but organized.
- Sidebar: wide (w-64), shows student count badges and grading queue counts
- Dashboard: 4-stat top bar, student list with progress bars, upcoming sessions list
- Primary color emphasis: blue/cyan for "needs attention" items
- AI Assistant panel: right-side drawer, `w-80`, full content height

### Student Role
- **Personality:** Encouraging, progress-focused, slightly playful but not childish.
- Sidebar: locked-item indicators for unmatched students, progress-forward nav
- Dashboard: tutor cards with live session badges, multi-tutor filter pills
- Primary color emphasis: emerald for positive progress, amber for to-do items
- Marketplace: tutor discovery cards with avatar, subject, availability

### Admin Role
- **Personality:** Analytical, high-information, systematic.
- Dashboard: broad stat overview, activity feed, system health
- Tables: dense data rows with sortable columns
- No playful gradients — flat, confident surfaces

---

*This document is the single source of truth for Stitch screen generation. All new screens must adhere to the tokens, patterns, and bans above. Update this file before changing the visual language.*
