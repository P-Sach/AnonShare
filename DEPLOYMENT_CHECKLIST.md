# 🚀 Deployment Checklist - Both on Vercel

## ✅ Pre-Deployment Checklist

- [x] Code is ready and tested locally
- [x] MongoDB Atlas configured
- [x] Redis Cloud configured  
- [x] Environment variables documented
- [x] CORS settings configured
- [x] Both projects ready for Vercel

## 📋 Deployment Steps

### STEP 1: Deploy Backend on Vercel

1. [ ] Go to https://vercel.com/new
2. [ ] Import your `AnonShare` repository
3. [ ] Configure Backend Project:
   - [ ] **Project Name**: `anonshare-backend`
   - [ ] **Framework**: Other
   - [ ] **Root Directory**: `backend` ⚠️ IMPORTANT
   - [ ] **Build Command**: (leave empty)
   - [ ] **Install Command**: `npm install`
4. [ ] Add Environment Variables:
   - [ ] `PORT=3000`
   - [ ] `MONGO_URI=mongodb+srv://psach:YdRonxV2LlYIbWmv@cluster.m0l2daj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster`
   - [ ] `REDIS_URL=redis://default:lgQgpLzquObqvggLTFKdQh8z6jGZTJiv@redis-19661.c61.us-east-1-3.ec2.redns.redis-cloud.com:19661`
   - [ ] `NODE_ENV=production`
5. [ ] Click "Deploy" and wait 1-2 minutes
6. [ ] **SAVE BACKEND URL**: ________________________________
   
   Example: `https://anonshare-backend.vercel.app`

7. [ ] Test backend: Visit URL, should see "AnonShare API is up" ✅

### STEP 2: Deploy Frontend on Vercel

1. [ ] Go to https://vercel.com/new again
2. [ ] Import SAME `AnonShare` repository
3. [ ] Configure Frontend Project:
   - [ ] **Project Name**: `anonshare`
   - [ ] **Framework**: Next.js ✅
   - [ ] **Root Directory**: `./` (leave as root) ⚠️
   - [ ] **Build Command**: `npm run build`
   - [ ] **Output Directory**: `.next`
4. [ ] Add Environment Variable:
   - [ ] `NEXT_PUBLIC_API_BASE=<your-backend-url-from-step-1>`
5. [ ] Click "Deploy" and wait 2-3 minutes
6. [ ] **SAVE FRONTEND URL**: ________________________________
   
   Example: `https://anonshare.vercel.app`

### STEP 3: Test Deployment

1. [ ] **Test Homepage**:
   - [ ] Visit frontend URL
   - [ ] Homepage loads ✅

2. [ ] **Test File Upload**:
   - [ ] Go to `/share` page
   - [ ] Upload a small test file (< 5MB)
   - [ ] Click "Generate Share Link"
   - [ ] Redirects to session page ✅

3. [ ] **Test Download**:
   - [ ] Copy download link
   - [ ] Open in new tab
   - [ ] Download works ✅

4. [ ] **Test Text Sharing**:
   - [ ] Go to `/share`
   - [ ] Switch to "Text Message"
   - [ ] Enter message with password
   - [ ] Generate and test ✅

5. [ ] **Check Browser Console**:
   - [ ] Press F12
   - [ ] No CORS errors ✅
   - [ ] API calls succeed ✅

## 🔧 Environment Variables Summary

### Backend Project (Vercel)
```
PORT=3000
MONGO_URI=mongodb+srv://psach:YdRonxV2LlYIbWmv@cluster.m0l2daj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster
REDIS_URL=redis://default:lgQgpLzquObqvggLTFKdQh8z6jGZTJiv@redis-19661.c61.us-east-1-3.ec2.redns.redis-cloud.com:19661
NODE_ENV=production
```

### Frontend Project (Vercel)
```
NEXT_PUBLIC_API_BASE=https://anonshare-backend.vercel.app
```
(Use your actual backend URL)

## ⚠️ Important Notes

### What Works
✅ File upload/download (up to 4.5MB)
✅ Encrypted text sharing
✅ Password protection
✅ Download limits
✅ Time-based expiry
✅ Session management

### What Doesn't Work
❌ LocShare (P2P) - only works locally
❌ Large files > 4.5MB (Vercel free tier limit)

### Vercel Free Tier Limits
- Function Payload: 4.5MB
- Function Duration: 10 seconds
- Deployments: 100/day
- Bandwidth: 100GB/month

## 🎯 Post-Deployment

### Optional Enhancements
- [ ] Add custom domain to frontend
- [ ] Enable Vercel Analytics
- [ ] Set up error monitoring
- [ ] Upgrade to Pro for larger files ($20/month)

### Monitoring
- [ ] Check backend logs: Vercel Dashboard → Backend Project → Functions
- [ ] Check frontend logs: Vercel Dashboard → Frontend Project → Deployments
- [ ] Monitor MongoDB: MongoDB Atlas Dashboard
- [ ] Monitor Redis: Redis Cloud Dashboard

## 🐛 Troubleshooting

### Backend shows 404
✅ **Fix**: Check Root Directory is set to `backend`
- Settings → General → Root Directory → `backend`

### Build fails
✅ **Fix**: Check Root Directory settings
- Backend: `backend`
- Frontend: `./` or empty

### CORS errors
✅ **Fix**: Already handled in code (allows all .vercel.app domains)

### API calls fail
✅ **Fix**: Verify `NEXT_PUBLIC_API_BASE` environment variable
- Should point to backend URL
- Redeploy after changing

## 🎉 Success!
