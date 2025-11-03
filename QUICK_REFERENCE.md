# 📋 Quick Reference Card - Vercel Deployment

## Two Separate Vercel Projects

```
┌─────────────────────────────────────────┐
│  PROJECT 1: Backend                     │
│  Root Directory: backend                │
│  URL: anonshare-backend.vercel.app      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  PROJECT 2: Frontend                    │
│  Root Directory: ./                     │
│  URL: anonshare.vercel.app              │
└─────────────────────────────────────────┘
```

## Deploy Backend (Project 1)

1. https://vercel.com/new
2. Import `AnonShare` repo
3. Settings:
   - Name: `anonshare-backend`
   - Root Directory: **`backend`** ⚠️
   - Framework: Other
4. Environment Variables:
   ```
   PORT=3000
   MONGO_URI=mongodb+srv://psach:YdRonxV2LlYIbWmv@cluster.m0l2daj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster
   REDIS_URL=redis://default:lgQgpLzquObqvggLTFKdQh8z6jGZTJiv@redis-19661.c61.us-east-1-3.ec2.redns.redis-cloud.com:19661
   NODE_ENV=production
   ```
5. Deploy → Copy backend URL

## Deploy Frontend (Project 2)

1. https://vercel.com/new
2. Import `AnonShare` repo (SAME REPO)
3. Settings:
   - Name: `anonshare`
   - Root Directory: **`./`** ⚠️
   - Framework: Next.js
4. Environment Variable:
   ```
   NEXT_PUBLIC_API_BASE=<your-backend-url>
   ```
5. Deploy → Done!

## Test

✅ Backend: Visit backend URL → See "AnonShare API is up"
✅ Frontend: Visit frontend URL → Upload file → Download

## Important

- **Two projects, same repository**
- **Different root directories**
- Backend must deploy FIRST (frontend needs its URL)
- CORS is auto-configured (allows all .vercel.app)

## Troubleshooting

**404 on backend?**
→ Check Root Directory = `backend`

**Build fails?**
→ Verify Root Directory settings

**API errors?**
→ Check `NEXT_PUBLIC_API_BASE` points to backend URL

## Limits (Free Tier)

- Max file size: 4.5MB
- Function timeout: 10s
- 100 deployments/day

## Upgrade to Pro ($20/month)

- Max file size: 50MB
- Function timeout: 60s
- Priority support
