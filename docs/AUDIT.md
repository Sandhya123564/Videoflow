# VideoFlow audit (Phase 5 codebase)

## Already working (preserved)

- JWT login/register, RBAC, four roles
- Projects, local/Cloudinary upload, Drive links, versions
- Timestamp comments, approve / request changes
- Head final approval
- YouTube publish after approval (OAuth if configured; otherwise labeled demo)
- Review tokens, invites, notifications, email-test log
- Admin user create / role / disable

## Gaps closed in this upgrade

- Project priority and deadline
- Search / status / priority filters and status counts
- Password reset
- Admin email invite form
- Persistent Mongo is no longer silently replaced by memory when `USE_MEMORY_DB=false`
- Deployment and configuration docs

## Still requires your credentials (cannot be faked)

| Need | Env |
|------|-----|
| Persistent data | Atlas `MONGODB_URI`, `USE_MEMORY_DB=false` |
| Real inbox email | `RESEND_API_KEY` + verified domain |
| Cloud video hosting | Cloudinary keys |
| Real YouTube upload | YouTube OAuth client + local file version |

Without those keys the app still runs locally. It will not claim mail was delivered, files are in Atlas, or a YouTube video exists.
