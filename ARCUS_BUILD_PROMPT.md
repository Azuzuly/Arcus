# ARCUS — Build Instructions for Next.js

You are building **Arcus**, a production AI platform as a Next.js app (TypeScript + Tailwind CSS + App Router). This is already scaffolded with `create-next-app`. Your job is to build out the ENTIRE application.

## KEY CONSTRAINTS
- This is a Next.js 15 app with App Router (`src/app/`)
- Use TypeScript throughout
- Use Tailwind CSS for styling + CSS custom properties for the design tokens
- All AI calls go to **OpenRouter** (`https://openrouter.ai/api/v1/chat/completions`)
- API key stored in `localStorage` key `arcus_api_key` — NEVER hardcode keys
- The app name is **Arcus** everywhere. NEVER write "Monolith" anywhere.
- Client-side state lives in React context + localStorage
- Use `"use client"` directives where needed

## DESIGN SYSTEM

### Color Tokens (put in globals.css as CSS custom properties on :root)
```css
:root {
  --bg-void: #050505;
  --bg-base: #0A0A0A;
  --bg-surface: #111111;
  --bg-elevated: #161616;
  --glass-panel: rgba(124, 124, 124, 0.30);
  --glass-card: rgba(71, 64, 64, 0.20);
  --glass-input: #272020;
  --glass-input-alt: #2B3032;
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-border-hover: rgba(255, 255, 255, 0.15);
  --glass-hover: rgba(50, 50, 50, 0.70);
  --glass-sidebar: rgba(217, 217, 217, 0.10);
  --glass-button: rgba(217, 217, 217, 0.20);
  --glass-pill: rgba(132, 132, 132, 0.46);
  --glass-white: rgba(255, 255, 255, 0.20);
  --accent-blue: #3B82F6;
  --accent-blue-glow: rgba(59, 130, 246, 0.35);
  --accent-violet: #8B5CF6;
  --accent-lime: #C1FF72;
  --accent-lime-soft: #CEF7AE;
  --accent-red: #EF4444;
  --accent-red-dim: rgba(239, 68, 68, 0.15);
  --accent-red-border: rgba(239, 68, 68, 0.30);
  --text-primary: #FFFFFF;
  --text-secondary: #A1A1AA;
  --text-muted: #52525B;
  --text-placeholder: #3F3F46;
  --shadow-panel: 0px 0px 12.5px 13px rgba(0, 0, 0, 0.25);
  --shadow-modal: 0px 24px 80px rgba(0, 0, 0, 0.60);
  --shadow-card: 0px 4px 24px rgba(0, 0, 0, 0.40);
  --shadow-glow-blue: 0 0 20px rgba(59, 130, 246, 0.25);
  --radius-xs: 8px;
  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-xl: 28px;
  --radius-2xl: 32px;
  --radius-3xl: 40px;
  --radius-pill: 999px;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --dur-fast: 120ms;
  --dur-base: 200ms;
  --dur-slow: 320ms;
}
```

### Typography
- Google Fonts: Geist (300-700) + Geist Mono (400, 500)
- All UI: `font-family: 'Geist', -apple-system, sans-serif`
- Code: `font-family: 'Geist Mono', monospace`
- Body: 14px, line-height 1.5, weight 400
- NEVER use Inter, Arial, Roboto

### Glass Panel Pattern
All panels/cards/modals/dropdowns use:
```css
background: var(--glass-panel);
backdrop-filter: blur(22px) saturate(160%);
border: 1px solid var(--glass-border);
border-radius: var(--radius-3xl);
box-shadow: var(--shadow-panel);
```

## FILE STRUCTURE TO CREATE

