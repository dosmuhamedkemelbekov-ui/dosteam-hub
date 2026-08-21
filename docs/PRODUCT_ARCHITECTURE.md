# DOSTEAM HUB — product architecture

## Product loop

`Student → Follow/Join club → Register for event → Ticket → QR check-in → Attendance → XP + DC Coins → Achievement → Level → Leaderboard → Portfolio`

XP is reputation and is never spent. DC Coins are an internal reward balance and can be earned or spent. Both are written through immutable transaction ledgers; the cached totals in `profiles` are updated atomically.

## Roles and permissions

| Capability | Student | Club Manager | Event Organizer | Admin |
| --- | --- | --- | --- | --- |
| Manage own profile, follows, applications | Yes | Yes | Yes | Yes |
| Register and receive ticket | Yes | Yes | Yes | Yes |
| Create club posts and review membership | No | Managed club | No | All clubs |
| Create and analyze events | No | Managed club | Own events | All events |
| Scan event tickets | No | Club events | Own events | All events |
| Request room booking | No | Yes | Yes | Yes |
| Approve clubs, rooms, XP/Coins | No | No | No | Yes |
| Configure levels and achievements | No | No | No | Yes |

All authorization must be enforced on the server. UI visibility is convenience, not security.

## Core state machines

- Club: `pending → approved → active`; rejection is `pending → rejected`; admins may archive an active club.
- Membership: `pending → approved | rejected`; an approved member may later become `left`.
- Event: `draft → published → completed`; a published event may become `cancelled`.
- Registration: `registered → attended | no_show | cancelled`. QR scanning may only move a valid ticket to `attended` once.
- Room booking: `pending → approved | rejected`; only approved bookings block the room. The server rejects any approved time overlap.
- Reward order: `pending → approved → fulfilled`; cancellation refunds Coins through a new ledger entry, never by editing history.

## Attendance and rewards transaction

On a successful QR scan:

1. Validate organizer rights, event, ticket signature, time window and current `registered` state.
2. Set registration to `attended` and capture `attended_at` / `scanned_by`.
3. Append one XP transaction and one Coin transaction using the event rewards.
4. Update profile XP and Coin balance atomically.
5. Recalculate level and achievement rules.
6. Create notifications for rewards, achievements and level changes.

Idempotency is guaranteed by the unique event/user registration and a unique reward source tuple in production service code.

## Room conflict rule

Before approving a booking, query approved bookings for the same room where:

`existing.starts_at < requested.ends_at AND existing.ends_at > requested.starts_at`

If any record exists, return a conflict and keep the request pending. Validate participant count against room capacity.

## Feed ranking

- Following feed: published posts from followed clubs ordered by `published_at DESC`.
- For You feed: interest/category affinity, attended event categories, club popularity, freshness and diversity. Exclude muted clubs and already seen posts when possible.
- Notifications are per-club opt-in through `club_follows.notifications_enabled`.

## Analytics definitions

- Registered: registration status excluding cancelled.
- Attended: status `attended`.
- No-show: completed event registrations not attended or cancelled.
- Attendance rate: `attended / registered × 100`.
- DAU / MAU: unique authenticated users with a tracked activity in one / thirty days.
- Returning participant: user with an attended event before the analyzed event.

## Storage

- D1: users, profiles, roles, levels, ledgers, clubs, follows, memberships, posts, events, tickets, attendance, rooms, bookings, achievements, rewards and notifications.
- Object storage in the production phase: avatars, club logos/covers, event art, post images/video and exports. D1 stores their metadata and ownership.
- Never store authoritative balances, XP, tickets or applications only in browser storage.

## Authentication

The current build exposes a polished demo login and role switcher to review every workflow. Production authentication must use the university identity provider or the hosting platform identity layer, with server-side role checks and an allowlist for `@eagi.kz` accounts. Passwords must never be handled by the client-only demo layer.
