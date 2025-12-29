# Sprint 8: Token-baserad Säkerhetsarkitektur

## 🏗️ Systemöversikt

```
┌─────────────────────────────────────────────────────────────────┐
│                         ADMIN PANEL                              │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Organization Detail Page                               │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │  [Skapa Inbjudningslänk] Button                  │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Click
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER ACTION                                 │
│  actions/invitations.ts                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  createInvitation(orgId)                                │    │
│  │    1. Verify admin auth                                 │    │
│  │    2. Use Admin Client                                  │    │
│  │    3. INSERT INTO invitation_tokens                     │    │
│  │    4. Return URL: /onboarding?token=<UUID>              │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Returns URL
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     INVITATION LINK                              │
│  https://app.itbd.se/onboarding?token=a1b2c3d4-...              │
│                                                                   │
│  Shared with customer via email/chat                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Customer clicks
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SERVER COMPONENT                               │
│  app/onboarding/page.tsx                                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  1. Extract token from searchParams                     │    │
│  │  2. validateInvitationToken(token) ──────────┐         │    │
│  │  3. Returns verified org_id                  │         │    │
│  │  4. Fetch org data as Admin                  │         │    │
│  │  5. Fetch feature ideas as Admin             │         │    │
│  │  6. Render <OnboardingClient token={token}/> │         │    │
│  │     (NEVER pass org_id to client!)           │         │    │
│  └──────────────────────────────────────────────┼─────────┘    │
└─────────────────────────────────────────────────┼───────────────┘
                                                   │
                    ┌──────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                   TOKEN GATEKEEPER                               │
│  lib/auth/token-gate.ts                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  validateInvitationToken(token)                         │    │
│  │    1. Use Admin Client (bypass RLS)                     │    │
│  │    2. SELECT * FROM invitation_tokens WHERE token=?     │    │
│  │    3. Check: Token exists?                              │    │
│  │    4. Check: Not expired?                               │    │
│  │    5. Return: org_id (VERIFIED!)                        │    │
│  │    ❌ Throw: TokenValidationError if invalid            │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ org_id verified
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CLIENT COMPONENTS                              │
│  components/onboarding/                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  OnboardingClient                                       │    │
│  │    - Receives: token (NOT org_id)                       │    │
│  │    - useChat({ body: { token } })                       │    │
│  │                                                          │    │
│  │  SDRChat                                                 │    │
│  │    - Sends messages with token in body                  │    │
│  │                                                          │    │
│  │  PromptStarters                                          │    │
│  │    - Displays feature ideas                             │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ POST /api/onboarding-chat
                              │ Body: { token, messages }
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API ROUTE                                   │
│  app/api/onboarding-chat/route.ts                               │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  POST Handler                                           │    │
│  │    1. Extract token from body                           │    │
│  │    2. validateInvitationToken(token) ─────────┐        │    │
│  │    3. Get verified org_id                     │        │    │
│  │    4. Fetch org data as Admin                 │        │    │
│  │    5. Get system prompt                       │        │    │
│  │    6. Process AI chat stream                  │        │    │
│  │                                                │        │    │
│  │  🔒 SECURITY: Client CANNOT manipulate       │        │    │
│  │     which org AI talks about!                 │        │    │
│  └───────────────────────────────────────────────┼────────┘    │
└─────────────────────────────────────────────────┼──────────────┘
                                                   │
                                                   │ (reuses gatekeeper)
                                                   ▼
                                          [Token Gatekeeper]
```

---

## 🔐 Säkerhetsflöde

### Före Sprint 8 (OSÄKERT ❌)
```
URL: /onboarding/[orgId]
                │
                ▼
Client kan se org_id i URL
                │
                ▼
Client skickar org_id till API
                │
                ▼
❌ RISK: Client kan ändra org_id och få access till andra företag!
```

### Efter Sprint 8 (SÄKERT ✅)
```
URL: /onboarding?token=<UUID>
                │
                ▼
Server validerar token
                │
                ▼
Server härleder org_id (client ser aldrig detta)
                │
                ▼
Client får endast token
                │
                ▼
Client skickar token till API
                │
                ▼
Server validerar token IGEN
                │
                ▼
✅ SÄKERT: Omöjligt för client att manipulera vilket företag som visas!
```

---

## 🗄️ Databasschema

