# Manual QA Script

Practical run-through for WorldPlay Host before recording the demo and submitting.

Run from a clean browser tab at `http://localhost:3000` (started via `npm run dev`).
Do not show terminal, `.env.local`, or API dashboards on screen.

---

## 1. 60-Second Happy Path

Goal: confirm the core loop runs end-to-end in under a minute.
Recommended demo path: spin to Mexico → Loteria (clearest silent visuals). See `09_VIDEO_DEMO_SCRIPT.md`.

```txt
[ ] Load http://localhost:3000 — product name and one-liner visible
[ ] Player count selector visible and changeable (set 3-4)
[ ] Vibe selector visible and changeable (set cultural or family)
[ ] Click Spin the Globe — globe visibly spins
[ ] Globe lands on a culture (Mexico preferred; up to 2 warm-up re-spins allowed)
[ ] Passport stamp appears for that culture
[ ] AI Host panel renders with provider badge (DeepSeek Live or AI Simulation Mode)
[ ] Cultural fact shown
[ ] Three recommended games shown with badges
[ ] Click the playable featured card (Loteria / Daruma / Gol ya Pooch / Adedonha) — game opens, not a placeholder
[ ] Game AI Host panel shows `DeepSeek Live` or `Simulation Mode`
[ ] Complete one quick round
[ ] AI Host comment changes during the round or result
[ ] Result / score / reveal is visible
[ ] Replay or "another game" option is reachable
[ ] Total time from spin to result ≤ 60s
```

Pass criteria: every line above is checked and nothing throws a visible error.

---

## 2. Spin the Globe Fallback Test

Goal: confirm the demo never breaks when AI is offline.

```txt
[ ] Stop the dev server
[ ] In .env.local, blank or comment out DEEPSEEK_API_KEY, OPENROUTER_API_KEY, OPENAI_API_KEY
[ ] Restart npm run dev
[ ] Spin the Globe
[ ] Globe still spins and lands on a culture
[ ] Passport stamp renders
[ ] AI Host badge reads "AI Simulation Mode" (or equivalent fallback label)
[ ] fallbackHostIntro text from culture pack appears
[ ] At least one cultural fact appears
[ ] Three recommended games appear (local candidates only)
[ ] No broken AI error banner is shown
[ ] Browser DevTools Network tab: POST /api/ai returns HTTP 200 with provider: "fallback"
```

Pass criteria: the loop works without any provider key set.

---

## 3. Gol ya Pooch Test

Goal: confirm the Iran hidden-choice game plays through one round.

```txt
[ ] Open Gol ya Pooch (Iran culture pack or direct card)
[ ] Rules / intro panel is readable
[ ] Hider can secretly choose left or right hand
[ ] AI Host / fallback bluff clue appears
[ ] AI status label shows DeepSeek Live or Simulation Mode
[ ] Guesser can choose LEFT or RIGHT
[ ] Reveal step shows which hand had the flower
[ ] Score updates for guesser or hider
[ ] AI Host comment / reaction appears (live or fallback)
[ ] Replay or next-round option appears
[ ] No console errors in browser DevTools
```

---

## 4. Daruma Test

Goal: confirm Daruma-san ga koronda freeze-and-move game runs.

```txt
[ ] Open Daruma-san ga koronda (Japan culture pack or direct card)
[ ] Chant / countdown phase plays
[ ] Players can move during the chant phase
[ ] Turnaround moment freezes input
[ ] Anyone moving when frozen is flagged out
[ ] Reach-the-wall / round-end condition is clearly shown
[ ] Result / winner state is shown
[ ] AI Host narration or comment appears
[ ] AI status label shows DeepSeek Live or Simulation Mode
[ ] Replay control works
[ ] No console errors in browser DevTools
```

---

## 5. Loteria Test

Goal: confirm the Mexico caller-board game plays through a round.

