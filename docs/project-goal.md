Goals MVP - AI Agent Implementation Brief

## 0. Project Summary

Build the first working prototype of a mobile-first web app called "Sticker Goals".

The product idea:

Users create a goal as a sticker collection album.
Each goal has a fixed number of empty slots.
Every time the user completes one small step, they choose a sticker, write an optional note, and place the sticker into the next empty slot.
When all slots are filled, the goal is completed.

The MVP must validate one core question:

> After placing the first sticker, does the user want to continue filling the album?

This is not a generic todo app.
This is a goal album app with a collection/reward feeling.

---

## 1. Tech Stack

Use the following stack:

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui where useful
- Framer Motion for small completion animations
- Cloudflare Workers
- Hono for Workers API routing
- Cloudflare D1 for relational data
- Drizzle ORM for schema and queries
- Cloudflare R2 binding prepared, but do not make uploads mandatory in MVP
- Wrangler for local development and deployment

Do not use:

- Next.js
- Supabase
- Firebase
- Prisma
- Express
- Node-only libraries that do not work in Cloudflare Workers
- Native iOS/Android
- Complex AI features
- Social features
- Payment features
- User-generated sticker marketplace

---

## 2. MVP Scope

Implement only the first usable product loop.

The required loop:

1. User opens the app.
2. User creates a goal album.
3. User sees an empty sticker album.
4. User taps "Complete one step".
5. User chooses a sticker.
6. User optionally writes a short note.
7. User places the sticker into the next empty slot.
8. App saves the completion.
9. Album progress updates.
10. When all slots are filled, app shows goal completed state.

This loop must work end to end with persistent data in D1.

---

## 3. Authentication Decision for MVP

Do not implement full authentication in v1.

Use anonymous local user identity:

- On first visit, generate a UUID.
- Store it in localStorage as `sticker_goals_user_id`.
- Send it to the API through request body or header.
- All goals are scoped by this anonymous user id.

This allows testing the core product quickly.

Implementation rule:

```ts
const USER_ID_STORAGE_KEY = "sticker_goals_user_id";
```

Later versions can replace this with real authentication.

---

## 4. Product Principles

Follow these principles while implementing:

### 4.1 Mobile-first

The primary experience is phone-sized.

Design for:

- 390px width first
- touch interactions
- large tappable buttons
- comfortable spacing
- no dense desktop dashboard

Desktop should still work, but it is secondary.

### 4.2 Warm and lightweight

The app should feel gentle, not like productivity software.

Avoid aggressive language:

- Do not say "You failed"
- Do not show streak punishment
- Do not shame missed days
- Do not add leaderboards

Use soft copy:

- "贴上一张"
- "今天的小进度被收起来了"
- "又完成了一步"
- "这本收集册已经贴满了"

### 4.3 Collection over task management

The visual center is the sticker album, not a todo list.

The goal detail page should look like a collection album with slots.

### 4.4 Keep forms short

Goal creation must be fast.

Required fields only:

- Goal title
- Total steps
- Final reward, optional
- Theme

Do not ask for dates in MVP.

### 4.5 Stickers are memories

A placed sticker should have metadata:

- sticker image
- completion date
- optional note

Clicking a placed sticker should show these details.

---

## 5. Core User Stories

Implement the following user stories.

### Story 1: Create Goal Album

As a user, I can create a goal album by entering:

- title
- total steps
- optional final reward
- theme

After creation, I am redirected to the goal album page.

Acceptance criteria:

- Goal is saved in D1.
- `goal_slots` are created according to `total_steps`.
- Goal appears on dashboard.
- Empty album slots are visible.

---

### Story 2: View Dashboard

As a user, I can view all my goal albums.

Each goal card should show:

- title
- progress, for example `7 / 30`
- final reward if present
- status: active or completed
- button/link to continue

Acceptance criteria:

- Only goals belonging to current anonymous user are shown.
- Completed goals are visually distinct.
- Empty state is shown when no goals exist.

---

### Story 3: View Goal Album

As a user, I can open one goal album and see:

- title
- progress
- final reward
- sticker slot grid
- complete step button
- completed state when full

Acceptance criteria:

- Empty slots look like album placeholders.
- Filled slots show sticker images.
- Next empty slot should be subtly highlighted.
- Page works well on mobile.

---

### Story 4: Complete One Step

As a user, I can complete one step by:

- tapping "Complete one step"
- choosing a sticker
- writing an optional note
- confirming

The app should:

- insert a completion record
- fill the next empty slot
- increment completed step count
- update goal status if complete
- show a small success animation

Acceptance criteria:

- Completion is persisted in D1.
- Filled slot remains filled after reload.
- The app does not overfill an already completed goal.
- If goal is already completed, API rejects further completion.

---

### Story 5: View Sticker Detail

As a user, I can tap an already placed sticker and see:

- sticker image
- completion date
- note if present
- slot number

Acceptance criteria:

- Empty slots are not clickable or show a disabled state.
- Filled slots open a modal/sheet with completion details.

---

### Story 6: Goal Completed State

As a user, when the album is full, I see a completion state.

Show:

- congratulation message
- total completed steps
- final reward
- completed date
- sticker wall preview

Acceptance criteria:

- Goal status changes to `completed`.
- Completed state remains after reload.
- Complete button is hidden or disabled.

---

## 6. Pages and Routes

Use React Router or a simple client-side router.

Required client routes:

```txt
/
 /dashboard
 /goals/new
 /goals/:goalId
```

Recommended behavior:

### `/`

Landing page.

Show:

- product concept
- demo album preview
- primary CTA: "创建我的第一本目标册"

If anonymous user already has goals, CTA can go to `/dashboard`.

### `/dashboard`

Goal album list.

### `/goals/new`

Goal creation form.

### `/goals/:goalId`

Goal album detail page.

Completion flow can be implemented as a modal on this page. No separate route required.

---

## 7. API Design

Use Hono routes under `/api`.

All API responses should be JSON.

Use a consistent response shape:

```ts
type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};
```

### Required endpoints

```txt
GET    /api/health
GET    /api/stickers
GET    /api/goals?userId=:userId
POST   /api/goals
GET    /api/goals/:goalId?userId=:userId
POST   /api/goals/:goalId/complete
GET    /api/goals/:goalId/completions?userId=:userId
```

### POST `/api/goals`

Request:

```ts
{
  userId: string;
  title: string;
  totalSteps: number;
  finalReward?: string;
  theme?: string;
}
```

Validation:

- `userId` required
- `title` required, max 80 chars
- `totalSteps` integer between 1 and 100
- `finalReward` optional, max 120 chars
- `theme` optional, max 40 chars

Behavior:

- Create goal.
- Create `totalSteps` goal slots.
- Return created goal with slots.

### POST `/api/goals/:goalId/complete`

Request:

```ts
{
  userId: string;
  stickerId: string;
  note?: string;
}
```

Validation:

- `userId` required
- `stickerId` required
- `note` optional, max 240 chars

Behavior:

1. Verify goal exists and belongs to user.
2. Verify goal is not completed.
3. Find the first empty slot by `slot_index`.
4. Verify sticker exists.
5. Create completion record.
6. Update slot with sticker and completion id.
7. Increment completed steps.
8. If completed steps reaches total steps, set goal status to `completed` and `completed_at`.
9. Return updated goal with slots and new completion.

Important:

This operation must be treated as atomic as much as possible. Avoid partial updates.

---

## 8. Database Schema

Use D1 with Drizzle ORM.

Create tables:

- users
- goals
- goal_slots
- stickers
- completions
- rewards, optional for future use

For MVP, `rewards` table can be created but does not need a full UI.

### SQL reference schema

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  total_steps INTEGER NOT NULL,
  completed_steps INTEGER NOT NULL DEFAULT 0,
  final_reward TEXT,
  theme TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

CREATE TABLE IF NOT EXISTS stickers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  theme TEXT,
  image_url TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'normal',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stickers_theme ON stickers(theme);

CREATE TABLE IF NOT EXISTS goal_slots (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL,
  slot_index INTEGER NOT NULL,
  sticker_id TEXT,
  completion_id TEXT,
  status TEXT NOT NULL DEFAULT 'empty',
  created_at TEXT NOT NULL,
  filled_at TEXT,
  UNIQUE(goal_id, slot_index)
);

CREATE INDEX IF NOT EXISTS idx_goal_slots_goal_id ON goal_slots(goal_id);

CREATE TABLE IF NOT EXISTS completions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  goal_id TEXT NOT NULL,
  slot_id TEXT NOT NULL,
  sticker_id TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_completions_goal_id ON completions(goal_id);
CREATE INDEX IF NOT EXISTS idx_completions_user_id ON completions(user_id);