```sql
┌─────────────────────────────────────────────────────────┐
│                  invitation_tokens                       │
├─────────────────────────────────────────────────────────┤
│  token        UUID PRIMARY KEY (auto-generated)         │
│  org_id       UUID → organizations(id) ON DELETE CASCADE│
│  created_at   TIMESTAMP DEFAULT NOW()                   │
│  expires_at   TIMESTAMP DEFAULT NOW() + 30 days         │
│  used_at      TIMESTAMP (nullable, for tracking)        │
├─────────────────────────────────────────────────────────┤
│  CONSTRAINT: expires_at > created_at                    │
│  INDEX: idx_tokens_lookup ON (token)                    │
│  RLS: ENABLED (no anon policies)                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Components

### 1. Token Generator
**Fil:** `actions/invitations.ts`
- **Input:** `orgId` (from admin)
- **Output:** Secure URL with UUID token
- **Auth:** Requires authenticated admin user
- **Client:** Uses Service Role (Admin)

### 2. Token Validator (Gatekeeper)
**Fil:** `lib/auth/token-gate.ts`
- **Input:** `token` (UUID string)
- **Output:** `org_id` (verified)
- **Errors:** `TokenValidationError` with specific codes
- **Client:** Uses Service Role (Admin)

### 3. Secure Page
**Fil:** `app/onboarding/page.tsx`
- **Type:** Server Component
- **Input:** `searchParams.token`
- **Process:** Validates → Fetches → Renders
- **Output:** Client components with token only

### 4. Secure API
**Fil:** `app/api/onboarding-chat/route.ts`
- **Input:** `{ token, messages }`
- **Process:** Validates → Derives org_id → Processes AI
- **Security:** Ignores any `orgId` from client

---

## 🛡️ Security Layers

### Layer 1: URL Security
- ❌ Old: `/onboarding/[orgId]` → org_id exposed
- ✅ New: `/onboarding?token=<uuid>` → cryptographic token

### Layer 2: Database Security
- RLS enabled on `invitation_tokens`
- No policies for `anon` role
- Only Service Role can read/write

### Layer 3: Server-Side Validation
- Every request validates token
- Token → org_id derivation happens server-side
- Client never sees org_id

### Layer 4: Token Expiry
- Default: 30 days
- Automatic expiration check
- Clear error messages

### Layer 5: Frontend Isolation
- Client components only receive token
- No org_id in props
- No org_id in localStorage
- No org_id in URL

---

## 📊 Data Flow Diagram

```
┌─────────┐                    ┌──────────────┐
│  Admin  │───(1) Generate───▶ │   Database   │
└─────────┘                    │ (insert token)│
                               └──────────────┘
                                      │
                                      │ (2) Return token
                                      ▼
                               ┌──────────────┐
                               │  Invitation  │
                               │     URL      │
                               └──────────────┘
                                      │
                                      │ (3) Share
                                      ▼
┌─────────┐                    ┌──────────────┐
│Customer │───(4) Click URL───▶│    Server    │
└─────────┘                    │  (validate)  │
                               └──────────────┘
                                      │
                                      │ (5) Verified org_id
                                      ▼
                               ┌──────────────┐
                               │  Fetch Data  │
                               │  (as Admin)  │
                               └──────────────┘
                                      │
                                      │ (6) Render with token
                                      ▼
┌─────────┐                    ┌──────────────┐
│Customer │◀───(7) View────────│   Browser    │
│ (sees)  │                    │ (token only) │
└─────────┘                    └──────────────┘
     │                                │
     │ (8) Chat message               │
     └────────────────────────────────┘
                  │
                  │ (9) POST with token
                  ▼
           ┌──────────────┐
           │  API Route   │
           │  (validate   │
           │   again!)    │
           └──────────────┘
                  │
                  │ (10) AI Response
                  ▼
           ┌──────────────┐
           │   Customer   │
           └──────────────┘
```

---

## 🎯 Attack Vectors Mitigated

### ❌ Attack 1: URL Manipulation
**Before:** Change `/onboarding/org-123` to `/onboarding/org-456`
**After:** Token is cryptographic UUID, can't be guessed

### ❌ Attack 2: Client-Side Injection
**Before:** Modify `orgId` in API request body
**After:** Server derives org_id from token, ignores client input

### ❌ Attack 3: Token Reuse After Expiry
**Before:** N/A (no tokens)
**After:** Expiry checked on every validation

### ❌ Attack 4: Direct Database Access
**Before:** N/A
**After:** RLS blocks anonymous access to tokens table

### ❌ Attack 5: Token Enumeration
**Before:** N/A
**After:** UUID v4 = 2^122 possibilities, practically impossible to guess

---

## 🔄 Migration Path

### For Existing Users
1. Generate new tokens for all active pilots
2. Send new links via email
3. Old links will return 404 (safe failure)

### For Developers
1. Update any hardcoded links in documentation
2. Update any automated tests
3. Update any integration scripts

---

## 📈 Future Enhancements

### Phase 2: Token Management
- Admin UI to view all tokens
- Revoke tokens manually
- See usage statistics

### Phase 3: Advanced Features
- Single-use tokens
- Custom expiry dates
- Email automation
- Token analytics

### Phase 4: Multi-tenancy
- Tokens for specific users within org
- Role-based token permissions
- Audit logs

---

## 🎓 Key Learnings

1. **Never trust client input** - Always validate server-side
2. **Use cryptographic tokens** - UUIDs are better than sequential IDs
3. **Layer security** - Multiple checks at different levels
4. **Fail securely** - 404 instead of exposing error details
5. **Admin Client pattern** - Service Role for privileged operations

---

## 📚 Related Documentation

- `docs/sprint_8_implementation_summary.md` - Implementation details
- `docs/sprint_8_testing.md` - Testing procedures
- `docs/active_sprint.md` - Sprint specification
- `lib/auth/token-gate.ts` - Core validation logic
- `actions/invitations.ts` - Token management actions

