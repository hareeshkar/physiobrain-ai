# PhysioBrain Mobile Editorial Redesign — Spec

## 1. Concept & Vision

PhysioBrain.AI is a clinical reasoning platform for physiotherapy education. The redesign transforms the existing brutalist desktop-first UI into an **editorial/luxury mobile-first** experience. Think Monocle magazine meets a premium medical journal — intelligent, trustworthy, refined, and effortlessly readable on any device.

**Core feeling:** A quiet confidence. Not flashy. The kind of app a senior physiotherapist would trust.

---

## 2. Design Language

### Aesthetic Direction
Editorial luxury — warm paper whites, refined serif headlines, generous whitespace, subtle shadows that feel like layers of quality paper.

### Color Palette (CSS Variables)
```css
--background: #FAFAF8;     /* Warm paper white */
--surface: #FFFFFF;        /* Pure white cards */
--ink: #1A1A1A;            /* Soft black — primary text */
--muted: #6B6B6B;          /* Warm gray — secondary text */
--accent: #C45D3E;          /* Terracotta — CTAs, highlights */
--subtle: #E8E8E4;         /* Barely-there borders/dividers */
--success: #2D7D5A;         /* Deep green — confirmations */
--error: #B84A3C;           /* Muted red — errors */
--surface-hover: #F5F5F2;  /* Card hover state */
```

### Typography
- **Display**: `Cormorant Garamond` (600, 700) — elegant serif headlines, section titles
- **Body**: `DM Sans` (400, 500, 600) — all body copy, labels, UI text
- **Mono**: `JetBrains Mono` (400) — timestamps, technical content, code

### Spatial System
- Base unit: 8px
- Mobile padding: 16-24px
- Card padding: 20-24px
- Gap between sections: 32-48px
- Border radius: 12px (cards), 8px (buttons), 24px (pills)
- Shadows: `0 2px 8px rgba(0,0,0,0.06)` (cards), `0 4px 16px rgba(0,0,0,0.08)` (elevated)

### Motion Philosophy
- Subtle, purposeful transitions (200-300ms ease-out)
- Staggered fade-in on page load (50ms delay between items)
- Soft accordion reveals (height + opacity)
- Skeleton shimmer animation for loaders
- No bouncy, aggressive, or playful motion

### Icon Library
Lucide React — consistent 1.5px stroke weight, 20-24px size

---

## 3. Layout & Structure

### Mobile-First Architecture
- **Single column** layouts as default
- **Bottom tab navigation** (4 tabs: Home, Create, History, More)
- **Floating action buttons** where appropriate
- **Collapsible accordion sections** to reduce scroll depth
- **Slide-up panels** for secondary content (clinical notes)

### Desktop Adaptation
- Max content width: 1200px centered
- 2-3 column grids where sensible
- Side-by-side panels in Simulator
- Top navigation transforms to sidebar on lg+ screens

### Page Structure
1. **Header**: Minimal — logo + contextual title only
2. **Content**: Scrollable, generous breathing room
3. **Navigation**: Bottom tabs on mobile, top nav on desktop
4. **Modals**: Centered with backdrop blur, soft shadows

---

## 4. Component Inventory

### 4.1 Spinner / Loading States

#### ElegantSpinner
- **Design**: Three concentric arcs, progressively revealing, in accent color
- **Size variants**: sm (20px), md (32px), lg (48px)
- **Animation**: Gentle rotation with opacity pulse, 1.2s duration

#### SkeletonLoader
- **Design**: Rounded rectangles with shimmer gradient animation
- **Usage**: KnowledgeEngine results area, session lists
- **Animation**: Left-to-right gradient sweep, 1.5s duration, infinite

#### InlineStatusLoader
- **Design**: Compact horizontal layout — spinner icon + status text
- **Usage**: Buttons with loading state, generation status messages
- **Text**: "Generating..." with animated ellipsis

### 4.2 Button

#### PrimaryButton
- Background: accent, text: white
- Border radius: 24px (pill)
- Padding: 14px 28px
- Font: DM Sans 600, 14px, uppercase tracking
- Shadow: subtle (0 2px 8px rgba(196,93,62,0.25))
- **States**: hover (darken 8%), active (scale 0.98), disabled (opacity 0.5), loading (spinner replaces text)

#### SecondaryButton
- Background: surface, text: ink
- Border: 1.5px solid subtle
- Same radius/padding as primary
- **States**: hover (background subtle), active (scale 0.98), disabled (opacity 0.5)

#### GhostButton
- No background, no border
- Text: muted, hover: ink
- Underline on hover

