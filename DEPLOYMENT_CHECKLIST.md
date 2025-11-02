# 🚀 Vercel Deployment Checklist for AnonShare

## ✅ Pre-Deployment (Already Done!)

- [x] Build passes successfully (`npm run build` works)
- [x] All ESLint errors fixed
- [x] Environment variables configured
- [x] CORS settings updated for production
- [x] Vercel configuration file created
- [x] API routes structured properly
- [x] .gitignore updated

## 📋 Deployment Steps

### 1. Push to Git (If not already done)
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

**Option A: Vercel Dashboard (Recommended)**
1. Go to https://vercel.com
2. Sign up/Login with GitHub
3. Click "Add New" → "Project"
4. Import your `AnonShare` repository
5. Configure settings (auto-detected for Next.js)
6. Add environment variables (see VERCEL_ENV_SETUP.md)
7. Click "Deploy"
8. Wait 2-3 minutes ✨

**Option B: Vercel CLI**
```bash
npm install -g vercel
vercel login
vercel --prod
```

### 3. Post-Deployment Configuration

After your first deployment:

1. **Note your Vercel URL**: `https://[your-project].vercel.app`

2. **Update Environment Variables**:
   - Go to Settings → Environment Variables
   - Update `NEXT_PUBLIC_APP_URL` with your actual Vercel URL
   - Click "Redeploy" from Deployments tab

3. **Test Your Deployment**:
   - Visit your Vercel URL
   - Test file upload/download
   - Verify encrypted text sharing
   - Check session management

### 4. Configure MongoDB Atlas

Ensure your MongoDB allows Vercel connections:
1. Go to MongoDB Atlas
2. Network Access → Add IP Address
3. Allow Access from Anywhere: `0.0.0.0/0`
4. Or add Vercel's IP ranges (recommended for production)

### 5. Verify Redis Connection

Your Redis Cloud instance should already allow external connections.
Test it's working by checking the Vercel deployment logs.

## 🔧 Environment Variables Required

```
NEXT_PUBLIC_API_BASE=/api
NEXT_PUBLIC_APP_URL=https://[your-project].vercel.app
MONGO_URI=mongodb+srv://psach:YdRonxV2LlYIbWmv@cluster.m0l2daj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster
REDIS_URL=redis://default:lgQgpLzquObqvggLTFKdQh8z6jGZTJiv@redis-19661.c61.us-east-1-3.ec2.redns.redis-cloud.com:19661
NODE_ENV=production
PORT=3000
```

## ⚠️ Important Notes

### What Works on Vercel:
✅ AnonShare (cloud file sharing)
✅ Encrypted text sharing
✅ Session management
✅ QR code generation
✅ File encryption/decryption
✅ Download limits and expiry

### What Doesn't Work on Vercel:
❌ LocShare (P2P local network sharing) - requires local server
❌ Persistent file storage - Vercel is serverless (use cloud storage for production)

### File Upload Limitations:
- Vercel serverless functions: 50MB payload limit
- Current app limit: 50MB (within Vercel's limit)
- Files stored in `/tmp` (ephemeral - cleared after function execution)
- **Recommendation**: Implement cloud storage (S3/R2) for production

## 🎯 Next Steps After Deployment

### Immediate:
1. Test all features on production URL
2. Check logs for any errors
3. Monitor performance

### Recommended:
1. Add custom domain (optional)
2. Implement cloud storage (AWS S3, Cloudflare R2)
3. Set up error monitoring (Sentry)
4. Enable Vercel Analytics
5. Configure CDN for better performance

### Security:
1. Review CORS settings
2. Add rate limiting (already implemented)
3. Monitor Redis usage
4. Set up MongoDB backup strategy

## 📊 Monitoring

### Vercel Dashboard
- **Deployments**: View all deployments and their status
- **Analytics**: Track usage and performance
- **Logs**: Runtime logs for debugging
- **Settings**: Manage env vars and domains

### MongoDB Atlas
- Monitor database usage
- Check query performance
- Review connection logs

### Redis Cloud
- Monitor memory usage
- Check connection stats
- Review key expiration

## 🐛 Troubleshooting

### Build Fails
- Check build logs in Vercel
- Verify all dependencies are in package.json
- Ensure environment variables are set

### API Returns 404
- Verify routes in vercel.json
- Check API base URL configuration
- Review CORS settings

### Database Connection Fails
- Verify MongoDB URI in env vars
- Check MongoDB Network Access settings
- Test connection from Vercel IP

### Files Not Uploading
- Check payload size (max 50MB)
- Review upload route logs
- Verify multer configuration

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Environment Variables Guide](https://vercel.com/docs/concepts/projects/environment-variables)

## ✨ You're Ready!

All the preparation work is done. Your project is configured and ready to deploy to Vercel!

Just follow the deployment steps above and you'll be live in minutes. 🎉

---

**Need help?** Check the detailed guide in `VERCEL_DEPLOYMENT.md`
