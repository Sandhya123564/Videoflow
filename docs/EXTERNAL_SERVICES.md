# How to obtain external credentials (Phases 2–5)

Never commit real keys. Put them only in `backend/.env`.

## MongoDB Atlas

1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Database Access → add a user
3. Network Access → allow your IP
4. Copy the connection URI into `MONGODB_URI`
5. Set `USE_MEMORY_DB=false` when you want data to persist

Phase 1 works without Atlas if `USE_MEMORY_DB=true`. That database is empty every time the API process restarts.

## Cloudinary (Phase 2)

Sign up at https://cloudinary.com and copy cloud name, API key, and API secret.

## Resend (Phase 3)

Create an API key at https://resend.com. Verify a sending domain before production.

## Google Drive

A shareable “anyone with the link can view” URL is enough for Phase 2 playback.
OAuth is only required if you later browse the user’s Drive.

## YouTube Data API v3 (Phase 5)

1. Google Cloud Console → enable YouTube Data API v3
2. Configure the OAuth consent screen
3. Create a Web application OAuth client
4. Redirect URI must match `YOUTUBE_REDIRECT_URI`
5. Scope: `https://www.googleapis.com/auth/youtube.upload`

Only publish after Head approval. The server must re-check project status before calling YouTube.