```
src/
  app/
    layout.tsx          — root layout with fonts, metadata "Arcus"
    page.tsx            — main app shell (client component)
    globals.css         — design tokens + base styles + animations
  components/
    AppShell.tsx        — main layout: top nav + sidebar + content area
    TopNav.tsx          — logo, tab control (Home/Studio/Agent), user menu
    Sidebar.tsx         — new chat btn, chat history list, usage footer
    ChatView.tsx        — aurora bg, greeting, messages area, input bar
    ChatInput.tsx       — textarea, attach, web search, settings, send btn
    ChatMessage.tsx     — user/assistant message bubbles with markdown
    ChatSettings.tsx    — system prompt + parameter sliders panel
    ModelSelector.tsx   — floating panel with search, grouped models, details
    AuroraBackground.tsx — animated aurora + pine tree silhouettes
    SuggestionPills.tsx — horizontal pill row for empty chat state
    StudioView.tsx      — 3-panel layout for image/video generation
    AgentView.tsx       — workflow canvas with draggable nodes + SVG edges
    AgentNodeLibrary.tsx — categorized draggable node list
    AgentInspector.tsx  — node config panel
    SettingsModal.tsx   — full settings: account, appearance, memory, usage, about
    PricingModal.tsx    — Free vs Pro cards
    OnboardingFlow.tsx  — 3-step: welcome → API key → username
    CommandPalette.tsx  — Cmd+K fuzzy search
    Toast.tsx           — toast notification system
    MarkdownRenderer.tsx — safe markdown→HTML (bold, italic, code, tables, etc.)
    Modal.tsx           — reusable modal wrapper (close on ×, Escape, overlay click)
  lib/
    store.ts            — React context for AppState + localStorage persistence
    openrouter.ts       — API calls: chat completions (streaming), model list, key validation
    storage.ts          — localStorage helpers with debounced writes
    markdown.ts         — markdown parser (no external libs)
    utils.ts            — avatar color, initials, relative time, UUID, debounce
    types.ts            — TypeScript interfaces for Conversation, Message, Model, etc.
```

## CORE FEATURES TO IMPLEMENT (ALL MUST WORK)

### 1. Onboarding (shown when no API key in localStorage)
- Full-screen overlay, not closeable
- Step 1: Welcome with ◆ Arcus logo
- Step 2: API key input + verify via fetching models from OpenRouter
- Step 3: Username input with avatar preview
- On complete: save to localStorage, show main app

### 2. Top Navigation
- Left: ◆ (blue diamond) + "Arcus" text
- Center: segmented tab control — Home | Studio | Agent (white active pill)
- Right: avatar circle (colored by username hash, shows initials) + username + dropdown (Settings, Upgrade, Sign Out)

### 3. Sidebar (Home tab only)
- New Chat button with blue + icon
- Chat history from localStorage, sorted by updatedAt desc
- Each item: title (truncated), relative time, hover actions (rename, delete)
- Active item has blue left border
- Footer: usage bar (X/150 requests) + upgrade pill for free tier

### 4. Chat Interface (Home tab)
- Aurora animated background for empty chat state (3 gradient layers, pine tree SVG silhouettes)
- Greeting: "Hello there!" + "How can I help you today?"
- Model selector button (top center pill) → opens model selector panel
- Suggestion pills row above input (8 suggestions)
- Chat input: auto-expanding textarea, placeholder "Ask Arcus", Enter to send, Shift+Enter newline
- Bottom row: attach files, web search toggle, chat settings gear, send button (blue, appears when content)
- "Arcus can make mistakes" footer text
- Token counter (chars/4 estimate)

### 5. Streaming Chat
- POST to OpenRouter with stream:true
- ReadableStream + getReader() to render tokens live
- Typing indicator (3 animated dots) while waiting
- Auto-title after first response (silent API call: "Summarize in 5 words: [message]")
- Message actions on hover: Copy, Regenerate, Branch

### 6. Model Selector
- Floating glass panel, 720px wide, two columns
- Left: search + scrollable model list grouped by provider (collapsible groups)
- Right: model details (name, description, context window, costs, capabilities, Select button)
- Data from GET /api/v1/models with API key
- Favorites system (starred, stored in localStorage)

### 7. Chat Settings Panel
- System prompt textarea (Geist Mono)
- 6 parameter cards in 2x3 grid: Temperature, Max Tokens, Top P, Top K, Freq Penalty, Presence Penalty
- Each with slider + number input, two-way bound
- All values passed to API calls

### 8. Settings Modal
- Full-screen overlay, glass panel, two-column layout
- Left: avatar + username + nav (Account, Appearance, System Prompt, Memory, Usage, About)
- Account: name input, API key (masked), sign out
- Appearance: theme toggle, accent color swatches, font size slider
- Memory: enable toggle, memory items list, clear all
- Usage: request count, 30-day canvas chart, model breakdown table
- About: Arcus v1.0.0, Powered by OpenRouter

### 9. Rename & Delete Modals
- Rename: glass panel (border-radius 39px), input pre-filled, Cancel + Update buttons
- Delete: confirmation with chat name, Cancel + red Delete button

### 10. Pricing Modal
- Two cards: Free ($0, 150 req/day) and Pro ($19/mo, 2000 req/day)
- Free has [Current] disabled button, Pro has white [Go Pro] button

