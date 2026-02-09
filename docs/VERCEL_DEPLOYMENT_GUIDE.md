# 🚀 Vercel Deployment Guide for Workforce Manager

## Pre-Deployment Checklist

✅ Project on GitHub: https://github.com/akshayktt/workforce-manager
✅ All code committed and pushed
✅ Environment variables configured locally
✅ Database (Neon) already in cloud
✅ Project structure organized

---

## Step 1: Prepare Vercel Configuration

Create a `vercel.json` file at the root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "app.json",
      "use": "@vercel/static-build",
      "config": { "distDir": ".expo/web" }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": ".expo/web/index.html",
      "status": 200
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

---

## Step 2: Update Environment Variables

Your `.env` file should have:
```
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret-key
EXPO_PUBLIC_DOMAIN=your-vercel-domain.vercel.app
NODE_ENV=production
```

---

## Step 3: Deploy to Vercel

### Option A: Using Vercel CLI (Fastest)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel deploy --prod
```

### Option B: Using Vercel Web Dashboard (Easiest)

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Select framework: Next.js (or Node.js)
4. Add environment variables
5. Click Deploy

---

## Step 4: Environment Variables in Vercel

In Vercel Dashboard:
1. Go to Settings → Environment Variables
2. Add:
   ```
   DATABASE_URL = your-neon-database-url
   SESSION_SECRET = your-session-secret
   EXPO_PUBLIC_DOMAIN = your-app.vercel.app
   NODE_ENV = production
   ```

---

## Step 5: Configure Build and Start Commands

In `package.json`, ensure you have:
```json
{
  "scripts": {
    "build": "npm run build:server && npm run build:web",
    "build:server": "tsc server/index.ts --outDir .vercel/output/functions",
    "build:web": "expo export:web",
    "start": "node server/index.ts",
    "dev": "concurrently \"npm run server:dev\" \"expo start\""
  }
}
```

---

## Step 6: Verify Deployment

After deployment:
1. ✅ Check Vercel dashboard for build status
2. ✅ Visit your production URL
3. ✅ Test API endpoints
4. ✅ Verify database connections
5. ✅ Test authentication flow

---

## Expected Production URL

```
https://workforce-manager.vercel.app
```

Or custom domain if configured.

---

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all dependencies in package.json
- Check for TypeScript errors

### Environment Variables Missing
- Ensure all vars added to Vercel dashboard
- Redeploy after adding variables

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check Neon database is accessible
- Ensure firewall allows Vercel IPs

### API Not Responding
- Check server/index.ts for errors
- Verify port configuration
- Check middleware setup

---

## Quick Deployment Commands

```bash
# Build locally
npm run build

# Test production build
npm start

# Deploy to staging
vercel deploy

# Deploy to production
vercel deploy --prod
```

---

## Next Steps After Deployment

1. **Share Production URL**
   - Team members can use the deployed app
   - No more localhost development environment

2. **Set Up Custom Domain**
   - Go to Vercel dashboard
   - Add your custom domain
   - Configure DNS records

3. **Enable Auto-Deploy**
   - Push to main branch
   - Vercel automatically deploys
   - No manual deployment needed

4. **Monitor Performance**
   - Check analytics in Vercel dashboard
   - Monitor database performance
   - Track error rates

---

## Security Considerations

- ✅ Keep secrets out of repository (use .env files with .gitignore)
- ✅ Use environment variables for sensitive data
- ✅ Enable SSL/TLS (automatic on Vercel)
- ✅ Implement rate limiting
- ✅ Add CORS protection
- ✅ Use secure session cookies

---

## Cost Estimation

```
Vercel (Frontend): $0-20/month
Neon Database: $0-50/month
Total: $0-70/month depending on usage
```

---

## Deployment Ready? 

You're all set! Ready to deploy? Follow the steps above!

Need help? Check the troubleshooting section or let me know!
