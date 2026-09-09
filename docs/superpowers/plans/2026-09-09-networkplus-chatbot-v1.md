# Network+ Chatbot V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the reusable, read-only Network+ AI chatbot to the existing React/Vite app and route it safely through Cloudflare Pages to the existing CloudBot Network+ endpoint.

**Architecture:** A portable chat shell under `src/chat/core/` owns UI, local daily transcript state, and retry/offline behavior. A Network+-specific adapter builds bounded study context from `netplus_v3` and calls a same-origin Pages Function; the Pages Function forwards the Cloudflare Access assertion to `https://ai.cabozu0987.us/v1/network/chat`. The existing progress write path is untouched.

**Tech Stack:** React 19, Vite 8, JavaScript/JSX, Cloudflare Pages Functions, CloudBot, OpenCode Go / GPT-5.6 Luna.

**Spec:** `docs/superpowers/specs/2026-09-09-networkplus-chatbot-v1-design.md`

## Global Constraints

- V1 is read-only; chatbot code must not write Network+ progress.
- No CloudBot/OpenCode secrets in browser code or Pages Function.
- Do not return the Cloudflare Access assertion to browser JavaScript.
- Reuse custom chat primitives; no Easy Chat or new runtime dependency.
- Daily transcript persistence is browser-local for the live test.
- Keep context bounded and structured; do not send the whole curriculum/source or unrelated storage.

---

### Task 1: Daily chat state and bounded Network+ context

**Files:**
- Create: `src/chat/core/state.js`
- Create: `src/chat/networkContext.js`
- Create: `scripts/test-chat-state.mjs`

**Interfaces:**
- Produces `localDateKey()`, `dailyChatKey(date)`, `readTranscript(storage,date)`, `writeTranscript(storage,date,messages)`, `getDailySessionId(storage,date)`.
- Produces `buildNetworkContext({ storage, location, appContext, recentMessages })`.

- [ ] Write Node assertions for day-specific keys/session IDs, corrupt-cache fallback, bounded progress context, and exclusion of unrelated browser storage.
- [ ] Run `node scripts/test-chat-state.mjs` and verify it fails before implementation.
- [ ] Implement state helpers and a context builder that reads only `netplus_v3`, includes current app context when supplied, emits progress summary plus a bounded raw snapshot, and caps recent messages.
- [ ] Run the state test and verify PASS.

### Task 2: Reusable chat component and Network+ adapter

**Files:**
- Create: `src/chat/core/ChatWidget.jsx`
- Create: `src/chat/core/chat.css`
- Create: `src/chat/networkAdapter.js`
- Create: `src/chat/NetworkChatMount.jsx`

**Interfaces:**
- `ChatWidget({ adapter, theme })` consumes an adapter with `load()`, `send(message, transcript)`, `openingChoices`, `resolveChoice(choice)`.
- `createNetworkAdapter()` calls same-origin `/api/chat` with `{message, sessionId, context}`.

- [ ] Implement a clean floating launcher, mobile bottom-sheet/desktop panel, free-text composer, four guided choices, Escape/close behavior, local transcript restore, offline/error states, Retry, and draft preservation.
- [ ] Make adapter responses append only after a successful `/api/chat` response.
- [ ] Add Network+ theme tokens without coupling the base component to app-specific classes.

### Task 3: Cloudflare Pages relay

**Files:**
- Create: `functions/api/chat.js`
- Create: `scripts/test-chat-relay.mjs`

**Interfaces:**
- Export `onRequestPost(context)` and helper `relayNetworkChat(request, fetchImpl)` for tests.
- Forward `Cf-Access-Jwt-Assertion`, `Origin: https://network.cabozu0987.us`, JSON body, and response status/body.

- [ ] Write tests for missing Access assertion, invalid JSON/body, POST forwarding, and upstream error passthrough without returning the assertion.
- [ ] Run `node scripts/test-chat-relay.mjs` and verify failure before implementation.
- [ ] Implement the narrow POST-only relay with fixed upstream URL.
- [ ] Run relay tests and verify PASS.

### Task 4: Mount chatbot without disturbing generated curriculum app

**Files:**
- Modify: `src/main.jsx`

**Interfaces:**
- Render `<NetworkChatMount />` next to `<App />` inside the existing root so `App.jsx` / `App.refreshed.jsx` generation remains untouched.

- [ ] Import `NetworkChatMount`.
- [ ] Mount it as a sibling of `App` under `StrictMode`.
- [ ] Verify the curriculum refresh pipeline remains unchanged.

### Task 5: Verification scripts and CI

**Files:**
- Modify: `package.json`
- Create: `.github/workflows/networkplus-chatbot-v1-verify.yml`

**Interfaces:**
- Add `test:chat` and `verify:chatbot` scripts.

- [ ] Add `test:chat` to run both chat test files.
- [ ] Add `verify:chatbot` to run chat tests, curriculum tests, lint, and build.
- [ ] Add feature-branch CI using Node 20 and `npm ci` followed by `npm run verify:chatbot`.
- [ ] Run/observe GitHub Actions until tests, lint, curriculum checks, and production build are green.

### Task 6: Final branch audit

**Files:**
- Compare `main...feature/networkplus-chatbot-v1`.

- [ ] Verify no modifications to `src/progressCloud.js` or Network+ progress persistence behavior.
- [ ] Verify no keys/secrets were added.
- [ ] Verify the Pages relay is fixed-target and read-only.
- [ ] Verify final CI is green and record the feature branch SHA for live deployment testing.