### 11. Studio Tab (3-panel layout)
- Left: model picker, prompt textarea, enhance prompt button, negative prompt, dimensions, style presets, quality, advanced settings, generate button
- Center: output gallery grid, empty state placeholder
- Right: generation queue + history
- Image generation via OpenRouter API

### 12. Agent Tab (workflow builder)
- Left: node library (categorized: Triggers, AI/LLM, Data, Integrations, Control Flow, Output)
- Center: infinite canvas with dot grid, pan (space+drag), zoom (scroll), draggable nodes, SVG bezier edges between ports
- Right: node inspector/config panel
- Toolbar: workflow name, Run/Stop/Save/Export/Import/Templates buttons
- Node execution engine: topological sort, sequential execution, status indicators
- 5 pre-built templates

### 13. Command Palette (Cmd/Ctrl+K)
- Overlay with search input, results grouped by Conversations/Actions/Models
- Keyboard navigable (arrows + Enter)

### 14. Toast System
- Fixed bottom-right, glass style with colored left border
- Types: success (green), error (red), warning (amber), info (blue)
- Auto-dismiss after 4s with progress bar animation

### 15. Keyboard Shortcuts
- Cmd+K: command palette
- Cmd+N: new chat
- Cmd+,: settings
- Cmd+/: toggle sidebar
- Escape: close modal
- Enter: send message
- Agent canvas: Space+drag pan, scroll zoom, Delete remove node, Cmd+Z undo

### 16. Additional Features
- Conversation branching (duplicate chat from a message point)
- Export chat as Markdown
- Markdown rendering: bold, italic, code (inline + fenced with copy button), headings, lists, blockquotes, tables, links — all sanitized
- File attachments: image thumbnails, text files as code blocks
- Artifact preview: code blocks with html/svg/css get a Preview button → sandboxed iframe

## ANIMATIONS (define in globals.css)
```css
@keyframes panelIn {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes msgIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes dot-pulse {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}
@keyframes aurora-move-1 {
  from { transform: translate(-10%, -10%) rotate(0deg); }
  to { transform: translate(10%, 15%) rotate(15deg); }
}
@keyframes aurora-move-2 {
  from { transform: translate(15%, 5%) rotate(0deg); }
  to { transform: translate(-5%, -15%) rotate(-10deg); }
}
@keyframes aurora-move-3 {
  from { transform: translate(-5%, 10%) rotate(0deg); }
  to { transform: translate(10%, -10%) rotate(20deg); }
}
```

## CRITICAL RULES
1. "Arcus" everywhere — NEVER "Monolith"
2. Nav shows REAL username from localStorage, not static text
3. All lists (chats, models, memory, usage) come from state/localStorage — no fake data
4. Streaming is mandatory for chat — ReadableStream + getReader()
5. Model list fetched live from OpenRouter API
6. All glass elements use real backdrop-filter: blur()
7. Border radii match spec exactly (panels 40px, inputs 25px, modals 39px, pills 10px)
8. All modals close on ×, Escape, AND overlay click
9. Agent canvas is REAL — draggable nodes, SVG edges, pan/zoom — not a placeholder
10. All API calls wrapped in try/catch, errors shown as toasts
11. localStorage writes debounced 300ms
12. Tab switching is instant (CSS display toggle + opacity transition)
13. Deterministic avatar color from username hash using these 8 colors: ['#3B82F6','#8B5CF6','#EC4899','#F59E0B','#10B981','#EF4444','#06B6D4','#84CC16']

## BUILD ORDER
1. Set up globals.css with all design tokens and animations
2. Create types.ts with all interfaces
3. Create store.ts with React context + localStorage
4. Create utility functions (utils.ts, storage.ts, markdown.ts, openrouter.ts)
5. Build OnboardingFlow
6. Build AppShell + TopNav + Sidebar
7. Build ChatView + ChatInput + ChatMessage + MarkdownRenderer
8. Build ModelSelector
9. Build ChatSettings
10. Build SettingsModal + PricingModal + rename/delete modals
11. Build Toast + CommandPalette
12. Build StudioView
13. Build AgentView + NodeLibrary + Inspector
14. Wire up keyboard shortcuts
15. Test the full flow: onboarding → chat → streaming → model selection → settings

Build EVERYTHING. No placeholders, no "TODO" comments, no stub functions. Every feature must be fully implemented and working.

When completely finished, run this command to notify me:
openclaw system event --text "Done: Built Arcus AI platform - full Next.js app with chat, studio, agent workflow builder, all working" --mode now
