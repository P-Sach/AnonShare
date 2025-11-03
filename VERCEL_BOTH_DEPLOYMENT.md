# 🚀 Deploy Both Frontend & Backend on Vercel

## Overview

You'll create **TWO separate Vercel projects** from the same repository:
1. **Backend Project** - Points to `/backend` folder
2. **Frontend Project** - Points to root `/` folder

## Step-by-Step Deployment

### STEP 1: Deploy Backend First ⚡

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/new
   - Sign in with GitHub

2. **Import Repository**
   - Click "Import Git Repository"
   - Select your `AnonShare` repository
   - Click "Import"

3. **Configure Backend Project**
   ```
   Project Name: anonshare-backend
   Framework Preset: Other
   Root Directory: backend          ⚠️ IMPORTANT!
   Build Command: (leave empty)
   Output Directory: (leave empty)
   Install Command: npm install
   ```

4. **Add Environment Variables**
   
   Click "Environment Variables" and add:
   ```
   PORT=3000
   MONGO_URI=mongodb+srv://psach:YdRonxV2LlYIbWmv@cluster.m0l2daj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster
   REDIS_URL=redis://default:lgQgpLzquObqvggLTFKdQh8z6jGZTJiv@redis-19661.c61.us-east-1-3.ec2.redns.redis-cloud.com:19661
   NODE_ENV=production
   ```
   
   **For each variable:**
   - Name: (e.g., `MONGO_URI`)
   - Value: (paste the value)
   - Environment: Production, Preview, Development ✅ (select all)
   - Click "Add"

5. **Deploy Backend**
   - Click "Deploy"
   - Wait 1-2 minutes for build ⏳
   
6. **Save Your Backend URL**
   
   After deployment, you'll get a URL like:
   ```
   https://anonshare-backend.vercel.app
   ```
   OR
   ```
   https://anonshare-backend-xyz123.vercel.app
   ```
   
   **📝 COPY THIS URL - YOU'LL NEED IT!**

7. **Test Backend**
   
   Visit your backend URL in browser.
   You should see:
   ```
   AnonShare API is up
   ```
   ✅ If you see this, backend is working!

---

### STEP 2: Deploy Frontend 🎨

1. **Go to Vercel Dashboard Again**
   - Visit: https://vercel.com/new
   - You'll import the SAME repository again

2. **Import Repository Again**
   - Click "Import Git Repository"
   - Select your `AnonShare` repository again
   - Click "Import"

3. **Configure Frontend Project**
   ```
   Project Name: anonshare
   Framework Preset: Next.js         ✅ (auto-detected)
   Root Directory: ./                ⚠️ Leave as root!
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

4. **Add Environment Variable**
   
   Click "Environment Variables" and add:
   ```
   Name: NEXT_PUBLIC_API_BASE
   Value: https://anonshare-backend.vercel.app
   ```
   (Use YOUR actual backend URL from Step 1)
   
   Environment: Production, Preview, Development ✅

5. **Deploy Frontend**
   - Click "Deploy"
   - Wait 2-3 minutes for build ⏳
   
6. **Save Your Frontend URL**
   
   After deployment, you'll get a URL like:
   ```
   https://anonshare.vercel.app
   ```

---

### STEP 3: Test Your Deployment 🧪

1. **Test Homepage**
   - Visit: `https://anonshare.vercel.app`
   - You should see the homepage ✅

2. **Test File Upload**
   - Go to: `https://anonshare.vercel.app/share`
   - Upload a test file (small file < 5MB)
   - Click "Generate Share Link"
   - Should redirect to session page ✅

3. **Test Download**
   - Copy the download link from session page
   - Paste in new tab
   - Enter password if you set one
   - Download should work ✅

4. **Check Browser Console**
   - Press F12 (Developer Tools)
   - Go to Console tab
   - Look for any errors
   - Should see successful API calls ✅

---

## Environment Variables Summary

