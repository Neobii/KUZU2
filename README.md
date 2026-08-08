# KUZU — Next.js

Migrated from [KUZU Meteor](https://github.com/Neobii/KUZU) to Next.js with **PostgreSQL** (e.g. [Neon](https://neon.tech)).

## Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** NextAuth.js — **Sign in** / **Sign up** on `/login` (email + password), optional Facebook; `POST /api/auth/register` creates accounts (first user becomes admin). **Forgot password** at `/forgot-password` (email reset link via [Resend](https://resend.com), or logged to the server console when `RESEND_API_KEY` is unset).
- **Styling:** **Tailwind CSS v4** + custom `globals.css` (KUZU dark theme)

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment variables** (required — without `DATABASE_URL`, sign-up and most routes will error)
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and set:
   - `DATABASE_URL` — **Pooled** Postgres URL (Neon dashboard → *Connection string* → *Pooled*)
   - `DATABASE_URL_UNPOOLED` — **Direct** URL (same place → *Direct*) — required for `prisma db push` / migrations
   - `NEXTAUTH_SECRET` — Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` — App URL (e.g. `http://localhost:3000`)
   - **Facebook (optional)** — `FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET` from [Meta for Developers](https://developers.facebook.com/). Add **Valid OAuth Redirect URI**: `{NEXTAUTH_URL}/api/auth/callback/facebook` (e.g. `http://localhost:3000/api/auth/callback/facebook`). When set, the login page shows **Sign up with Facebook**; new users are created in the DB by email. **If the database has no users yet, the first person who signs up (e.g. via Facebook) becomes an admin** (same as running the seed for the first account).
   - **Password reset (optional)** — `RESEND_API_KEY` and `EMAIL_FROM` (e.g. `KUZU <noreply@yourdomain.com>`). Without Resend, reset links print to the server log when you use `/forgot-password`.

3. **Apply schema to the database**
   ```bash
   npm run db:push
   # Or use migrations: npm run db:migrate
   ```
   (Neon creates the database for you; `db push` creates tables.)

4. **Seed initial admin user (optional)**
   ```bash
   SEED_ADMIN_EMAIL=admin@kuzu.fm SEED_ADMIN_PASSWORD=yourpassword npm run db:seed
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Admin, posts, CSV, profile

| Area | Where / API |
|------|-------------|
| **Admin UI** | `/admin/*` — layout + nav (Users, Producers, Shows, Tracks, Posts, Auto DJ, Statuses). Requires `isAdmin`. |
| **Posts (TipTap)** | Create/edit: `/admin/posts/new`, `/admin/posts/[id]/edit`. List: `/admin/posts`. `POST/PATCH/DELETE` → `/api/posts`, `/api/posts/[postId]`. Home respects `visibleBy` (`lib/post-visibility.ts`). |
| **CSV export** | `GET /api/export/tracks` (optional `?dateFrom=&dateTo=` ISO dates, `;` delimited). `GET /api/export/shows/[showId]/tracks` (tab-delimited). Auth required. |
| **Producer profile** | `/producer/profile`, `/producer/program-information` → `GET`/`PATCH /api/users/me` (JSON merge `profile` + `producerProfile`). |
| **Production statuses** | `/admin/production-statuses` + `/api/admin/production-statuses` (+ `[id]` PATCH/DELETE). |

## Implemented features (from Meteor app)

| Area | Implementation |
|------|----------------|
| **Forms & CRUD** | React Hook Form + Zod (`/edit-track/[id]`, `/edit-show/[id]`, feature requests, add track) |
| **Rich text** | TipTap (`TipTapEditor` on show description) |
| **Live show** | `/live-show` — start/stop track, autoplay, move up/down, default meta toggle, messages, recent tracks |
| **API methods** | `activate`, `deactivate`, `duplicate`, `startTrack`, position, `clearPlaytime`, autoplay, show meta, import Reaper, etc. |
| **Calendar** | FullCalendar (`/calendar`) — loads shows from `/api/calendar/shows` |
| **Stats** | Highcharts (`/kuzu-stats`) + listener hours API |
| **Track imports** | `/track-imports` — CSV via Papa Parse → `/api/import/reaper` |
| **Banners** | Armed show, Radio Logik down, live show strip (`LayoutBanners` + `/api/layout/banners`) |
| **Cron / polling** | Local dev: `instrumentation.ts` polls Icecast every 5 min. **Production (Vercel):** `vercel.json` cron hits `GET /api/cron/listeners` every 5 min. Set `CRON_SECRET` on Vercel. Set `ENABLE_CRON=false` to disable local polling. |

### Environment (optional)

| Variable | Default | Purpose |
|----------|---------|---------|
| `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` | — | Facebook OAuth; enables “Sign up with Facebook” on `/login` |
| `ICECAST_STATUS_URL` | `http://138.197.2.189:8000/status-json.xsl` | Icecast JSON for listeners + “Radio Logik down” |
| `CRON_SECRET` | — | Secures `/api/cron/listeners` on Vercel (auto-sent as Bearer token) |
| `BLOB_STORE_ID` | — | **Set automatically** when a Vercel Blob store is connected (OIDC auth). TipTap uploads use this in production. |
| `BLOB_READ_WRITE_TOKEN` | — | Legacy Blob token (optional fallback). Not shown when OIDC is enabled. |
| `ENABLE_CRON` | enabled | Set `false` to skip background jobs |
| `LISTENER_POLL_MS` | `300000` | Listener poll interval (ms) |

## Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database (dev) |
| `npm run db:migrate` | Run migrations |
| `npm run db:seed` | Seed admin user |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |

### `DATABASE_URL` / “Environment variable not found”

Next.js loads env from **`.env.local`** (or `.env`) in the project root.

1. Run `cp .env.example .env.local` (if you haven’t).
2. Set **`DATABASE_URL`** (pooled) and **`DATABASE_URL_UNPOOLED`** (direct) from your Neon project.
3. Run `npm run db:push`, then restart `npm run dev`.

**Prisma CLI** normally only reads `.env`, not `.env.local`. This repo’s `npm run db:*` and `build` use `scripts/prisma-env.cjs` to load **`.env` then `.env.local`** (same idea as Next.js), so `DATABASE_URL` / `DATABASE_URL_UNPOOLED` in `.env.local` work with `db:push`.

### Connection / SSL errors (Neon)

Use the exact strings from the Neon dashboard. If `db push` fails through the pooler, ensure **`DATABASE_URL_UNPOOLED`** is set to the **direct** connection string (non-pooler host).

## Testing

```bash
npm test
```

Show/track authorization (object-level access) — automated + manual QA checklist for contributors:

→ [docs/testing-show-access.md](docs/testing-show-access.md)

## REST endpoints (external integrations)

- `GET /api/tracking/current-track` — Current playing track
- `POST /api/tracking/insert` — Insert track (RadioLogik, etc.)
- `GET /api/tracking/last-tracks?numTracks=30` — Last N tracks
- `GET /api/tracking/has-messaging` — Messaging enabled for active show
- `POST /api/messages/insert` — Insert message

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home (posts feed) |
| `/track-lists` | Track lists |
| `/start-show` | Create/start show |
| `/live-show` | Live show control |
| `/show/[showId]/tracks` | Show tracks |
| `/addTrackToShow/[showId]` | Add track to show |
| `/producer/profile` | Producer profile |
| `/producer/program-information` | Default show info |
| `/producer/shows` | My shows |
| `/producer/messages` | Messages |
| `/calendar` | Calendar |
| `/kuzu-stats` | Listener stats |
| `/feature-requests` | Feature voting |
| `/admin/*` | Admin panels |

## Project structure

```
├── app/
│   ├── (app)/          # Authenticated pages
│   ├── (auth)/         # Login
│   └── api/            # API routes
├── components/
├── lib/
│   ├── prisma.ts       # Prisma client
│   ├── auth.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── seed.ts         # Seed script
└── types/
```
