# Phase 5 — Real users, review links, notifications

## What changed

- Register with a real email. Verification link is emailed (or logged in email-test mode).
- Admin can invite a user and assign a role (`POST /api/v1/admin/invites`).
- Editor assigns a reviewer by email. Existing reviewers are linked; new reviewers get an invite + secure `/review/:token` link.
- Review tokens are 32-byte random values stored as SHA-256 hashes.
- Claiming a review link requires login as that email.
- Notification bell + `/notifications` inbox.
- Auth routes are rate-limited.

## Email-test mode

If `RESEND_API_KEY` is empty, VideoFlow does **not** claim mail was sent. It writes the message to the API terminal and `backend/emails.log`. Copy the verify or review URL from that log.

Set `SKIP_EMAIL_VERIFY=true` for local login without clicking a link. Demo accounts stay verified.

## Production

1. MongoDB Atlas URI, `USE_MEMORY_DB=false`
2. `CLIENT_ORIGIN` = your frontend URL
3. `RESEND_API_KEY` + verified domain
4. `SKIP_EMAIL_VERIFY=false`
5. Optional Cloudinary keys for production video storage