### Backend (Vercel Project #1)
```bash
PORT=3000
MONGO_URI=mongodb+srv://psach:YdRonxV2LlYIbWmv@cluster.m0l2daj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster
REDIS_URL=redis://default:lgQgpLzquObqvggLTFKdQh8z6jGZTJiv@redis-19661.c61.us-east-1-3.ec2.redns.redis-cloud.com:19661
NODE_ENV=production
```

### Frontend (Vercel Project #2)
```bash
NEXT_PUBLIC_API_BASE=https://anonshare-backend.vercel.app
```
(Replace with your actual backend URL)

---

## Common Issues & Solutions

### ❌ Backend shows 404
**Solution**: Check "Root Directory" is set to `backend`
- Go to Project Settings → General → Root Directory
- Should be: `backend`

### ❌ Build fails with "Cannot find module"
**Solution**: Check Root Directory settings
- Backend should have Root Directory: `backend`
- Frontend should have Root Directory: `./` or empty

### ❌ CORS errors in browser console
**Solution**: Already handled! The backend automatically allows all `.vercel.app` domains
- No changes needed

### ❌ API calls fail (Network error)
**Solution**: Check `NEXT_PUBLIC_API_BASE` environment variable
- Go to Frontend Project → Settings → Environment Variables
- Verify `NEXT_PUBLIC_API_BASE` has correct backend URL
- Redeploy if you change it

### ❌ MongoDB connection failed
**Solution**: Check MongoDB Network Access
- Go to MongoDB Atlas → Network Access
- Add IP: `0.0.0.0/0` (Allow from anywhere)
- Or add Vercel IPs

---

## Updating Your Deployment

### Update Backend Code
```bash
git add backend/
git commit -m "Update backend"
git push origin main
```
Vercel auto-redeploys backend ✅

### Update Frontend Code
```bash
git add .
git commit -m "Update frontend"
git push origin main
```
Vercel auto-redeploys frontend ✅

### Update Environment Variables
1. Go to Vercel Dashboard
2. Select your project (Backend or Frontend)
3. Settings → Environment Variables
4. Edit the variable
5. **Redeploy**: Deployments tab → Click "..." → Redeploy

---

## Important Notes

### ✅ What Works
- File upload/download (up to 4.5MB on Vercel free tier)
- Encrypted text sharing
- Password protection
- Download limits
- Time-based expiry
- Session management

### ❌ What Doesn't Work
- LocShare (P2P local network) - only works locally
- Large file uploads > 4.5MB (Vercel function payload limit)

### ⚠️ Vercel Limits (Free Tier)
- **Function Payload**: 4.5MB (file upload limit)
- **Function Duration**: 10 seconds
- **Function Memory**: 1024MB
- **Deployments**: 100/day
- **Bandwidth**: 100GB/month

For larger files, consider:
- Upgrading to Vercel Pro ($20/month) - 50MB payload limit
- Using cloud storage (S3, Cloudflare R2)

---

## Monitoring

### View Logs

**Backend Logs:**
1. Go to backend project on Vercel
2. Click "Functions" tab
3. Select function
4. View runtime logs

**Frontend Logs:**
1. Go to frontend project on Vercel
2. Click "Functions" tab (for API routes if any)
3. Or "Deployments" → Click deployment → "View Build Logs"

### Analytics

- Vercel provides free analytics
- Enable: Project → Analytics tab
- See page views, performance metrics

---

## Cost

**Free Tier (Perfect for Testing):**
- Both projects: Free
- MongoDB Atlas: Free (512MB)
- Redis Cloud: Free (30MB)
- **Total: $0/month** 🎉

**Pro Tier (If Needed):**
- Vercel Pro: $20/month per user
- Benefits:
  - 50MB function payload (vs 4.5MB)
  - 60s function duration (vs 10s)
  - Priority support
  - More bandwidth

---

## Your Deployment is Ready! 🎉

You now have:
- ✅ Backend running on Vercel
- ✅ Frontend running on Vercel
- ✅ Automatic deployments from Git
- ✅ HTTPS enabled
- ✅ MongoDB connected
- ✅ Redis connected

**Next Steps:**
1. Share your frontend URL with friends
2. Test all features
3. Monitor logs for issues
4. Enjoy your deployed app! 🚀
