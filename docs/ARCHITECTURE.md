# VideoFlow — System Architecture

VideoFlow is a three-tier video review and approval system.

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
│  React 18 + Vite + Tailwind CSS + React Router                  │
│                                                                 │
│  Editor Dashboard │ Reviewer Portal │ Head Dashboard │ Admin    │
│  Auth pages       │ Video player + timestamp comments           │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS / JSON REST
                               │ Authorization: Bearer <JWT>
┌──────────────────────────────▼──────────────────────────────────┐
│                      APPLICATION LAYER                          │
│  Node.js + Express.js                                           │
│                                                                 │
│  Auth │ Projects │ Versions │ Comments │ Approvals │ Publish    │
│  RBAC middleware │ Token review links │ Validators              │
│                                                                 │
│  Services: Email (Resend) │ Storage (Cloudinary) │ YouTube API  │
└───────┬───────────────────────────┬─────────────────────┬───────┘
        │                           │                     │
        ▼                           ▼                     ▼
┌───────────────┐         ┌─────────────────┐    ┌────────────────┐
│  DATA LAYER   │         │  VIDEO STORAGE  │    │ EXTERNAL APIS  │
│ MongoDB Atlas │         │ Cloudinary / S3 │    │ Resend email   │
│ Mongoose ODM  │         │ Google Drive    │    │ YouTube Data v3│
└───────────────┘         └─────────────────┘    └────────────────┘
```

## Component communication

1. The browser talks only to the Express API (`/api/v1/*`).
2. Express authenticates JWTs, enforces roles, validates input, then reads/writes MongoDB.
3. Video binaries never live in MongoDB. Uploads go to Cloudinary; Drive links are stored as URLs plus metadata.
4. Reviewers can open a project without an account via a signed, expiring `reviewToken`.
5. Resend sends invitation, change-request, approval, and publish emails.
6. YouTube publishing happens only after Head approval, using a stored OAuth refresh token on an authorized user.

## Status machine

```
draft
  → pending_review            (editor sent review request)
  → changes_requested         (reviewer requested edits)
  → pending_review            (editor uploaded a new version)
  → pending_head_review       (reviewer approved)
  → changes_requested_by_head (head requested edits)
  → pending_review            (editor uploaded after head request)
  → approved                  (head approved)
  → published                 (YouTube upload succeeded)
```

Invalid transitions are rejected by the backend, not the UI.

## Security model

- Passwords hashed with bcrypt (cost 12).
- JWT access tokens (short-lived) + optional refresh later.
- Role-Based Access Control on every mutating route.
- Review links: 32-byte hex tokens, hashed at rest, expiry configurable.
- Approval and publish endpoints re-check status + role server-side.
- Secrets only in environment variables. Never commit `.env`.

## Phased delivery

| Phase | Scope |
|-------|--------|
| 1 | Architecture, repo, env, schemas, auth, RBAC, dashboards shell |
| 2 | Projects, video upload / Drive links, version history |
| 3 | Reviewer portal, timestamp comments, review emails |
| 4 | Head workflow, approval history, notifications |
| 5 | YouTube OAuth publish, admin console, deploy |

Phase 1 is implemented in this repository and can be run locally.
