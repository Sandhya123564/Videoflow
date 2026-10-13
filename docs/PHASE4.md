# Phase 4 — YouTube publishing

## Rules

- Only the **Head** role can connect a channel or publish.
- Publish is rejected unless project status is `approved`.
- Client secret and tokens never leave the API. The UI only sees `hasYouTube`, channel title, and public video URL after success.

## Demo mode (default)

If `YOUTUBE_CLIENT_ID` or `YOUTUBE_CLIENT_SECRET` is empty:

- The UI shows **Demo mode — not a real upload**
- Connect creates a fake “VideoFlow Demo Channel”
- Publish simulates progress and stores a `DEMO_…` id
- The URL is labeled as demo and is not a live YouTube video

## Real OAuth (optional)

1. Google Cloud Console → enable YouTube Data API v3
2. OAuth consent screen, test user = the Head Google account
3. Web application client
4. Authorized redirect URI must be exactly:
   `http://localhost:5000/api/v1/youtube/callback`
5. Put client id/secret in `backend/.env` and restart the API
6. Head → approved project → Connect YouTube account
7. Current version must be a **local upload** (Drive-only files cannot be streamed to YouTube from this app)

## APIs

| Method | Path | Who |
|--------|------|-----|
| GET | /api/v1/youtube/status | signed-in |
| POST | /api/v1/youtube/connect | head |
| POST | /api/v1/youtube/disconnect | head |
| GET | /api/v1/youtube/callback | Google redirect |
| POST | /api/v1/projects/:id/publish | head, status approved |
| GET | /api/v1/projects/:id/publish/:recordId | viewers of the project |
| GET | /api/v1/projects/:id/publishing | viewers of the project |
