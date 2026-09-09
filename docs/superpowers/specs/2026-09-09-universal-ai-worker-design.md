# Universal AI Worker Design

**Goal:** Use one Cloudflare Worker as a shared AI gateway for multiple apps, including Network+ and the Chore Tracker. Each client app sends its own message, session ID, and context; the Worker handles provider authentication, request normalization, and response normalization.

## Architecture

```text
Network+ app ---------\
                      \
Chore Tracker ----------> Universal Cloudflare Worker ---> OpenCode Go ---> GPT-5.6 Luna
                      /
Future apps ----------/
```

The Worker is intentionally application-agnostic. It does not contain Network+ curriculum logic or Chore Tracker business logic. The calling app owns its context and sends only the context relevant to that request.

## Endpoint

`POST /v1/chat`

Request body:

```json
{
  "message": "Explain why ARP is needed.",
  "sessionId": "networkplus-chat-123",
  "context": {
    "app": "networkplus",
    "currentLesson": "ARP",
    "quizScore": 70
  }
}
```

The same endpoint can receive Chore Tracker context:

```json
{
  "message": "Why do I have to clean my room?",
  "sessionId": "chore-kid-42",
  "context": {
    "app": "chore-tracker",
    "role": "kid",
    "ageGroup": "child",
    "currentChore": "Clean bedroom"
  }
}
```

## Worker Responsibilities

The Worker will:

1. Accept `POST /v1/chat`.
2. Accept `message`, `sessionId`, and optional `context` from the client.
3. Validate request shape and reject malformed requests.
4. Read `OPENCODE_GO_API_KEY` from a Cloudflare Worker secret.
5. Call the OpenCode Go Responses endpoint using GPT-5.6 Luna.
6. Send required provider headers:
   - `Authorization: Bearer <secret>`
   - `Content-Type: application/json`
   - `User-Agent: cabozu-ai-gateway/1.0`
   - `x-opencode-session: <stable sessionId>`
7. Forward the app-supplied context in the model input.
8. Normalize the provider response into `{ "text": "...", "sessionId": "..." }`.
9. Return generic errors without leaking provider credentials or raw secrets.
10. Handle CORS for approved app origins.

## Client Responsibilities

Each app decides what context the model should receive. Examples:

- Network+: current lesson, selected text, quiz score, weak topics, exam objective.
- Chore Tracker: kid/admin role, current chore, points/reward context, age-appropriate guidance.

The Worker does not query Supabase in the first version. Context is supplied by the caller.

## Security

`OPENCODE_GO_API_KEY` must be stored as a Cloudflare Worker secret and must never appear in frontend code or GitHub.

The first version will support an allowlist of browser origins for Network+ and Chore Tracker. A separate caller-authentication mechanism can be added later if the Worker must be callable by scripts, CLIs, or third-party clients outside those browser origins.

## Non-goals for v1

- No chatbot UI.
- No Supabase access from the Worker.
- No conversation database.
- No streaming responses.
- No model selector exposed to clients.
- No provider switching.
- No tools/function calling.
- No application-specific prompt logic beyond forwarding caller-supplied context.

## Deployment

The implementation will target the existing Cloudflare Worker service named `networkplushub`; it must not create a second Worker service. The repository currently has no Worker source/config committed, so the implementation must add a Worker entry point and Wrangler configuration that explicitly targets the existing Worker name.
