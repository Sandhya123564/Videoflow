# VideoFlow

Video review and approval management system.

Editor submits a video → Reviewer comments with timestamps → Head gives final approval → Authorized user publishes to YouTube.

## Current status

**Phase 4 is implemented.** Earlier phases stay in place.

What works now:

- Register / login / logout / current user
- Role-based access (editor, reviewer, head, admin)
- Create projects, local upload or Drive link, version history
- Timestamp comments
- Reviewer approve / request changes
- Editor revision + resubmit
- Head final approve / request changes
- Activity history
- Local email log (Resend optional)
- YouTube publish after Head approval (OAuth if configured; otherwise labeled demo mode)
- In-memory MongoDB so you can run without Atlas

YouTube client secrets stay in `backend/.env`. Access tokens never go to the browser.

## Requirements

- Node.js 20+
- npm 10+
- A MongoDB Atlas cluster (free tier is enough) **or** local MongoDB
- A code editor (VS Code recommended)

## Repository layout

```
videoflow/
├── backend/                 Node + Express API
│   ├── src/
│   │   ├── config/          env + database
│   │   ├── models/          Mongoose schemas
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/      auth + RBAC
│   │   ├── services/        email, storage, youtube (later)
│   │   ├── validators/
│   │   └── utils/
│   └── package.json
├── frontend/                React + Vite + Tailwind
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── context/
│       └── services/
├── docs/ARCHITECTURE.md
└── README.md
```

## Phase 1 setup (do this in order)

### 1. Get a MongoDB connection string

1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster (M0 Free).
3. Database Access → add a user with password.
4. Network Access → allow your IP (or `0.0.0.0/0` for local learning only).
5. Connect → Drivers → copy the URI:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/videoflow?retryWrites=true&w=majority`

### 2. Backend

Open a terminal:

```bash
cd videoflow/backend
cp .env.example .env
```

Edit `.env` and paste your `MONGODB_URI` and a long random `JWT_SECRET`.

```bash
npm install
npm run seed
npm run dev
```

You should see:

```
VideoFlow API listening on http://localhost:5000
MongoDB connected
```

Test:

```bash
curl http://localhost:5000/api/v1/health
```

### 3. Frontend

Open a **second** terminal:

```bash
cd videoflow/frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173

### 4. Demo accounts (after `npm run seed`)

| Role     | Email                 | Password    |
|----------|-----------------------|-------------|
| Admin    | admin@videoflow.local | Password123 |
| Head     | head@videoflow.local  | Password123 |
| Editor   | editor@videoflow.local| Password123 |
| Reviewer | reviewer@videoflow.local | Password123 |

Change these passwords before any real use.

## How to test Phase 1

1. Register a new editor account from the UI.
2. Log in as each seeded role and confirm you land on the correct dashboard.
3. Try opening `/admin` as an editor — you should be blocked.
4. Log out and confirm you return to `/login`.
5. Call `GET /api/v1/auth/me` with the token from login (see Phase 1 test steps in `docs/PHASE1.md`).

## Environment variables

See `backend/.env.example` and `frontend/.env.example`.
Never commit real keys. Phase 2+ keys (Cloudinary, Resend, Google, YouTube) are documented there but unused until those phases.

## Scripts

| Where    | Command        | Purpose                |
|----------|----------------|------------------------|
| backend  | `npm run dev`  | API with nodemon       |
| backend  | `npm start`    | API production         |
| backend  | `npm run seed` | Insert demo users      |
| frontend | `npm run dev`  | Vite dev server        |
| frontend | `npm run build`| Production bundle      |
