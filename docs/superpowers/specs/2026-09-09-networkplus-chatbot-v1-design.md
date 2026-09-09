# Network+ Chatbot V1 Design

## Goal

Add the reusable AI chat experience to Network+ first so it can be live-tested before Chore Tracker deploys it.

## Scope

V1 is read-only. The assistant may explain Network+ material, help with the current lesson, quiz/lab/flashcard work, interpret saved course progress, and answer Network+ study questions. It will not mutate Network+ progress, reset data, mark lessons complete, award badges, or change application settings.

## Architecture

The existing Chore Tracker chat foundation is reused conceptually, adapted to Network+'s current React/Vite JavaScript codebase rather than introducing TypeScript solely for this feature.

```text
Network+ React UI
    ↓
Reusable chat shell (`src/chat/core/`)
    ↓
Network+ adapter (`src/chat/networkAdapter.js`)
    ↓
Same-origin Pages Function (`/api/chat`)
    ↓  forwards Cloudflare Access JWT server-side
CloudBot `/v1/network/chat`
    ↓
GPT-5.6 Luna via OpenCode Go
```

## Authentication and CloudBot relay

CloudBot's Network+ route requires the `Cf-Access-Jwt-Assertion` header. Browser JavaScript cannot safely obtain the Access JWT from the protected Network+ session, so the frontend will not call `https://ai.cabozu0987.us/v1/network/chat` directly.

Instead, add a Cloudflare Pages Function at `functions/api/chat.js`. Requests from the Access-protected Network+ site arrive at that function with Cloudflare's Access assertion header. The function validates only basic request shape, forwards the assertion and JSON body to CloudBot, and returns CloudBot's response. The frontend calls same-origin `/api/chat`, eliminating CORS and preventing authentication token exposure to application JavaScript.

The relay is intentionally narrow: POST only, no arbitrary upstream URL, no secrets embedded in the repository, and no write capability.

## Chat UI

- Persistent floating launcher in the lower-right corner.
- Mobile-first near-full-height bottom sheet/panel with safe-area spacing and input visible above the software keyboard.
- Compact floating panel on desktop.
- Close on app navigation/context changes while preserving the current transcript.
- Local transcript persistence for the current browser/day so reopening is immediate.
- No mascot.
- Styling is isolated under `src/chat/core/chat.css` and uses theme variables so the component can still be transferred to other apps.
- Guided opening choices:
  - `Help with this lesson`
  - `Quiz me`
  - `Explain a topic`
  - `What should I study next?`

Free-text input is always available.

## Network+ context

The adapter builds a small structured context object on each message rather than sending the entire application or rendered page. It may include:

- current screen/view when available;
- current week and lesson identifier/title when available;
- saved progress from `netplus_v3`;
- completed lesson IDs / quiz or flashcard progress when represented in saved state;
- high-level course totals derived from the current curriculum;
- selected lesson metadata needed to answer the current question.

The adapter must sanitize and bound context size. It must never send the full 200k-line-equivalent App source, whole lesson corpus, raw Supabase credentials, or unrelated browser storage.

For lesson-specific questions, the frontend may include the selected lesson's concise title/content excerpt or structured metadata needed to answer accurately. General conceptual questions are answered from the model's knowledge plus the supplied app state.

## Session behavior

- Generate one browser session ID per daily transcript.
- New local calendar day starts a clean transcript.
- Reopening on the same day restores the transcript.
- The Network+ V1 does not add new Supabase chat tables; the existing progress database remains untouched. Chat persistence is browser-local for this first live test.
- A later version may add server-side chat persistence if the live test proves useful.

## Error behavior

- Offline: existing transcript remains visible; sending is blocked with a clear message.
- 401 from relay/CloudBot: show that the Access session needs to be refreshed rather than silently retrying.
- 429: preserve transcript/input and show the retry message returned by CloudBot.
- 5xx/provider failure: preserve transcript/input and expose Retry.
- Never fake a delivered assistant response.

## Safety and boundaries

- Read-only V1.
- No arbitrary fetch proxy.
- No Access JWT returned to the browser.
- No CloudBot/OpenCode API keys in Network+ frontend or Pages Function.
- No modifications to the existing `network_progress` write path.
- No changes to CloudBot are required for V1.

## Files

Create:
- `src/chat/core/ChatWidget.jsx`
- `src/chat/core/chat.css`
- `src/chat/core/state.js`
- `src/chat/networkAdapter.js`
- `src/chat/NetworkChatMount.jsx`
- `functions/api/chat.js`
- chat unit tests under `scripts/` or a lightweight Node test path consistent with the existing repository.

Modify:
- `src/App.jsx` only at the narrow mount/context boundary.
- `package.json` only if a test script is needed; no new runtime dependency is expected.
- optional verification workflow under `.github/workflows/` if the repo does not already run build/lint checks on the feature branch.

## Testing

Required before merge/live deployment:

1. Adapter/context unit tests.
2. Daily transcript/cache state tests.
3. Pages Function request-method/body/auth-forwarding tests with mocked fetch/header data where practical.
4. `npm run test:curriculum` remains green.
5. `npm run lint` passes.
6. `npm run build` passes.
7. Manual mobile check: launcher, open/close, keyboard/input, guided choices, retry state.
8. Live Access-path check on the deployed branch/domain: same-origin `/api/chat` successfully reaches CloudBot without exposing the Access assertion to frontend code.

## Success criteria

A signed-in Network+ user can open the floating assistant from the live site, ask a Network+ question or use a guided choice, receive a CloudBot/Luna response grounded in current app context, close/reopen the chat without losing the day's transcript, and continue using the rest of Network+ with no changes to progress behavior.