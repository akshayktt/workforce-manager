# 🚀 Vercel Deployment - Quick Start

## Prerequisites

Before deploying, make sure you have:
- ✅ GitHub account with your code pushed
- ✅ Vercel account (free at https://vercel.com)
- ✅ Environment variables ready
- ✅ Database URL from Neon

---

## 3-Step Deployment Process

### Step 1: Go to Vercel and Connect GitHub

1. Visit: https://vercel.com/new
2. Click "Import Project"
3. Select "Import Git Repository"
4. Paste your repo URL: https://github.com/akshayktt/workforce-manager
5. Click "Continue"

### Step 2: Configure Project Settings

When prompted:
- **Framework Preset**: Node.js
- **Root Directory**: Leave as is (default)
- **Build Command**: Leave as default or use `npm run server:build`
- **Output Directory**: Leave as default

### Step 3: Add Environment Variables

Before clicking Deploy, add these environment variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon PostgreSQL connection string |
| `SESSION_SECRET` | Your session secret key (any random string) |
| `EXPO_PUBLIC_DOMAIN` | Will be auto-filled with your Vercel URL |
| `NODE_ENV` | `production` |

Example:
```
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
SESSION_SECRET=your-super-secret-key-here-123456789
EXPO_PUBLIC_DOMAIN=workforce-manager.vercel.app
NODE_ENV=production
```

---

## How to Get Your Environment Variables

### DATABASE_URL (From Neon)
1. Go to: https://console.neon.tech
2. Select your project
3. Go to "Connection string"
4. Copy the PostgreSQL connection string
5. Make sure to use the one with `sslmode=require` for production

### SESSION_SECRET
- Can be any random string (at least 32 characters)
- Example: `abc123xyz789def456ghi012jkl345mno789pqr`
- Or generate online: https://generate-random.org/

### EXPO_PUBLIC_DOMAIN
- Will be automatically set by Vercel
- Format: `your-project-name.vercel.app`
- Or use your custom domain if you have one

---

## Deploy Now!

Once all environment variables are added:
1. Click **Deploy** button
2. Wait for build to complete (2-5 minutes)
3. Your app will be live at your Vercel URL! 🎉

---

## Verify Deployment

After deployment completes:

1. **Check Status**
   - ✅ Build successful (no red errors)
   - ✅ Deployment complete

2. **Visit Your App**
   - Click "Visit" button or go to your Vercel URL
   - Should see your Workforce Manager app

3. **Test API**
   - Try logging in
   - Verify database connections work
   - Check if projects load

4. **Check Logs** (if issues occur)
   - Go to "Deployments"
   - Click on your deployment
   - View "Build Logs" and "Function Logs"

---

## Troubleshooting

### Build Failed?
**Check the build logs:**
1. Go to Vercel dashboard
2. Click your project
3. Click the failed deployment
4. Click "Build Logs" tab
5. Look for error messages

**Common issues:**
- Missing environment variables
- TypeScript errors
- Missing dependencies in package.json

### App Loads But API Doesn't Work?
**Check the function logs:**
1. Go to "Deployments" → Your deployment
2. Click "Runtime Logs"
3. Make requests to your app and watch for errors

**Common issues:**
- DATABASE_URL not set
- SESSION_SECRET not set
- Database not accessible from Vercel

### Blank Page?
**Check the runtime logs:**
1. Open browser DevTools (F12)
2. Go to "Console" tab
3. Look for JavaScript errors
4. Check network requests

---

## Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Project Settings**: https://vercel.com/dashboards/your-project/settings
- **Environment Variables**: https://vercel.com/dashboards/your-project/settings/environment-variables
- **Deployments**: https://vercel.com/dashboards/your-project/deployments
- **Analytics**: https://vercel.com/dashboards/your-project/analytics

---

## Next Steps After Successful Deployment

1. **Share the URL with your team**
   ```
   https://workforce-manager.vercel.app
   ```

2. **Set up a custom domain** (optional)
   - Go to project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration

3. **Enable auto-deployments**
   - Already enabled by default
   - Every push to `main` branch auto-deploys

4. **Monitor performance**
   - Check Analytics dashboard
   - Review error rates
   - Optimize slow queries

---

## Production Checklist

- [ ] Environment variables configured
- [ ] Database connection working
- [ ] Authentication tested
- [ ] API endpoints responding
- [ ] Static files loading
- [ ] HTTPS working (automatic)
- [ ] No console errors
- [ ] Performance acceptable

---

**Ready? Go to https://vercel.com/new and start deploying!** 🚀
