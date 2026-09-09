# N10-009 Curriculum Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the deployed Network+ study app materially more accurate and complete for the current CompTIA Network+ N10-009 objectives while keeping `main` untouched.

**Architecture:** Because the curriculum is embedded in a very large `src/App.jsx` and the available GitHub write interface replaces whole files rather than applying patches, generate a refreshed app source from the canonical `App.jsx` at dev/build time. A deterministic transformer will correct known doctrine errors and append verified N10-009 material to existing lessons, then write `src/App.refreshed.jsx`. `src/main.jsx` will import the generated file. This gives the deployed build updated curriculum without risking destructive partial edits to the monolith; later work can fully extract curriculum data into dedicated modules.

**Tech Stack:** React 19, Vite 8, Node.js ESM scripts, npm.

**Spec:** `docs/N10-009-CURRICULUM-AUDIT.md`

## Global Constraints

- Keep `main` unchanged; all work stays on `audit/n10-009-doctrine-refresh`.
- Preserve the current UI, progress storage key, lesson IDs, quiz behavior, and routing.
- Only add or correct curriculum claims that are supported by the current CompTIA N10-009 objectives or stable networking fundamentals.
- The generated source must be deterministic and fail loudly if an expected source anchor is missing.
- `npm run build` must generate the refreshed curriculum automatically before Vite builds.

---

### Task 1: Add curriculum refresh regression tests

**Files:**
- Create: `scripts/test-curriculum-refresh.mjs`
- Test: `scripts/test-curriculum-refresh.mjs`

**Interfaces:**
- Consumes: `src/App.jsx`
- Produces: assertions that define required corrections and required N10-009 additions in generated content.

- [ ] **Step 1: Write the failing test**

Create a Node script that generates/loads the refreshed source and asserts that stale phrases are absent and required N10-009 concepts are present: ARP boundary wording, nuanced TLS wording, reliable-not-guaranteed TCP wording, POP3 nuance, NFV, VPC, GRE, IPsec AH/ESP/IKE, VLSM, NAT64, FHRP, jumbo frames/MTU, BSSID/ESSID, 802.11h, IDF/MDF, IPAM, active-active/active-passive, and tabletop exercises.

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test-curriculum-refresh.mjs`
Expected: FAIL because the refresh generator and/or required refreshed curriculum do not yet exist.

- [ ] **Step 3: Commit the failing test**

Commit message: `test: define N10-009 curriculum refresh requirements`

### Task 2: Implement deterministic curriculum transformer

**Files:**
- Create: `scripts/generate-refreshed-app.mjs`
- Generate at runtime: `src/App.refreshed.jsx`

**Interfaces:**
- Consumes: `src/App.jsx`
- Produces: `src/App.refreshed.jsx`

- [ ] **Step 1: Implement exact doctrine corrections**

Replace the known stale statements with technically precise exam-safe wording for ARP, TLS, TCP reliability, and POP3/IMAP.

- [ ] **Step 2: Append current N10-009 coverage to existing lessons**

Use exact stable anchors in the current lesson text. Add concise sections covering:
- cloud/network virtualization: NFV, VPCs, security groups/network ACLs, cloud gateways, scalability, elasticity, multitenancy;
- tunneling and VPN concepts: GRE and IPsec AH/ESP/IKE;
- addressing/routing: VLSM, IPv6 dual stack, NAT64, FHRP, VIPs, subinterfaces, MTU/jumbo frames;
- wireless: BSSID, ESSID, autonomous vs lightweight APs, 802.11h;
- operations/physical: IDF/MDF, IPAM, EOL/EOS lifecycle, active-active vs active-passive, tabletop exercises.

- [ ] **Step 3: Add hard anchor checks**

Every replacement/append operation must verify its anchor exists exactly once; otherwise exit non-zero rather than silently producing a partial curriculum.

- [ ] **Step 4: Run regression test**

Run: `node scripts/test-curriculum-refresh.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: refresh student curriculum for N10-009`

### Task 3: Wire refreshed curriculum into development and production builds

**Files:**
- Modify: `src/main.jsx`
- Modify: `package.json`

**Interfaces:**
- Consumes: `src/App.refreshed.jsx`
- Produces: normal Vite app entry point using refreshed curriculum.

- [ ] **Step 1: Update `src/main.jsx`**

Import `./App.refreshed.jsx` instead of `./App.jsx`.

- [ ] **Step 2: Add generation lifecycle scripts**

Add `refresh:curriculum` and npm lifecycle hooks so `dev`, `start`, and `build` generate the refreshed app before Vite runs.

- [ ] **Step 3: Run doctrine regression checks**

Run: `node scripts/test-curriculum-refresh.mjs`
Expected: PASS.

- [ ] **Step 4: Run build**

Run: `npm ci && npm run build`
Expected: Vite production build succeeds.

- [ ] **Step 5: Commit**

Commit message: `build: deploy refreshed N10-009 curriculum`

### Task 4: Verify branch diff and deployment readiness

**Files:**
- Review only.

**Interfaces:**
- Consumes: branch diff versus `main`.
- Produces: deployment-readiness assessment.

- [ ] **Step 1: Confirm `main` is untouched**

Compare `main...audit/n10-009-doctrine-refresh` and verify the branch is only ahead.

- [ ] **Step 2: Verify curriculum requirements**

Run doctrine scanner and regression test; confirm no known stale phrases remain in generated student content.

- [ ] **Step 3: Verify production build**

Confirm `npm run build` succeeds from a clean install.

- [ ] **Step 4: Review final diff**

Ensure no unrelated UI or behavior changes were introduced.
