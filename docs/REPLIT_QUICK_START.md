# Replit Quick Start - 3 Steps

Deploy your Workforce Manager app to Replit in 3 minutes.

## Step 1: Import Repository
Go to **https://replit.com/new** → Select **"Import from GitHub"** → Paste:
```
https://github.com/akshayktt/workforce-manager
```
Click **Import**.

## Step 2: Add Secrets
Click the **Secrets** icon (🔒) in the left sidebar. Add:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Your Neon connection string (from https://console.neon.tech) |
| `SESSION_SECRET` | Any random string (e.g., `my-secure-random-key-12345`) |
| `NODE_ENV` | `production` |

**Getting your Neon connection string**:
1. Go to https://console.neon.tech
2. Select your project
3. Click "Database" → Copy connection string
4. Paste into `DATABASE_URL` secret

## Step 3: Run & Deploy
Click **"Run"** (or press Ctrl+Enter).

Replit will:
- ✅ Install dependencies
- ✅ Build your app
- ✅ Start the server
- ✅ Provide a public URL (e.g., `https://workforce-manager.replit.dev`)

Your app is **live** at that URL! 🎉

---

## Environment Variables Reference

```json
{
  "DATABASE_URL": "postgresql://user:pass@host/dbname",
  "SESSION_SECRET": "your-random-secret-here",
  "NODE_ENV": "production"
}
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot connect to database" | Check DATABASE_URL in Secrets is correct |
| "Cannot GET /" | Wait 30 seconds for build to complete |
| "Express won't start" | Verify DATABASE_URL and SESSION_SECRET are set |
| Port conflicts | Replit handles automatically; restart if needed |

## Verify It's Working

1. Visit your Replit URL
2. Try to login (test credentials in database)
3. Check the console for errors
4. Navigate through the app

✅ **Done!** Your production app is now live on Replit.

---

## Next: Update Your App

To deploy updates:
```bash
# In your local terminal:
git push origin main

# In Replit Shell tab:
git pull origin main
# Then click "Run" again
```

---

**For full documentation**, see `docs/REPLIT_DEPLOYMENT_GUIDE.md`
