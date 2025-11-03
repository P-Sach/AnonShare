# Complete Deployment Guide - Separate Frontend & Backend

## Architecture

- **Frontend (Next.js)**: Deployed on Vercel
- **Backend (Express)**: Deployed on Render/Railway/Vercel (separate project)
- **Database**: MongoDB Atlas (already configured)
- **Cache**: Redis Cloud (already configured)

## Quick Start Deployment

### Step 1: Deploy Backend First

#### Option A: Render.com (Recommended - Free)

1. **Sign up**: https://render.com (use GitHub)
2. **New Web Service** → Connect your repository
3. **Configure**:
   ```
   Name: anonshare-backend
   Root Directory: backend
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```
4. **Add Environment Variables**:
   ```
   PORT=3000
   MONGO_URI=mongodb+srv://psach:YdRonxV2LlYIbWmv@cluster.m0l2daj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster
   REDIS_URL=redis://default:lgQgpLzquObqvggLTFKdQh8z6jGZTJiv@redis-19661.c61.us-east-1-3.ec2.redns.redis-cloud.com:19661
   NODE_ENV=production
   ```
5. **Deploy** and note your backend URL (e.g., `https://anonshare-backend.onrender.com`)

#### Option B: Railway.app (Alternative)

1. **Sign up**: https://railway.app
2. **New Project** → Deploy from GitHub
3. **Root Directory**: `backend`
4. **Add same environment variables**
5. **Deploy**

### Step 2: Deploy Frontend on Vercel

1. **Go to Vercel**: https://vercel.com/dashboard
2. **Import your repository** (if not already done)
3. **Configure**:
   - Framework Preset: Next.js
   - Root Directory: `./` (root)
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **Add Environment Variable**:
   ```
   NEXT_PUBLIC_API_BASE=https://anonshare-backend.onrender.com
   ```
   (Replace with your actual backend URL from Step 1)

5. **Deploy**

### Step 3: Update Backend CORS

After frontend is deployed, update backend CORS:

1. Open `backend/server.js`
2. Find the `allowedOrigins` array
3. Add your Vercel frontend URL:
   ```javascript
   const allowedOrigins = [
     'http://localhost:5173',
     'http://localhost:3000',
     'https://your-frontend.vercel.app', // <-- Add this
   ];
   ```
4. Commit and push
5. Backend will auto-redeploy

## Environment Variables Summary

### Frontend (.env.local or Vercel Environment Variables)
```bash
NEXT_PUBLIC_API_BASE=https://anonshare-backend.onrender.com
```

### Backend (Render/Railway Environment Variables)
```bash
PORT=3000
MONGO_URI=mongodb+srv://psach:YdRonxV2LlYIbWmv@cluster.m0l2daj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster
REDIS_URL=redis://default:lgQgpLzquObqvggLTFKdQh8z6jGZTJiv@redis-19661.c61.us-east-1-3.ec2.redns.redis-cloud.com:19661
NODE_ENV=production
```

## Testing Deployment

### 1. Test Backend
Visit: `https://anonshare-backend.onrender.com`
Should see: "AnonShare API is up"

### 2. Test Frontend
Visit: `https://your-frontend.vercel.app`
Try uploading a file

### 3. Check Logs
- **Backend**: Render dashboard → Logs tab
- **Frontend**: Vercel dashboard → Deployments → Runtime Logs

## Common Issues

### CORS Errors
**Problem**: "Access to fetch has been blocked by CORS policy"
**Solution**: 
- Add frontend URL to backend's `allowedOrigins`
- Redeploy backend

### Backend API Not Found
**Problem**: 404 errors when calling API
**Solution**:
- Verify `NEXT_PUBLIC_API_BASE` is set correctly
- Check backend URL is accessible
- Ensure backend is deployed and running

### MongoDB Connection Failed
**Problem**: Backend crashes, MongoDB connection errors
**Solution**:
- Check MongoDB Atlas network access (allow 0.0.0.0/0)
- Verify `MONGO_URI` is correct
- Check MongoDB cluster is active

### Files Not Uploading
**Problem**: Upload fails or times out
**Solution**:
- Check file size (max 50MB)
- Verify multer configuration
- Check backend logs for errors

## Development vs Production

### Development (Local)
```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Start frontend  
npm run dev
```
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Both LocShare and AnonShare work

### Production
- Frontend: https://your-app.vercel.app
- Backend: https://your-backend.onrender.com
- Only AnonShare works (LocShare requires local network)

## File Storage Considerations

⚠️ **Important for Production**:

### Current Setup (Development/Testing)
- Files stored in `backend/uploads/`
- Works locally
- **NOT suitable for serverless/cloud deployment**

### Render Free Tier
- Files stored in `/tmp`
- Deleted on service restart
- 512MB storage limit

### Recommended for Production
Implement cloud storage:
- **AWS S3**: Most popular, reliable
- **Cloudflare R2**: S3-compatible, cheaper
- **Azure Blob Storage**: Alternative option

Update `backend/config/multer.js` to use cloud storage instead of local disk.

## Cost Breakdown

### Free Tier (Perfect for Testing)
- Frontend (Vercel): Free
- Backend (Render): Free
- MongoDB Atlas: Free (512MB)
- Redis Cloud: Free (30MB)
- **Total**: $0/month

### Production Tier (Recommended)
- Frontend (Vercel): Free or $20/month (Pro)
- Backend (Render): $7/month
- MongoDB Atlas: $0-$57/month
- Redis Cloud: $0-$5/month  
- Cloud Storage (S3): ~$0.50/month
- **Total**: ~$7-$90/month

## Monitoring

### Backend (Render)
- Dashboard → Metrics
- View CPU, memory, requests
- Real-time logs

### Frontend (Vercel)
- Analytics (built-in)
- Edge Network metrics
- Function logs

### Database
- MongoDB Atlas dashboard
- Monitor connections, queries
- Set up alerts

## Security Checklist

- [ ] Environment variables set correctly
- [ ] MongoDB network access configured
- [ ] CORS origins restricted (don't use `*` in production)
- [ ] File upload size limits enforced
- [ ] Rate limiting enabled
- [ ] HTTPS enforced (automatic on Vercel/Render)
- [ ] Sensitive data not in git

## Next Steps

1. Deploy backend on Render
2. Deploy frontend on Vercel  
3. Test file upload/download
4. Monitor for 24 hours
5. Implement cloud storage (if needed)
6. Set up custom domain (optional)
7. Enable monitoring/alerts

---

**You're ready to deploy! 🚀**

Follow the steps above and you'll have a fully working deployment in about 15 minutes.