CREATE TABLE IF NOT EXISTS rewards (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL,
  title TEXT NOT NULL,
  trigger_step INTEGER NOT NULL,
  is_claimed INTEGER NOT NULL DEFAULT 0,
  claimed_at TEXT,
  created_at TEXT NOT NULL
);
```

---

## 9. Seed Data

Create at least 24 built-in stickers.

Sticker themes:

- study
- fitness
- reading
- money
- daily
- cute

Each sticker should have:

```ts
{
  id: string;
  name: string;
  theme: string;
  imageUrl: string;
  rarity: "normal";
}
```

For MVP, sticker images can be simple SVG files stored in:

```txt
public/stickers/
```

Do not block the MVP on R2 upload.

Use friendly, simple sticker visuals:

- star
- flower
- book
- pencil
- cat
- coffee
- shoe
- heart
- moon
- coin
- leaf
- cloud

SVG is preferred for MVP because it is lightweight and easy to ship.

---

## 10. R2 Usage in MVP

Prepare R2 binding in the project, but make uploads optional.

Do not spend time building complex upload flows unless the core loop is finished.

Recommended binding name:

```txt
STICKER_ASSETS
```

Future R2 use cases:

- user custom sticker upload
- completion photo upload
- generated completion card
- AI-generated stickers

In MVP, built-in stickers can be served from static assets.

---

## 11. Frontend Component Structure

Recommended structure:

```txt
src/
  app/
    App.tsx
    router.tsx
  components/
    Button.tsx
    Card.tsx
    EmptyState.tsx
    ProgressBar.tsx
    Modal.tsx
  features/
    goals/
      GoalCard.tsx
      GoalForm.tsx
      GoalAlbumPage.tsx
      GoalAlbumGrid.tsx
      GoalSlot.tsx
      CompleteStepModal.tsx
      CompletionDetailModal.tsx
      CompletedGoalPanel.tsx
      goalApi.ts
      goalTypes.ts
    stickers/
      StickerPicker.tsx
      StickerImage.tsx
      stickerApi.ts
      stickerTypes.ts
    user/
      anonymousUser.ts
  lib/
    apiClient.ts
    cn.ts
    dates.ts
    ids.ts
  worker/
    index.ts
    routes/
      goals.ts
      stickers.ts
      health.ts
    db/
      schema.ts
      queries.ts
      seed.ts
