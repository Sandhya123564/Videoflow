# Phase 2 — Projects and video versions

## What was added

- Create a project (title, description, reviewer email)
- Attach version 1 as a direct upload or a Google Drive link
- Add later versions (history is kept)
- Send a project for review (`draft` → `pending_review`)
- Local file storage by default; Cloudinary if keys are present
- Safer database startup: memory DB when `USE_MEMORY_DB=true`, and automatic fallback if Atlas fails

## APIs

| Method | Path | Who |
|--------|------|-----|
| GET | /api/v1/projects | signed-in user (scoped by role) |
| POST | /api/v1/projects | editor, admin (`multipart` optional `video`) |
| GET | /api/v1/projects/:id | editor / assigned reviewer / head queue / admin |
| PATCH | /api/v1/projects/:id | editor, admin |
| POST | /api/v1/projects/:id/submit | editor, admin |
| GET | /api/v1/projects/:id/versions | same as get one |
| POST | /api/v1/projects/:id/versions | editor, admin (`video` or `driveLink`) |

Create body fields: `title`, `description`, `reviewerEmail`, optional `driveLink`, `notes`, file field name `video`.

## How to test on Windows

1. Start API then frontend (see WINDOWS-SETUP.md).
2. Log in as `editor@videoflow.local` / `Password123`.
3. New project → title + reviewer `reviewer@videoflow.local`.
4. Either upload a small MP4 **or** paste a Drive share link.
5. Open the project → confirm the player and Version 1.
6. Add Version 2 with a note.
7. Click **Send for review**. Status becomes `pending review`.
8. Log out, log in as `reviewer@videoflow.local`. The project should be listed.

Drive playback only works if the file is shared “anyone with the link can view”.

## Not in Phase 2

- Timestamp comments
- Reviewer approve / request changes
- Emails
- YouTube
