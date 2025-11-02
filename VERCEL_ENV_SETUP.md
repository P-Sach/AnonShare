# Vercel Environment Variables - Quick Setup

Copy and paste these into your Vercel project settings (Settings → Environment Variables)

## Required Environment Variables

### Frontend Configuration
```
NEXT_PUBLIC_API_BASE=/api
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

### Backend Configuration
```
MONGO_URI=mongodb+srv://psach:YdRonxV2LlYIbWmv@cluster.m0l2daj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster

REDIS_URL=redis://default:lgQgpLzquObqvggLTFKdQh8z6jGZTJiv@redis-19661.c61.us-east-1-3.ec2.redns.redis-cloud.com:19661

NODE_ENV=production

PORT=3000
```

## After First Deployment

Once Vercel assigns your URL (e.g., `anonshare-xyz123.vercel.app`), update:

```
NEXT_PUBLIC_APP_URL=https://anonshare-xyz123.vercel.app
```

Then click "Redeploy" to apply the changes.

## Important Notes

1. **All variables** should be added to the **Production** environment
2. You can also add them to **Preview** for testing
3. After adding/changing variables, always redeploy
4. Variables starting with `NEXT_PUBLIC_` are exposed to the browser
5. Keep `MONGO_URI` and `REDIS_URL` secret (don't commit to git)

## Vercel Dashboard Steps

1. Go to your project in Vercel
2. Click "Settings"
3. Click "Environment Variables"
4. For each variable above:
   - Enter the Name (e.g., `MONGO_URI`)
   - Enter the Value
   - Select environment: "Production" (and optionally "Preview")
   - Click "Save"
5. Go to "Deployments" tab
6. Click "Redeploy" on the latest deployment
