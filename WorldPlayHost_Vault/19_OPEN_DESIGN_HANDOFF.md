# Open Design Handoff

## Project Folder

```txt
/Users/arsenabduhalyk/Projects/DesignLab/open-design/.od/projects/worldplay-host
```

## Reported Generated Files

```txt
index.html
styles/shared.css
screens/home-spin-globe.html
screens/culture-arrival.html
screens/game-gol-ya-pooch.html
screens/result.html
```

## Reported Design Direction

```txt
Premium game night
Passport / travel details
Visible AI host
Dark polished tabletop
Ivory passport paper
Brass / amber stamp accent
Round-table chips
```

## Reported Screen Rhythm

```txt
Setup / Spin
Stamped Arrival
AI Host Intro
Playable Gol Ya Pooch Round
Result / Next Round
```

## Reported Validation

```txt
Static-only constraints checked
Links checked
ASCII normalized
HTTP 200 preview checked
Mobile overlap risk on arrival stamp fixed
```

## Known Limitation

Open Design could not capture browser screenshots because headless rendering was unavailable in its sandbox.

## Next Action

Visually inspect the Open Design project in the Open Design UI:

```txt
http://127.0.0.1:56181/
```

Implementation notes have now been extracted below. Use them as the production UI reference.

## Extracted Design Tokens

```css
--bg: oklch(13% 0.035 52);
--bg-2: oklch(18% 0.04 55);
--surface: oklch(23% 0.038 57);
--paper: oklch(96% 0.025 82);
--paper-2: oklch(91% 0.032 78);
--ink: oklch(18% 0.025 65);
--fg: oklch(96% 0.014 84);
--muted: oklch(73% 0.025 78);
--muted-dark: oklch(45% 0.03 65);
--border: oklch(36% 0.038 62);
--accent: oklch(74% 0.14 76);
--stamp: oklch(53% 0.18 31);
--teal: oklch(62% 0.12 178);
--violet: oklch(60% 0.12 298);
```

Typography:

```txt
Display: "Iowan Old Style", "Charter", Georgia, serif
Body: system sans
Mono: "SF Mono", ui-monospace
Body size: 16px / 1.45
Stage titles: clamp(46px, 8vw, 112px)
Mobile stage titles: clamp(44px, 14vw, 70px)
Card titles: 30px
Eyebrows: 10-12px mono uppercase
```

Spacing and shape:

```txt
Max shell: 1180px
Desktop gutter: 32px
Mobile gutter: 24px
Main screen padding: clamp(22px, 4.6vw, 58px)
Core gaps: 8, 10, 12, 14, 18, 22, 24, 40, 56
Buttons/chips: at least 44-46px tall
Cards: 14px radius
Demo shell: 18px radius
Gallery cards: 8px radius
Pills: 999px radius
Borders: 1px solid color-mix(... var(--border) ...)
Shadows: deep shell shadow and softer card shadow only
```

## Production Notes

### `app/page.tsx`

Render the actual product flow first, not a marketing page. Preserve:

```txt
Home -> Culture Arrival -> AI Host -> Gol Ya Pooch -> Result
```

If keeping any gallery for agents, make it secondary.

### `app/globals.css`

Move tokens into `:root`. Preserve:

```txt
radial dark tabletop background
subtle grid overlay
paper surfaces
mono numerics
responsive breakpoints at 980px and 680px
```

### `components/games/GolYaPooch.tsx`

The component should own:

```txt
selected hand
reveal state
score
round number
```

The UI must show:

```txt
clue text
two large hand choices
reveal
score
next-round action
```

Left/right choices must remain clear 44px+ controls.

### Future `SpinGlobe`

Preserve:

```txt
central globe
brass spin CTA
player count
vibe selector
AI Host status
visible 5-step demo progress
```

Animation can come later; static state must still explain the flow.

### Future `CultureArrival`

Preserve:

```txt
passport stamp
culture/game metadata
short caption
recommended game handoff
respectful compact copy
```

### Future `AIHostPanel`

Make AI visibly present through:

```txt
orb/avatar
label
captioned speech
mode/status rows
```

Never rely on audio.

## Top 10 Details To Preserve

1. First screen is usable product controls, not a landing hero.
2. Dark premium tabletop background.
3. Ivory passport paper surfaces.
4. Amber Spin the Globe primary action.
5. Red passport stamp motif.
6. Visible AI Host orb/avatar on key screens.
7. Sound-off readable captions.
8. Five-step progress: Setup, Stamp, Host, Round, Result.
9. Gol Ya Pooch hands as the playable center of the round.
10. Mono numerics for counts, scores, and step labels.

## Avoid

```txt
generic AI dashboard UI
long explanatory panels
overusing gradients or accents
hiding AI host behind text only
squeezed desktop layout on mobile
```

## Mobile Rules

```txt
Stack main stage above side cards below 980px.
At 680px, use one-column controls.
Use full-width nav actions.
Use 22px screen padding.
Use smaller stamp and smaller hand illustrations.
Keep all touch targets at least 44px.
Preserve sequence and progress indicator on narrow screens.
```

## Implementation Targets

```txt
app/page.tsx
app/globals.css
components/games/GolYaPooch.tsx
future components/globe/*
future components/host/*
```

## Implementation Guardrail

Open Design mockups are references only. Do not copy them into production blindly if they conflict with:

```txt
frozen data contracts
working Spin flow
mobile usability
build stability
60-second demo clarity
```
