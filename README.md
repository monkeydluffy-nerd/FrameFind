# PhotoVault

**PhotoVault** is a lightweight image-discovery app. Users search a topic (or tap a suggestion chip) and receive a responsive grid of freely licensed photos from Wikimedia Commons. Results can be saved to a personal collection in later phases.

## Design Decisions

1. **Sticky header with suggestion chips** — The header stays visible while scrolling so users can always start a new search or tap a quick-pick (Nature, Architecture, Wildlife, Portraits, Minimal) without scrolling back up. Chips reduce typing friction on mobile and expose the breadth of the collection immediately.

2. **Teal/amber palette with card-based grid** — Instead of the reference's purple theme, I chose a teal primary with amber accents for a fresh, editorial feel. The grid uses `repeat(auto-fill, minmax(240px, 1fr))` so cards are comfortably sized on desktop yet collapse to a single column on narrow screens — no media queries required.