#### FloatingActionButton (FAB)
- Size: 56px circle
- Background: accent
- Icon: white, 24px
- Shadow: elevated (0 4px 16px rgba(0,0,0,0.15))
- Position: bottom-right, 24px from edges

### 4.3 Cards

#### BaseCard
- Background: surface
- Border radius: 12px
- Shadow: subtle
- Padding: 20px
- Border: none (clean)

#### FeatureCard
- Extends BaseCard
- Icon container: 48px circle, accent background at 10% opacity
- Title: Cormorant 18px 600
- Description: DM Sans 14px muted

#### SessionCard
- Extends BaseCard
- Left accent bar (4px, full height, accent color)
- Title: DM Sans 600 16px
- Meta: DM Sans 400 13px muted
- Status badge: pill style, not boxy

### 4.4 Form Elements

#### TextInput
- Height: 52px
- Border: 1.5px solid subtle
- Border radius: 8px
- Background: surface
- Padding: 0 16px
- Font: DM Sans 16px (prevents iOS zoom)
- **States**: focus (border accent, subtle shadow), error (border error), disabled (bg muted)

#### Textarea
- Same styling as TextInput
- Min height: 120px
- Resize: vertical only

#### Select
- Same as TextInput
- Dropdown icon: chevron-down, muted
- Custom arrow (no native)

#### PillToggle
- Container: subtle background, 24px radius
- Options: DM Sans 14px 500
- Active: accent background, white text
- Transition: 200ms background slide

#### ChipGroup
- Horizontal scroll container
- Chips: subtle background, 20px radius, 12px 16px padding
- Active chip: accent background, white text
- Gap: 8px

### 4.5 Navigation

#### BottomTabBar (Mobile)
- Height: 64px + safe area
- Background: surface (with top border subtle)
- 4 tabs max
- Icon: 24px, label: 11px
- Active: accent color, subtle scale

#### TopNav (Desktop)
- Height: 64px
- Logo left, nav center, actions right
- Border bottom subtle

### 4.6 Modals

#### BaseModal
- Centered, max-width 480px
- Border radius: 16px
- Backdrop: ink at 40% opacity with blur
- Enter: fade + scale from 0.95
- Exit: fade + scale to 0.95

### 4.7 Chat

#### ChatBubble
- User: accent background, white text, border-radius 16px 16px 4px 16px
- Patient: surface background, ink text, border-radius 16px 16px 16px 4px, subtle shadow
- System: accent at 10% background, accent text, centered, 8px radius
- Max width: 85%

#### ChatInput
- Fixed to bottom on mobile
- Background: surface
- Input: borderless, 52px height
- Send button: FAB style, accent

### 4.8 Accordion

#### BaseAccordion
- Header: full-width, flex between, padding 16px 0
- Border bottom: subtle
- Chevron: rotates 180deg on open (200ms)
- Content: overflow hidden, animate height

### 4.9 Status Badges

#### PillBadge
- Border radius: 24px
- Padding: 4px 12px
- Font: DM Sans 500 12px uppercase
- Variants: ongoing (muted bg), awaiting (yellow bg), completed (success bg), error (error bg)

---

## 5. Page-by-Page Specifications

### 5.1 App Shell
- BottomTabBar visible on mobile
- TopNav visible on desktop (lg+)
- Content area: full height minus nav

### 5.2 Dashboard (Home)
**Layout:**
- Hero: Full-width, 120px padding top, centered serif headline ("Master Clinical Reasoning"), subtext below
- Quick Modules: Horizontal scroll chips
- Features: Vertical stack of FeatureCards
- Recent Sessions: Vertical list of SessionCards

**States:**
- Empty: "No sessions yet" with soft illustration
- Populated: SessionCards with pull-to-load-more pattern

### 5.3 Case Generator
**Layout:**
- Single column, scrollable
- Case Style: PillToggle
- Template chips: horizontal scroll
- Form fields: SelectOrCustom with floating labels
- Terminology: PillToggle
- Submit: Full-width PrimaryButton

**States:**
- Default: form ready
- Generating: inline loading overlay
- Error: inline error message with retry

### 5.4 Simulator (Interactive)
**Mobile Layout:**
- Full-screen chat view
- Case Brief: collapsible accordion at top
- Chat: main scrollable area
- Clinical Notes: slide-up panel (swipe or button to reveal)
- Input: fixed bottom

**Desktop Layout:**
- Two-column: chat (flex-1) | sidebar (380px)
- Chat: same as mobile
- Sidebar: Case Brief + Clinical Notes stacked

**States:**
- Generating: ElegantSpinner centered with status text
- Active: full chat interface
- Error: inline error with retry (not modal)
- Ended: transition to FeedbackView

