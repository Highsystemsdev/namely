# Doc Renamer — Design Brainstorm

## Context
A professional productivity tool for mortgage brokers to upload, classify, and rename financial documents using AI. The tool needs to feel trustworthy, efficient, and clean — not flashy.

---

<response>
<probability>0.07</probability>
<text>

## Idea 1: Structured Utility — Swiss Grid Modernism

**Design Movement:** Swiss International Typographic Style meets modern SaaS utility

**Core Principles:**
1. Information density without clutter — every pixel earns its place
2. Strict typographic hierarchy using weight contrast, not size alone
3. Monochromatic base with a single high-contrast accent (teal)
4. Horizontal rule dividers and tight grid alignment as structural elements

**Color Philosophy:**
- Background: near-white `#F7F8FA` — clinical, clean, professional
- Surface: pure white `#FFFFFF` cards with 1px `#E2E6EA` borders
- Accent: deep teal `#0D9488` — trustworthy, financial, precise
- Text: near-black `#1A1D23` primary, `#6B7280` secondary
- Destructive: muted red `#DC2626`
- The palette communicates reliability and precision — appropriate for financial document handling

**Layout Paradigm:**
- Full-width header bar with tool name flush left
- Two-column split: left 65% = upload/document list, right 35% = detail/config panel
- Document list as a dense data table with alternating row shading
- Sticky action bar above the list

**Signature Elements:**
1. Monospace font for filenames and extracted data fields — reinforces technical precision
2. Confidence score rendered as a thin horizontal progress bar with color gradient (red→amber→green)
3. Variable chips in template editor styled as code tokens with subtle background

**Interaction Philosophy:**
- Drag-and-drop with a clear dashed border highlight on hover
- Row hover reveals inline action buttons (edit, download, remove)
- Accordion-style document detail expansion within the list

**Animation:**
- Upload drop zone: border color transition 200ms ease
- Document rows: fade-in + slide-up 150ms staggered on load
- Processing spinner: minimal rotating arc, not a full spinner
- Confidence bar: width transition 600ms ease-out on reveal

**Typography System:**
- Display/headings: `DM Sans` 600 weight
- Body: `DM Sans` 400
- Filenames/code: `JetBrains Mono` 400
- Scale: 13px body, 15px subheading, 20px heading, 28px page title

</text>
</response>

<response>
<probability>0.06</probability>
<text>

## Idea 2: Document-Native — Paper & Ink Metaphor

**Design Movement:** Editorial / Print-inspired with warm neutrals

**Core Principles:**
1. The interface feels like an organized filing system — physical metaphor
2. Warm off-white backgrounds evoke paper; subtle texture adds depth
3. Document cards mimic physical paper with soft drop shadows
4. Typography-first design — the content IS the interface

**Color Philosophy:**
- Background: warm parchment `#FAF8F5`
- Cards: `#FFFFFF` with warm shadow `rgba(60,40,20,0.08)`
- Accent: deep navy `#1E3A5F` — authoritative, financial
- Secondary accent: amber `#D97706` for highlights and confidence indicators
- Text: warm dark `#2C1810` primary
- The warmth makes the tool feel approachable despite handling serious financial documents

**Layout Paradigm:**
- Single-column centered layout with max-width 900px
- Upload zone as a large prominent card at top
- Document list below as stacked cards with clear visual separation
- Slide-out drawer for configuration (not modal)

**Signature Elements:**
1. Document type icons styled as minimalist file-type badges
2. Filename preview shown in a "label" style — like a physical file tab
3. Subtle paper texture on the background (CSS noise pattern)

**Interaction Philosophy:**
- Configuration in a right-side drawer that slides in without blocking content
- Inline editing of filenames with a pencil icon trigger
- Batch selection with checkbox column

**Animation:**
- Drawer: slide-in from right 300ms cubic-bezier
- Cards: gentle scale-up 0.98→1.0 on hover
- Upload processing: pulsing document icon

**Typography System:**
- Headings: `Playfair Display` 700 — editorial gravitas
- Body: `Source Sans 3` 400/600
- Filenames: `IBM Plex Mono` 400
- Scale: 14px body, 16px subheading, 22px heading

</text>
</response>

<response>
<probability>0.05</probability>
<text>

## Idea 3: Dark Command Interface — Terminal Meets Dashboard

**Design Movement:** Dark-mode developer tool / command palette aesthetic

**Core Principles:**
1. Dark background reduces eye strain during long document processing sessions
2. High information density with clear visual hierarchy through luminance
3. Monospace elements reinforce the "processing" and "technical accuracy" narrative
4. Accent colors used sparingly for maximum impact

**Color Philosophy:**
- Background: deep slate `#0F1117`
- Surface: `#1A1D27` cards with `#2A2D3A` borders
- Accent: electric cyan `#06B6D4` — processing, AI, technology
- Success: `#10B981` green for high confidence
- Warning: `#F59E0B` amber for medium confidence
- Text: `#E2E8F0` primary, `#94A3B8` secondary
- The dark palette signals precision tooling — this is serious software

**Layout Paradigm:**
- Left sidebar (240px) for configuration/settings, always visible
- Main content area: upload zone + document list
- Top bar with tool name, usage meter, and action buttons
- Full-height layout with no scrolling on the outer container

**Signature Elements:**
1. Terminal-style filename preview with syntax highlighting for variables
2. Processing state shown as a progress bar with percentage and status text
3. Confidence score as a circular gauge badge

**Interaction Philosophy:**
- Keyboard-first: all actions accessible via keyboard shortcuts shown in UI
- Command palette (Cmd+K) for quick actions
- Hover states use glow effects instead of background fills

**Animation:**
- Upload zone: animated dashed border on drag-over
- Processing: scanning line animation over document preview
- Row appearance: typewriter-style reveal for filename

**Typography System:**
- Headings: `Space Grotesk` 600/700
- Body: `Space Grotesk` 400
- Filenames/code: `Fira Code` 400
- Scale: 13px body, 15px subheading, 18px heading

</text>
</response>

---

## Selected Design: Idea 1 — Structured Utility (Swiss Grid Modernism)

**Rationale:** The mortgage broker context demands trust and professionalism. The Swiss grid approach delivers maximum information clarity without sacrificing polish. The teal accent aligns with Quickli's own brand language. Monospace filenames reinforce technical precision. This approach will feel familiar to power users while remaining approachable.
