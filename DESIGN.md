# Design Brief: VIT Carpool App

**Tone**: Premium minimalism with startup energy — trustworthy, clean, intentional. Inspired by Uber/Airbnb ride-sharing UX adapted for Indian university students.

**Differentiation**: Mobile-first bottom navigation anchor; status badge system (Full→red, Cheapest→green, Urgent→orange); card-based ride listings with per-person cost automation; smooth micro-interactions for join/chat flows.

| Palette | Light | Dark |
|---------|-------|------|
| **Background** | 0.99 0 0 (white) | 0.12 0.01 200 (near-black) |
| **Foreground** | 0.15 0.02 200 (dark grey) | 0.95 0.02 200 (off-white) |
| **Primary** | 0.55 0.21 244 (#0EA5E9 sky blue) | 0.65 0.22 244 (bright blue) |
| **Secondary** | 0.65 0.15 170 (#14B8A6 teal) | 0.72 0.15 170 (bright teal) |
| **Accent** | 0.65 0.15 170 (teal) | 0.72 0.15 170 (bright teal) |
| **Destructive** | 0.55 0.22 25 (red) | 0.65 0.19 22 (bright red) |
| **Muted** | 0.93 0.01 200 (light grey) | 0.22 0.01 200 (dark grey) |

**Typography**:
- Display: General Sans (modern, geometric, tech-forward)
- Body: DM Sans (clean, friendly, highly readable at small sizes)
- Mono: Geist Mono (technical clarity for tracking IDs, fares)

| Zone | Treatment |
|------|-----------|
| **Header** | `bg-background border-b border-border` with optional shadow-sm |
| **Ride Cards** | `bg-card rounded-lg shadow-sm` with `card-hover` for lift effect |
| **Status Badges** | Semantic utilities (`.badge-full`, `.badge-cheapest`, `.badge-urgent`) with solid backgrounds, high contrast |
| **Bottom Navigation** | `bg-card border-t border-border` fixed at viewport bottom, rounded-t-lg |
| **Active States** | Primary color on CTA buttons, teal accents on secondary actions |

**Shape Language**: Rounded corners 16px base (`--radius: 1rem`); 12px for smaller components (`md`), 20px+ for hero sections. Minimal shadows (shadow-sm only), depth via layering and stroke weight, not blur.

**Motion**: Smooth transitions via `.transition-smooth` (0.3s cubic-bezier) on hover, focus, and state changes. Micro-animations: card scale on active, button feedback, badge fade-in. No excessive bounce or skew.

**Constraints**:
- Always use semantic token colors (`primary`, `secondary`, `accent`), never raw hex or arbitrary values
- Badge system replaces single-color design; use `.badge-*` utilities for status indicators
- Desktop responsive but mobile-optimized; bottom navigation on mobile, top navigation optional on tablet+
- Maintain 0.7+ lightness contrast (foreground on background) and 0.45+ on interactive elements

**Signature Detail**: Ride cards with split layout — left side route + fare info, right side seat progress bar + avatar stack + join CTA. On mobile, stacked vertically with consistent 16px padding. Per-person cost calculated and displayed prominently to drive decision speed.

