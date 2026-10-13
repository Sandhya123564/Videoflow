# Deploy VideoFlow

## Local (Windows PowerShell)

```powershell
cd backend
copy .env.example .env
# set JWT_SECRET and leave USE_MEMORY_DB=true for disposable data
npm install
npm run dev
```

```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```

Open http://localhost:5173

## Production checklist

1. MongoDB Atlas cluster, IP allow-list, `USE_MEMORY_DB=false`
2. `JWT_SECRET` long random value
3. `CLIENT_ORIGIN` = https://your-frontend
4. `VITE_API_URL` = https://your-api/api/v1
5. Resend domain + `RESEND_API_KEY`, `SKIP_EMAIL_VERIFY=false`
6. Cloudinary keys for durable video files
7. YouTube OAuth redirect must match the live API callback URL
8. Serve the API over HTTPS
9. Do not commit `.env`

Suggested hosts: API on Render/Fly/Railway, frontend on Netlify/Vercel or the same Node host after `npm run build`.
