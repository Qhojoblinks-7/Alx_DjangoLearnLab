# Design System

## Color Palette

### Foundation

| Category | Role / Use Case | Hex Code | Swatch | Notes | Applied |
|----------|----------------|----------|--------|-------|---------|
| Foundation | Primary Background | #FFFFFF | | Pure white for maximum brightness and contrast. | ✅ Added as CSS variable `--primary-bg` in index.css, added to Tailwind as `primary-bg`, and applied to all Page components (desktop and mobile), layout components, messaging components, UI components, and general components |
| Background | Secondary Background | #F7F9F9 | | A very slight off-white/light gray to create soft division without losing the "light" feel. | ✅ Added as CSS variable `--secondary-bg` in index.css and to Tailwind as `secondary-bg` |
| Text & Contrast | Primary Text | #0F1419 | | Near-black for maximum WCAG contrast ratio on white backgrounds. | ✅ Added as CSS variable `--primary-text` in index.css and to Tailwind as `primary-text` |
| Text & Contrast | Secondary Text | #536471 | | A medium-dark gray for lower visual priority, improving information hierarchy. | ✅ Added as CSS variable `--secondary-text` in index.css and to Tailwind as `secondary-text` |
| Action & Accent | Sport Accent (Primary Action) | #1DA1F2 | | A vibrant, recognizable cyan/sky blue. High visibility draws user attention to key actions. | ✅ Added as CSS variable `--sport-accent` in index.css and to Tailwind as `sport-accent` |
| Action & Accent | Accent Hover | #1A8CD8 | | Ensures user knows their click registered. | ✅ Added as CSS variable `--accent-hover` in index.css and to Tailwind as `accent-hover` |
| UI Colors | Border / Divider | #EFF3F4 | | Very light gray to define boundaries cleanly without being distracting. | ✅ Added as CSS variable `--border-divider` in index.css and to Tailwind as `border-divider` |
| UI Colors | Success/Positive | #00BA7C | | Standard green for positive feedback. | ✅ Added as CSS variable `--success` in index.css and to Tailwind as `success` |
| UI Colors | Error/Destructive | #F4212E | | Standard red for warnings/destructive actions. | ✅ Added as CSS variable `--error` in index.css and to Tailwind as `error` |
