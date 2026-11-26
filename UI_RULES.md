UI RULES (apply to every screen)
- Tailwind v3 only. Do NOT upgrade Tailwind, Vite or React Router. Class-based dark mode (darkMode: 'class').
- All colors are CSS variables defined on :root and .dark, exposed in tailwind.config as rgb(var(--token) / <alpha-value>). Components use semantic classes (bg-surface, text-ink, border-line, bg-primary) and never hardcoded hex or per-component dark: duplicates.
- Do NOT edit the files of MagicBento, Counter, GooeyNav or ReflectiveCard (JS or CSS). Customize only through props and the `visual`/`children` slots. If one needs a change, tell me why first.
- Real data only. Empty, loading and error states everywhere.
- One accent color (navy & gold). Radii: 12 (inputs/buttons), 20 (cards). 8px spacing grid. Soft shadow in light mode; 1px border plus faint glow in dark mode. Inter for UI; at most one display serif for page titles, self-hosted via @fontsource.
- Layout: one PageContainer (max-w 1280, responsive horizontal padding). Grid children use min-w-0. No fixed heights on content. Text that can overflow truncates with a title attribute. No horizontal page scroll.
- Respect prefers-reduced-motion. Keyboard focus rings visible in both themes. Text contrast at least 4.5:1 (3:1 for large text) in both themes; verify and adjust the tokens below if needed.
- QA before reporting done: open the page in the browser at 360, 768, 1024, 1280 and 1536px width, in BOTH themes. Fix every overlap, clipping, and misalignment you see. List what you checked.

TOKENS (starting point)
token        | light    | dark
bg           | #FAF7F6  | #0D0A0C
surface      | #FFFFFF  | #161114
surface-2    | #F4EFEE  | #1F181C
line         | #E6DDDB  | #2D2327
ink          | #1B1417  | #F5EFF1
muted        | #6E6266  | #A99DA2
primary      | #800020  | #D4546F
primary-hover| #670019  | #E0708A
primary-soft | #F7E8EC  | #2A141B
on-primary   | #FFFFFF  | #1A0A0F
Semantic colors (success, warning, danger, info) get a light and dark variant each.

COMPONENT POLICY
- Only FREE React Bits components (reactbits.dev, JS + CSS variant). Never Pro. Component files are NOT edited; customize via props and slots only. Before using any component, read its page for current props and dependencies, then tell me the dependencies it adds.
- WebGL budget: visible at once <= 2 on desktop, <= 1 on mobile. Shader backgrounds ONLY on login/landing. Dashboards use a static token-based background.
- /login uses a simple header (logo + "Back to home") so GooeyNav is not mounted there.
- Every heavy component (Lanyard, Silk/Grainient, ReflectiveCard, GooeyNav) is lazy-loaded, paused when off-screen or tab hidden, and has a static fallback for: no WebGL, prefers-reduced-motion, and screens under 768px (Lanyard).
- Use the component map I provide. Do not add decorative effects beyond it. One effect per screen "moment".
- Text animations: Blur Text for page titles (once, on mount), Rotating Text and Shiny Text on the login page only.