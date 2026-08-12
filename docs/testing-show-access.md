# Testing: show & track object-level authorization

This feature blocks signed-in users from managing shows, tracks, live controls, or messages they do not own or help on. Station ops (admin, board member, field producer) retain access to any show.

Implementation lives in `lib/show-access.ts` and is enforced on the show/track/live/message APIs plus the edit/tracks pages.

## Automated tests

```bash
npm test -- --run lib/__tests__/show-access.test.ts
```

Covers membership rules, producer-message write/clear policy, `requireShowAccess`, `requireTrackAccess`, and `requireLiveShowControl` (including 401/403/404 outcomes).

## Manual QA (recommended before merge)

Use at least three accounts:

| Account | Setup |
|---------|--------|
| **Owner** | Creates and owns a show with tracks |
| **Helper** | Set as `helperUserId` on that show |
| **Stranger** | Another signed-in user with no relation to the show |
| **Admin** (optional) | `isAdmin` (or board / field producer) |

### 1. Owner — full manage access

- [ ] Open `/show/{showId}/tracks` and `/edit-show/{showId}` — pages load
- [ ] Edit show details and save — succeeds
- [ ] Add / edit / reorder a track — succeeds
- [ ] Duplicate show — succeeds
- [ ] Activate (Go Live) and deactivate — succeeds
- [ ] While live: start a track, toggle autoplay / show meta — succeeds
- [ ] Start track on a different (non-live) show via API — **denied** (403); live autoplay continues

### 2. Helper — manage access; producer message clear-only

- [ ] Same show tracks / edit pages load
- [ ] Add or edit a track — succeeds
- [ ] Activate / deactivate — succeeds
- [ ] Clear an existing producer message on the live show — succeeds
- [ ] Set a new producer message (non-null text) — **denied** (403)

### 3. Stranger — blocked in UI and API

- [ ] Visit Owner’s `/show/{showId}/tracks` or `/edit-show/{showId}` — redirected away
- [ ] Visit Owner’s `/edit-track/{trackId}` — redirected away
- [ ] While logged in as Stranger, these should return **403** (DevTools Network or curl with session cookie):
  - `PATCH /api/shows/{showId}`
  - `DELETE /api/shows/{showId}`
  - `POST /api/shows/{showId}/activate`
  - `PATCH /api/tracks/{trackId}`
  - `DELETE /api/tracks/{trackId}`
  - `POST /api/live/autoplay`
  - `POST /api/live/show-meta` (with active show id)
- [ ] Confirm Owner’s show and tracks are unchanged

### 4. Station ops — override

- [ ] Admin (or board / field producer) can open and edit another user’s show
- [ ] Can activate that show
- [ ] Can set a producer message on the live show

### 5. Live + messages

- [ ] With no show live: `GET /api/messages/active-show` returns `[]`
- [ ] With Owner live: Owner / Helper / Admin can read messages and mark read / delete
- [ ] Stranger gets **403** on active-show messages, mark-read, and message delete for that show
- [ ] Clear highlighted tracks only affects tracks on the **active** show

## Expected access matrix

| Actor | Manage show / tracks | Write producer message | Clear producer message | Live controls (active show) |
|-------|----------------------|------------------------|------------------------|-----------------------------|
| Owner | Yes | No | Yes | Yes (own show) |
| Helper | Yes | No | Yes | Yes (helped show) |
| Station ops | Yes (any) | Yes | Yes | Yes |
| Stranger | No | No | No | No |

## Out of scope for this feature

These remain separate follow-ups and are not covered by this checklist:

- Public integration writes (`/api/tracking/insert`, `/api/messages/insert`)
- Station-wide track search / calendar visibility policy
