# VideoFlow Phase 4 — Windows + VS Code

You do **not** need MongoDB Atlas to run this phase.

## 1. Install Node.js

Install Node.js 20 or 22 LTS from https://nodejs.org  
Tick the option that adds Node to PATH. Restart VS Code.

```bat
node -v
npm -v
```

## 2. Open the project

Extract the ZIP. In VS Code use File → Open Folder and select the inner `videoflow` folder.

## 3. Environment files

`backend\.env` and `frontend\.env` are already in this ZIP.

Confirm `backend\.env` contains:

```
USE_MEMORY_DB=true
```

That line avoids Atlas. If Atlas failed on your laptop before, leave this as `true`.

The first `npm run dev` in `backend` may take several minutes while it downloads a local MongoDB binary. That is expected once.

## 4. Start the API

```bat
cd backend
npm install
npm run dev
```

Wait for:

```
MongoDB connected (in-memory local mode)
Demo users ready (Password123): admin@ head@ editor@ reviewer@videoflow.local
VideoFlow API listening on http://localhost:5000
```

If you previously had `node_modules` from Phase 1, run `npm install` again so `multer` and `cloudinary` are added.

## 5. Start the website

New terminal:

```bat
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## 6. Demo logins

Password: `Password123`

- editor@videoflow.local
- reviewer@videoflow.local
- head@videoflow.local
- admin@videoflow.local

Memory-DB data is wiped when you stop the API.

## If Phase 1 failed on database connection

Use this checklist before anything else:

1. Open `backend\.env` and set exactly:

```
USE_MEMORY_DB=true
```

2. Do not use an Atlas URI until this mode works.
3. First API start can take 2–10 minutes. `mongodb-memory-server` downloads a MongoDB binary into your user cache. Wait for `MongoDB connected (in-memory local mode)`.
4. If it still fails, the download is probably blocked. Install MongoDB Community locally from https://www.mongodb.com/try/download/community then set:

```
USE_MEMORY_DB=false
MONGODB_URI=mongodb://127.0.0.1:27017/videoflow
```

5. Only after local mode works should you try Atlas. Atlas fails on Windows when the cluster IP allow-list does not include your home IP, or when the password contains `@` `#` `:` that were not URL-encoded.

## Common Windows problems

| Symptom | What to do |
|---------|------------|
| Atlas / Mongo network error | Keep `USE_MEMORY_DB=true`. Restart the API. |
| First start hangs a few minutes | Memory Mongo is downloading. Wait. |
| `node` is not recognized | Reinstall Node.js, reopen VS Code |
| `npm install` fails in backend | Delete `backend\node_modules` and run `npm install` again |
| Video does not play | Local uploads need the API still running. Drive files must be shared with “anyone with the link” |
| Port 5000 in use | Change `PORT` in `backend\.env` |