### 5.5 Book Style Exam
**Layout:**
- Header: minimal, module name + submit button
- Case Study: collapsible accordion
- Questions: numbered list
- Answer textarea: fixed height, expandable
- Submit: bottom sticky on mobile

**States:**
- Generating: ElegantSpinner with skeleton questions
- Active: form ready
- Submitted: read-only, success confirmation

### 5.6 Knowledge Engine
**Layout:**
- Search input: large, prominent
- Mode pills: centered, below search
- Results area: white card, below

**Inline Loading State (CRITICAL REQUIREMENT):**
- SkeletonLoader: 3-4 animated placeholder blocks
- Status text: "Generating evidence-based notes..."
- Below skeleton: "This usually takes 10-30 seconds"
- Error state: error card with "Try Again" button inline

**Results State:**
- Markdown rendered content
- Related topics: horizontal chip scroll

### 5.7 Translator
**Layout:**
- Title: centered, serif
- Direction toggle: centered pill
- Two text areas: stacked on mobile, side-by-side on desktop
- Translate button: circular FAB between areas

**States:**
- Idle: placeholder text in both areas
- Loading: spinner in FAB, subtle pulse on input area
- Success: translated text in output
- Error: inline error below output with retry

### 5.8 Feedback View
**Layout:**
- Header: status icon + title, close button
- Scrollable content:
  - Diagnosis card (if simulator)
  - Case study card (if exam)
  - Feedback card (markdown rendered)
  - Student work card (clinical notes or answers)
- Footer: "Back to Dashboard" button

**Loading State:**
- Centered ElegantSpinner (lg)
- Status text: "Analyzing your performance..."
- Subtext: "This may take a moment"

### 5.9 History
**Layout:**
- Header: "Session History"
- List: vertical SessionCards
- Empty: centered message + soft icon

### 5.10 API Key Modal
**Layout:**
- Centered card, backdrop blur
- Icon + title
- Description text
- Input: floating label style
- Submit: full-width PrimaryButton

---

## 6. Technical Approach

### Framework & Build
- React 18 + TypeScript
- Vite build tool
- Tailwind CSS (custom config for design tokens)
- Framer Motion for animations

### CSS Architecture
- CSS custom properties for all design tokens
- Mobile-first media queries
- No hardcoded colors in components

### Animation Implementation
- Framer Motion `motion` components for page transitions
- CSS keyframes for shimmer/spinner (performance)
- `prefers-reduced-motion` respected

### Mobile Optimization
- `viewport` meta with `width=device-width, initial-scale=1`
- `-webkit-tap-highlight-color: transparent`
- `touch-action: manipulation` on interactive elements
- Safe area insets for bottom nav

### Key Implementation Notes
- All loading spinners: use the new ElegantSpinner component
- KnowledgeEngine: must have inline skeleton + retry in results area
- Simulator error: inline retry, not modal dialog
- BookStyleExam error: inline retry, not modal dialog
- Touch targets: minimum 44px everywhere

---

## 7. Component File Map

| Component | File | Notes |
|-----------|------|-------|
| ElegantSpinner | `src/components/ui/ElegantSpinner.tsx` | New, shared |
| SkeletonLoader | `src/components/ui/SkeletonLoader.tsx` | New, shared |
| BaseCard | `src/components/ui/Card.tsx` | New, shared |
| PrimaryButton | `src/components/ui/Button.tsx` | New, shared |
| BottomTabBar | `src/components/ui/BottomTabBar.tsx` | New |
| Dashboard | `src/components/Dashboard.tsx` | Full rewrite |
| CaseGenerator | `src/components/CaseGenerator.tsx` | Full rewrite |
| Simulator | `src/components/Simulator.tsx` | No logic change, style only |
| InteractiveSimulator | `src/components/InteractiveSimulator.tsx` | Style + inline error |
| BookStyleExam | `src/components/BookStyleExam.tsx` | Style + inline error |
| KnowledgeEngine | `src/components/KnowledgeEngine.tsx` | Style + inline skeleton |
| Translator | `src/components/Translator.tsx` | Style + inline loading |
| FeedbackView | `src/components/FeedbackView.tsx` | Style + spinner |
| ApiKeyModal | `src/components/ApiKeyModal.tsx` | Style only |
| App.tsx | `src/App.tsx` | Add BottomTabBar |
| index.css | `src/index.css` | New design tokens |

---

## 8. Scope Boundaries

### In Scope
- Complete mobile-first redesign of all visible components
- New spinner/loading components
- Inline error handling in KnowledgeEngine, Simulator, BookStyleExam
- Bottom tab navigation

### Out of Scope (for this spec)
- Backend logic changes
- Database schema changes
- New feature functionality
- Testing infrastructure
