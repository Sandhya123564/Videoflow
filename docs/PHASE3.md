# Phase 3 — Review, comments, head approval

Works without Atlas, Cloudinary, or Resend.

## Features

- Timestamp comments on a video version
- Reviewer Approve / Request changes
- Editor uploads a new version after changes, then sends for review again
- Head Approve / Request changes after reviewer approval
- Activity history on the project page
- Email notifications: console + `backend/emails.log` locally; Resend if `RESEND_API_KEY` is set

## New / used APIs

| Method | Path |
|--------|------|
| GET | /api/v1/projects/:id/comments |
| POST | /api/v1/projects/:id/comments |
| PATCH | /api/v1/projects/:id/comments/:commentId |
| POST | /api/v1/projects/:id/review |
| POST | /api/v1/projects/:id/head-review |
| GET | /api/v1/notifications |

Review body: `{ "action": "approve" | "request_changes", "note": "..." }`

## Local test path

1. Editor creates project, uploads video, Send for review
2. API terminal shows a review-invite email block
3. Reviewer opens project, adds a timestamp comment, Request changes
4. Editor uploads v2, Send for review
5. Reviewer Approves
6. Head opens queue, Approves
7. Status is `approved`