```txt
[ ] Spin lands on Mexico culture (or pick Mexico)
[ ] Loteria card appears among recommendations
[ ] Clicking the Loteria card opens the playable game
[ ] Intro/rules panel is readable
[ ] 3x3 tabla board appears
[ ] AI Cantor / fallback caller clue appears
[ ] AI Cantor status label shows DeepSeek Live or Simulation Mode
[ ] Calling a card adds it to called history
[ ] Only called matching cards can be marked
[ ] Row, column, or diagonal win detection works
[ ] Result screen shows calls used and marked cards
[ ] Replay works
[ ] User can return to recommendations without reload
[ ] No console errors in browser DevTools
```

---

## 6. Adedonha Test

Goal: confirm the Brazil letter-category game plays through one round.

```txt
[ ] Open Adedonha (Brazil culture pack or direct card)
[ ] Intro/rules panel is readable
[ ] AI Host status label shows DeepSeek Live or Simulation Mode
[ ] Random letter appears
[ ] Category inputs are visible
[ ] Timer runs during the play phase
[ ] STOP locks answers and ends the round
[ ] Score screen shows filled, empty, and duplicate states
[ ] Cumulative scoreboard updates
[ ] Next round and replay work
[ ] No console errors in browser DevTools
```

---

## 7. Lightweight Multiplayer Room Test

Goal: confirm the app reads as a server-backed party product without heavy auth.

```txt
[ ] Enter a guest name
[ ] Click Create Room
[ ] Room code appears
[ ] Product Pulse active rooms / players / events are visible
[ ] Open a second browser tab or window
[ ] Enter another guest name and join the same room code
[ ] First tab shows both players after polling
[ ] Spin the Globe in the room
[ ] Room now shows selected culture / selected game
[ ] Start a playable game
[ ] Room event count increases
[ ] No account signup, email, password, or profile step is required
```

Pass criteria: two anonymous players can share a room code and the server-backed state updates.

---

## 8. Mobile Viewport Checklist

Goal: confirm the demo is presentable on a phone-sized viewport.

Use Chrome DevTools device toolbar at iPhone 12 / Pixel 5 size.

```txt
[ ] Header and one-liner readable, not clipped
[ ] Player count and vibe controls reachable with thumb
[ ] Spin the Globe button is tappable, not cut off
[ ] Globe animation does not overflow the screen
[ ] Passport stamp readable at mobile width
[ ] AI Host panel text wraps cleanly, no horizontal scroll
[ ] Recommended game cards stack vertically and stay readable
[ ] At least one game (Gol ya Pooch, Daruma, Loteria, or Adedonha) is playable in portrait
[ ] No element is clipped behind a fixed footer or notch
```

---

## 9. Video Recording Checklist

Goal: ready the screen before hitting record. Mirror `09_VIDEO_DEMO_SCRIPT.md`.

```txt
[ ] Browser at 100% zoom, single tab
[ ] No extensions / bookmarks bar / notifications visible
[ ] Window sized to a clean 16:9 frame
[ ] No terminal, no code editor, no .env.local, no API dashboards in frame
[ ] Dev server already warm (Spin once before recording)
[ ] Audio off — video must be understandable without sound
[ ] Cursor visible and steady
[ ] Hit the beats from 09_VIDEO_DEMO_SCRIPT.md (00:00 → 01:00)
[ ] Total runtime ≤ 60 seconds
[ ] Product name, Spin button, passport stamp, AI Host badge, one playable round all visible in frame at the right times
[ ] Re-watch silent: product, AI moment, game, and result are all clear
```

---

## 10. Submission Checklist

Run the items from `14_SUBMISSION_CHECKLIST.md` one last time before submitting.

```txt
[ ] Open app in a clean browser
[ ] 100% zoom
[ ] No API keys or secrets visible anywhere on screen
[ ] Spin the Globe works
[ ] Fallback path works (verified in section 2)
[ ] At least one playable game works (Gol ya Pooch, Daruma, Loteria, or Adedonha)
[ ] Result / replay flow works
[ ] Mobile width quickly verified (section 8)
[ ] GitHub repo link ready
[ ] Live demo link ready (if stable)
[ ] 60-second video recorded and reviewed silent
[ ] README present with project description, AI usage explanation, and local run instructions
[ ] Emergency note from 14_SUBMISSION_CHECKLIST.md ready in case live deploy is down
```

When every box above is checked, the submission is ready.
