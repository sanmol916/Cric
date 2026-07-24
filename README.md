# 🏏 VoiceScore Cricket

A voice-powered cricket scoring app. Instead of tapping in every ball, the
scorer just **speaks what happened** — in Hindi, English or Hinglish — reviews
the changes the app proposes, edits anything that is wrong, and hits **Approve**
to apply it everywhere (batsman, bowler, team total and over count).

> Example: say _“rahul ne dusri bowl karwai aur pritam ne single run liya”_ and
> the app proposes: Rahul bowls another ball, Pritam +1 run, team score +1.
> Review → edit if needed → Approve.

Professional **black & red** theme, fully responsive, and your match is saved in
the browser automatically (localStorage) so a refresh never loses the score.

---

## ✨ Features

- **Voice input** (Web Speech API) with Hindi / Hinglish / English recognition.
- **Smart parser** that understands runs (single, do, chauka, chakka…), wickets
  (bold, catch, lbw, run out…), extras (wide, no-ball, bye, leg-bye) and matches
  spoken player names fuzzily against your team rosters.
- **Review-before-approve**: every voice command becomes an editable draft with
  a live before → after diff. Nothing changes until you approve.
- **Manual controls** for everything — striker/non-striker/bowler, run buttons,
  extras, dismissal type, strike swap and one-tap **Undo**.
- **Full scorecard**: batting card, bowling card and ball-by-ball commentary.
- **Two innings** with automatic target / required run-rate for the chase.
- **Auto-save** to the browser; **New match** resets everything.

---

## 🚀 Run it locally

You need **Node.js 18+** (Node 20/22 recommended).

```bash
# 1. install dependencies
npm install

# 2. start the dev server
npm run dev
```

Then open the URL Vite prints (usually **http://localhost:5173**) in
**Google Chrome or Microsoft Edge on desktop** — those browsers have the best
speech-recognition support. Allow microphone access when prompted.

### Build for production

```bash
npm run build      # type-checks and bundles into dist/
npm run preview    # serves the production build locally to verify
```

The `dist/` folder is a static site you can host anywhere (Netlify, Vercel,
GitHub Pages, S3, nginx…).

> 🎤 **Microphone note:** browsers only allow the mic on `http://localhost` or
> over **HTTPS**. If you deploy, make sure it is served over HTTPS or the mic
> button will not work.

---

## 📖 How to use

1. **Setup** — name both teams, add players (batting order), set overs, and press
   **Start match**.
2. **Set the field** — in the right-hand panel choose the striker, non-striker
   and bowler.
3. **Record a ball** — tap the 🎙️ mic and describe the delivery, e.g.:
   - `pritam ne chauka mara` → 4 runs to Pritam
   - `rahul ne over daala aur suresh ne single liya` → Rahul bowls, Suresh +1
   - `wide ball` → 1 wide, no legal ball counted
   - `pritam bold ho gaya` → wicket (bowled)
4. **Review** — tap **Review changes**. The app shows exactly what will change
   (score, overs, batter, bowler). Fix anything with the dropdowns / run buttons.
5. **Approve** — tap **Approve & apply**. Strike rotates automatically on odd
   runs and at the end of the over.
6. Made a mistake after approving? Use **Undo ball** in the control panel.

No mic or unsupported browser? Use **“Add ball manually”** or the
**“Enter commentary manually”** text box — everything works by typing too.

---

## 🗣️ Voice command cheat-sheet

| You say (Hindi / Hinglish / English)     | Interpreted as        |
| ---------------------------------------- | --------------------- |
| `single`, `ek run`, `1 run`              | 1 run                 |
| `do run`, `double`, `2`                  | 2 runs                |
| `chauka`, `char`, `four`, `boundary`     | 4 runs                |
| `chakka`, `chhakka`, `six`               | 6 runs                |
| `dot`, `zero`, no run word               | 0 (dot ball)          |
| `wide`, `no ball`, `bye`, `leg bye`      | extras                |
| `out`, `bold`, `catch`, `lbw`, `run out` | wicket + dismissal    |
| `<name> ne ... bowl / over / ball ...`   | sets the **bowler**   |
| `<name> ne ... run / mara / liya ...`    | sets the **striker**  |

Names are matched loosely, so small speech-recognition slips are tolerated, and
anything uncertain is flagged with a note in the review panel for you to fix.

---

## 🧱 Tech & project structure

- **React 19 + TypeScript + Vite**, no runtime UI dependencies.
- Event-sourced scoring: the source of truth is the list of `BallEvent`s per
  innings; all batting/bowling figures are **derived**, which makes undo,
  edit-before-approve and the diff preview reliable.

```
src/
  types.ts               # domain model
  lib/
    scoring.ts           # derive scorecard + diff preview (pure functions)
    parser.ts            # Hinglish/English voice command parser
    useSpeech.ts         # Web Speech API React hook
  store/
    matchStore.tsx       # match state (reducer) + localStorage persistence
  components/
    SetupScreen.tsx      # teams / players / overs
    Scoreboard.tsx       # big live score + chase target
    Scorecard.tsx        # batting/bowling tables + commentary
    VoicePanel.tsx       # mic + transcript + manual entry
    PendingChanges.tsx   # editable draft + diff + approve/cancel
    ControlPanel.tsx     # striker/bowler/swap/undo/innings controls
  App.tsx                # wiring
```

---

## ⚠️ Notes & limitations

- Speech recognition depends on the browser; Chrome/Edge desktop work best.
  Firefox/Safari may not support it — the manual entry fallback always works.
- Scoring rules are close to real cricket but intentionally pragmatic (e.g. a
  wide is not a legal ball and not faced by the striker; byes/leg-byes are not
  charged to the bowler; run-outs don’t credit the bowler). You can always edit
  a ball before approving, so edge cases are easy to correct.
