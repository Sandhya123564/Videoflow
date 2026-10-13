# Phase 1 — Foundation

## Goal

A running API and UI where users can register, log in, and see a dashboard that matches their role. Database schemas for the whole product exist even if later collections are unused until later phases.

## What you should have after this phase

- `GET /api/v1/health` returns `{ status: "ok" }`
- `POST /api/v1/auth/register` creates a user
- `POST /api/v1/auth/login` returns a JWT
- `GET /api/v1/auth/me` returns the current user
- Frontend login/register + four role dashboards
- Seeded demo users

## API contract (Phase 1)

### POST /api/v1/auth/register

```json
{
  "name": "Ada Editor",
  "email": "ada@example.com",
  "password": "Password123",
  "role": "editor"
}
```

Allowed self-register roles: `editor`, `reviewer`.
`head` and `admin` can only be created by an admin (or the seed script).

### POST /api/v1/auth/login

```json
{ "email": "ada@example.com", "password": "Password123" }
```

Response includes `token` and `user` (no password).

### GET /api/v1/auth/me

Header: `Authorization: Bearer <token>`

### POST /api/v1/auth/logout

Client discards the token. Server responds 200 (stateless JWT).

## Manual API tests

With the API running:

```bash
curl -s http://localhost:5000/api/v1/health

curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"editor@videoflow.local","password":"Password123"}'
```

Copy `token`, then:

```bash
curl -s http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer PASTE_TOKEN_HERE"
```

Try a protected admin route as editor (should be 403):

```bash
curl -s http://localhost:5000/api/v1/admin/users \
  -H "Authorization: Bearer EDITOR_TOKEN"
```

## UI tests

1. Open http://localhost:5173 — redirect to login.
2. Log in as editor → Editor dashboard.
3. Log in as reviewer → Reviewer dashboard.
4. Log in as head → Head dashboard.
5. Log in as admin → Admin dashboard.
6. Visit http://localhost:5173/admin while logged in as editor → Access denied.

## Done when

All of the checks above pass on your machine. Then we start Phase 2 (projects + video versions).
