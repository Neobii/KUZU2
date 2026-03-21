# KUZU — Next.js

Migrated from [KUZU Meteor](https://github.com/Neobii/KUZU) to Next.js with **MySQL**.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** MySQL with Prisma ORM
- **Auth:** NextAuth.js with credentials
- **Styling:** Bootstrap 3 + custom CSS

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and set:
   - `DATABASE_URL` — MySQL connection string (e.g. `mysql://root:password@localhost:3306/kuzu`)
   - `NEXTAUTH_SECRET` — Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` — App URL (e.g. `http://localhost:3000`)

3. **Create database and run migrations**
   ```bash
   # Create the database first (e.g. mysql -e "CREATE DATABASE kuzu")
   npm run db:push
   # Or use migrations: npm run db:migrate
   ```

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
| **Cron / polling** | `instrumentation.ts` — listener stats poll + auto-start scheduling (`node-schedule`). Set `ENABLE_CRON=false` to disable. |

### Environment (optional)

| Variable | Default | Purpose |
|----------|---------|---------|
| `ICECAST_STATUS_URL` | `http://138.197.2.189:8000/status-json.xsl` | Icecast JSON for listeners + “Radio Logik down” |
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