```

Keep UI components small and readable.

---

## 12. UI Requirements

### Visual direction

Use:

- soft background
- rounded cards
- subtle shadows
- large spacing
- playful but clean sticker grid
- gentle animation

Avoid:

- dense tables
- corporate dashboard feeling
- harsh colors
- gamified casino-like rewards
- ranking or competition UI

### Goal album grid

The sticker grid is the most important visual component.

Requirements:

- Responsive grid.
- Each slot is a rounded square or rounded rectangle.
- Empty slot has dotted border or pale placeholder.
- Filled slot shows sticker.
- Next empty slot has a subtle highlight.
- Filled slot is clickable.
- Empty slot is not treated as a task item.

Example layout:

```txt
[🌸] [📘] [   ] [   ]
[   ] [   ] [   ] [   ]
[   ] [   ] [   ] [   ]
```

### Completion animation

Use Framer Motion.

Minimum acceptable animation:

- After completion, modal closes.
- New sticker appears with scale/fade animation.
- Progress number updates.
- Small success message appears.

Do not overbuild animation.

---

## 13. Copywriting

Use Japanese or Chinese-friendly short copy. For this MVP, use Chinese UI text.

Suggested labels:

```txt
创建目标册
我的目标册
贴上一张
完成一步
选择贴纸
写一句记录
最终奖励
已贴满
继续贴贴
今天的小进度被收起来了
```

Error messages:

```txt
目标不存在
这本目标册已经完成了
请选择一张贴纸
标题不能为空
步数需要在 1 到 100 之间
```

---

## 14. Data Integrity Rules

Implement these rules:

1. A goal belongs to exactly one user.
2. A goal has `total_steps` slots.
3. A slot can be empty or filled.
4. A filled slot must have a sticker id and completion id.
5. A completion belongs to one goal, one slot, one sticker, and one user.
6. Completion should always fill the first empty slot.
7. Completed goals cannot receive more completions.
8. `completed_steps` must match the number of filled slots.
9. API must check `userId` ownership before returning or mutating data.

---

## 15. Error Handling

Frontend:

- Show friendly error messages.
- Do not crash on failed API request.
- Show loading states for create and complete actions.
- Disable submit buttons while request is pending.

Backend:

- Validate all request bodies.
- Return `400` for validation errors.
- Return `404` when goal or sticker is missing.
- Return `403` when user does not own the goal.
- Return `409` when trying to complete an already completed goal.
- Return `500` only for unexpected errors.

---

## 16. Implementation Order

Follow this exact order.

### Phase 1: Project setup

1. Create Cloudflare React + Vite project.
2. Add TypeScript strict settings.
3. Add Tailwind CSS.
4. Add Hono.
5. Add Drizzle ORM.
6. Configure Wrangler.
7. Add D1 binding.
8. Add optional R2 binding.

### Phase 2: Static frontend prototype

Before connecting the database, build UI with mock data:

1. Landing page
2. Dashboard
3. New goal form
4. Goal album page
5. Sticker grid
6. Complete step modal
7. Sticker detail modal
8. Completed goal panel

The mock UI should already feel like the product.

### Phase 3: D1 schema and seed

1. Add Drizzle schema.
2. Add migration.
3. Add seed stickers.
4. Verify D1 can query stickers and goals.

### Phase 4: API

Implement:

1. health route
2. stickers route
3. create goal
4. list goals
5. get goal detail
6. complete goal step
7. list completions

### Phase 5: Connect frontend to API

Replace mock data with real API calls.

Make sure:

- goals persist after refresh
- stickers persist after refresh
- anonymous user id persists in localStorage
- completion updates persist after refresh

### Phase 6: Polish core interaction

Focus on:

- album grid feeling
- completion modal
- new sticker animation
- completed state
- mobile layout

Do not add new features before this phase is good.

---

## 17. Local Development Commands

Use package manager consistently. Prefer pnpm.

Expected commands:

```bash
pnpm install
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm deploy
```

Add scripts to `package.json`.

---

## 18. Wrangler Configuration Requirements

The project should include `wrangler.jsonc` or `wrangler.toml`.

It must include:

- Worker name
- compatibility date
- D1 database binding
- R2 bucket binding, optional but prepared
- static assets config if using Workers Static Assets

Use clear binding names:

```txt
DB
STICKER_ASSETS
```

---

## 19. Environment Types

Define Worker environment types.

Example:

```ts
export type Env = {
  DB: D1Database;
  STICKER_ASSETS?: R2Bucket;
};
```

Use these types in Hono:

```ts
const app = new Hono<{ Bindings: Env }>();
```

---

## 20. Suggested API Client

Create a small frontend API client.

```ts
async function apiGet<T>(path: string): Promise<T> {}
async function apiPost<T>(path: string, body: unknown): Promise<T> {}
```

Centralize:

- JSON parsing
- error handling
- userId injection where appropriate

---

## 21. Testing and Verification

Add at least lightweight verification.

Manual test checklist:

### Create goal

- Create goal with title "日语学习"
- Set total steps to 10
- Set reward to "买一本漫画原版书"
- Confirm dashboard shows `0 / 10`

### Complete step

- Open goal
- Complete one step
- Select sticker
- Add note
- Confirm grid shows `1 / 10`
- Refresh page
- Confirm still `1 / 10`

### Complete all

- Complete all 10 steps
- Confirm status becomes completed
- Confirm complete button is disabled
- Confirm completed panel appears

### Ownership

- Change localStorage user id manually
- Confirm previous user's goals are not visible

### Error

- Try completing completed goal through API
- Confirm API returns conflict error

---

## 22. Non-goals for MVP

Do not implement these in v1:

- Real login
- Google login
- Apple login
- LINE login
- AI goal decomposition
- reminders
- push notifications
- friend system
- sticker exchange
- ranking
- streaks
- public sharing
- payment
- sticker marketplace
- admin dashboard
- complex analytics
- user upload UI
- multi-language system
- native mobile app

Keep the MVP focused.

---

## 23. Completion Definition

The implementation is complete when:

1. The app runs locally.
2. The app can be deployed to Cloudflare.
3. A new anonymous user can create a goal album.
4. The goal album creates the correct number of slots.
5. Built-in stickers are available.
6. The user can complete a step and place a sticker.
7. Completion data persists in D1.
8. Filled stickers remain after refresh.
9. The user can inspect a filled sticker.
10. The goal becomes completed when all slots are filled.
11. The UI is mobile-friendly.
12. The code is readable and organized.
13. No non-MVP features are added.

---

## 24. Product Quality Bar

The MVP should feel like:

> "I made a small goal album and I want to fill it."

Not like:

> "I created another todo list."

The most important screen is the goal album detail page.
The most important interaction is placing one sticker after completing one step.
Prioritize that interaction over every other feature.

```

你可以把这份文档原样给 Codex。
我建议第一轮让 Codex 只做到 **Phase 1 到 Phase 4**，跑通数据库和 API；第二轮再让它打磨 UI 和动画。
::contentReference[oaicite:5]{index=5}
```

[1]: https://developers.cloudflare.com/workers/framework-guides/web-apps/react/?utm_source=chatgpt.com "React + Vite · Cloudflare Workers docs"
[2]: https://developers.cloudflare.com/r2/?utm_source=chatgpt.com "Overview · Cloudflare R2 docs"
