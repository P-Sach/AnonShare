# Vercel Deployment Guide for AnonShare

## Prerequisites
1. A Vercel account (sign up at https://vercel.com)
2. MongoDB Atlas database (already configured)
3. Redis Cloud instance (already configured)

## Step-by-Step Deployment

### 1. Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

### 2. Prepare Your Repository
Your code is already ready! Just make sure you've committed all changes:
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 3. Deploy via Vercel Dashboard (Recommended)

#### A. Connect Your Repository
1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your Git repository (GitHub/GitLab/Bitbucket)
4. Select the `AnonShare` repository

#### B. Configure Build Settings
Vercel should auto-detect Next.js. Verify these settings:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Root Directory**: `./` (leave as root)

#### C. Configure Environment Variables
Add these environment variables in the Vercel project settings:

**Essential Variables:**
```
NEXT_PUBLIC_API_BASE=https://your-project-name.vercel.app/api
NEXT_PUBLIC_APP_URL=https://your-project-name.vercel.app
MONGO_URI=mongodb+srv://psach:YdRonxV2LlYIbWmv@cluster.m0l2daj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster
REDIS_URL=redis://default:lgQgpLzquObqvggLTFKdQh8z6jGZTJiv@redis-19661.c61.us-east-1-3.ec2.redns.redis-cloud.com:19661
NODE_ENV=production
PORT=3000
```

**⚠️ IMPORTANT**: Replace `your-project-name` with your actual Vercel project URL once it's assigned.

#### D. Deploy
1. Click "Deploy"
2. Wait for the build to complete (2-3 minutes)
3. You'll get a URL like: `https://your-project-name.vercel.app`

#### E. Update API Base URL
1. After first deployment, go to Project Settings → Environment Variables
2. Update `NEXT_PUBLIC_API_BASE` to your actual Vercel URL:
   ```
   NEXT_PUBLIC_API_BASE=https://your-actual-domain.vercel.app/api
   NEXT_PUBLIC_APP_URL=https://your-actual-domain.vercel.app
   ```
3. Redeploy the project (Deployments tab → Redeploy)

### 4. Deploy via Vercel CLI (Alternative)

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow the prompts and add environment variables when asked
```

## Post-Deployment Configuration

### 1. Add Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### 2. Configure CORS
Your CORS is already configured to accept:
- `localhost:5173` (development)
- `localhost:3000` (development)
- Any `.vercel.app` domain
- Your custom domain (via `NEXT_PUBLIC_APP_URL`)

### 3. Monitor Your Application
- **Logs**: Deployments → Select deployment → Runtime Logs
- **Analytics**: Available in Vercel dashboard
- **Errors**: Check Runtime Logs for any issues

## Important Notes

### File Uploads
⚠️ **Vercel Limitations**: 
- Vercel serverless functions have a 50MB payload limit
- Uploaded files are stored in `/tmp` which is ephemeral
- For production, consider using cloud storage (AWS S3, Cloudflare R2, etc.)

### Current Setup:
Your app currently stores files in:
- `backend/uploads/` - This works locally but won't persist on Vercel
- Consider implementing cloud storage for production use

### LocShare Feature
The LocShare (P2P local network sharing) feature:
- **Will NOT work on Vercel** - it requires a persistent local server
- Only works when running locally with `npm run dev`
- The cloud-based AnonShare feature will work perfectly on Vercel

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all environment variables are set correctly
- Verify Node.js version compatibility

### API Not Working
- Verify `NEXT_PUBLIC_API_BASE` points to `/api` route
- Check CORS settings in backend/server.js
- Review Runtime Logs for errors

### Database Connection Issues
- Verify MongoDB connection string in environment variables
- Check MongoDB Atlas network access (allow all IPs: 0.0.0.0/0)
- Ensure Redis URL is correct and accessible

### Environment Variables Not Loading
- Make sure variables start with `NEXT_PUBLIC_` for client-side access
- Redeploy after changing environment variables
- Check that variables are set for Production environment

## Environment Differences

### Development (Local)
- Both AnonShare (cloud) and LocShare (P2P) work
- File uploads stored in backend/uploads/
- Redis and MongoDB connect from localhost

### Production (Vercel)
- Only AnonShare (cloud) feature works
- LocShare disabled (requires local network)
- File uploads need cloud storage solution
- Redis and MongoDB connect from cloud services

## Recommended Improvements for Production

1. **Implement Cloud Storage**: 
   - AWS S3
   - Cloudflare R2
   - Azure Blob Storage

2. **Add File Size Limits**: Already implemented (50MB)

3. **Set Up Monitoring**:
   - Sentry for error tracking
   - Vercel Analytics for performance

4. **Database Optimization**:
   - Add indexes to MongoDB collections
   - Implement connection pooling

## Need Help?

- Vercel Documentation: https://vercel.com/docs
- Next.js on Vercel: https://vercel.com/docs/frameworks/nextjs
- Support: Vercel Dashboard → Help

---

**Your project is ready for deployment! 🚀**
Just follow the steps above and you'll be live in minutes.
