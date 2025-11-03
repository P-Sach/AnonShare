# Backend Deployment Guide (Render.com - Recommended)

## Why Render?
- Free tier available
- Easy deployment
- Auto-deploys from Git
- Perfect for Node.js/Express apps
- Built-in environment variables

## Step 1: Prepare Backend

Your backend is already ready in the `/backend` folder.

## Step 2: Deploy on Render

### A. Create Render Account
1. Go to https://render.com
2. Sign up with GitHub

### B. Create New Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `anonshare-backend` (or any name)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### C. Add Environment Variables
In the Render dashboard, add these environment variables:

```
PORT=3000
MONGO_URI=mongodb+srv://psach:YdRonxV2LlYIbWmv@cluster.m0l2daj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster
REDIS_URL=redis://default:lgQgpLzquObqvggLTFKdQh8z6jGZTJiv@redis-19661.c61.us-east-1-3.ec2.redns.redis-cloud.com:19661
NODE_ENV=production
```

### D. Deploy
1. Click "Create Web Service"
2. Wait for deployment (2-3 minutes)
3. You'll get a URL like: `https://anonshare-backend.onrender.com`

## Step 3: Update Frontend

After backend is deployed, update your frontend's `.env.local`:

```bash
NEXT_PUBLIC_API_BASE=https://anonshare-backend.onrender.com
```

Then redeploy your frontend on Vercel.

## Alternative: Deploy Backend on Vercel

If you prefer to keep everything on Vercel:

### Option 1: Separate Vercel Project for Backend

1. Create a NEW Vercel project
2. Import ONLY the `backend` folder
3. Configure root directory as `backend`
4. Add environment variables
5. Deploy

You'll get a separate URL for the backend.

### Option 2: Railway (Another Good Option)

1. Go to https://railway.app
2. Sign up with GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Select your repo
5. Set root directory to `backend`
6. Add environment variables
7. Deploy

## Update Backend CORS

Once deployed, update `backend/server.js` CORS settings with your frontend URL:

```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://your-frontend.vercel.app', // Add your Vercel frontend URL
];
```

## Testing

1. Visit your backend URL: `https://your-backend.onrender.com`
2. You should see: "AnonShare API is up"
3. Test upload endpoint: `https://your-backend.onrender.com/upload`

## Troubleshooting

### Backend Won't Start
- Check logs in Render dashboard
- Verify environment variables
- Check MongoDB connection string

### CORS Errors
- Ensure frontend URL is in CORS allowedOrigins
- Check that backend URL is correct in frontend .env

### File Upload Issues
- Render free tier has 512MB storage
- Files are ephemeral on free tier
- Consider using cloud storage (S3, Cloudflare R2)

## Important Notes

⚠️ **File Storage on Render Free Tier**:
- Files are stored in `/tmp` directory
- They are deleted when the service restarts
- For production, implement cloud storage

⚠️ **Cold Starts**:
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds

## Recommended: Production Setup

For a production app:
1. Use Render paid tier ($7/month) for persistent storage
2. Implement AWS S3 or Cloudflare R2 for file storage
3. Use environment-specific configs
4. Set up monitoring and logging
