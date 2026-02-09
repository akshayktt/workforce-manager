# Replit Deployment Guide

## Overview
Your Workforce Manager application is **already configured for Replit** deployment. The `.replit` file and build scripts are ready to use. Replit provides automatic hosting with zero configuration needed.

## Prerequisites
- Replit account (free at https://replit.com)
- GitHub repository with your code (✅ Already set up at https://github.com/akshayktt/workforce-manager)
- Neon PostgreSQL database connection string

## Step 1: Import Repository to Replit

1. Go to https://replit.com/new
2. Select **"Import from GitHub"**
3. Paste your repository URL:
   ```
   https://github.com/akshayktt/workforce-manager
   ```
4. Click **"Import"**
5. Replit will clone your repository and create a new Repl

## Step 2: Add Environment Variables

Once the Repl is created:

1. Click the **Secrets** icon (lock icon) in the left sidebar
2. Add these environment variables:

| Variable | Value | Example |
|----------|-------|---------|
| `DATABASE_URL` | Your Neon PostgreSQL connection string | `postgresql://user:password@host/dbname` |
| `SESSION_SECRET` | Random secure string (generate one) | `your-random-secret-key-here` |
| `NODE_ENV` | Set to `production` | `production` |

**To get your `DATABASE_URL` from Neon:**
1. Go to https://console.neon.tech
2. Select your project → Database
3. Copy the connection string
4. Paste it into the `DATABASE_URL` secret

## Step 3: Start the Application

1. Click the **"Run"** button (or press Ctrl+Enter)
2. Replit will:
   - Install dependencies (`npm install`)
   - Build the frontend (Expo static web build)
   - Start the Express.js server on port 5000
   - Expose the app at `https://your-repl-name.replit.dev`

## Step 4: Access Your App

Your application will be available at:
```
https://your-repl-name.replit.dev
```

Replace `your-repl-name` with your actual Repl name.

## How It Works

The `.replit` file configures:
- **`run`** command: `npm run dev` (starts both frontend and backend)
- **Port**: 5000 (Express server)
- **Port visibility**: Public (accessible from the internet)

When you click **"Run"**, Replit:
1. ✅ Installs dependencies
2. ✅ Compiles TypeScript
3. ✅ Builds the Expo web static assets
4. ✅ Starts the Express.js server
5. ✅ Serves your application on the web

## Monitoring & Logs

- **Console Output**: Available in the Replit console tab
- **Server Logs**: Shows API requests, authentication, database queries
- **Frontend Logs**: Shows React warnings/errors (if any)

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development (frontend + backend) |
| `npm run server:dev` | Start only the backend server |
| `npm run expo:dev` | Start only the frontend Expo dev server |
| `npm run server:prod` | Start production mode |
| `npm run build` | Build for production |

## Database Connection

- **Database**: Neon PostgreSQL (external, serverless)
- **Connection**: Made via `DATABASE_URL` environment variable
- **Schema**: Automatically managed by Drizzle ORM (`drizzle-kit push`)
- **Sessions**: Stored in PostgreSQL via `connect-pg-simple`

## Features on Replit

✅ **Multi-platform**: iOS, Android, and Web from same codebase
✅ **Authentication**: Session-based with role system (admin/supervisor/labor)
✅ **Database**: PostgreSQL with automatic schema management
✅ **API**: RESTful endpoints with role-based access control
✅ **Real-time Updates**: React Query for server state management
✅ **Production Ready**: Minified builds, error handling, logging

## Troubleshooting

### "Cannot connect to database"
- Check `DATABASE_URL` is correct in Secrets
- Verify Neon connection string is active
- Check firewall allows PostgreSQL from Replit

### "Port 5000 already in use"
- Replit automatically handles port conflicts
- Try stopping and restarting the Repl

### "Module not found" errors
- Click the **Shell** tab and run: `npm install`
- Then restart the application

### "Express server won't start"
- Check the console for error messages
- Verify `DATABASE_URL` is set correctly
- Ensure `SESSION_SECRET` is defined

### "Frontend not rendering"
- Check that port 5000 is publicly accessible
- Verify `REPLIT_DEV_DOMAIN` environment variable is set (automatic)
- Clear browser cache and refresh

## Updating Your App

To update your deployed app:

1. **Push changes to GitHub**:
   ```bash
   git add .
   git commit -m "Your message"
   git push origin main
   ```

2. **Pull latest in Replit**:
   - Click the **Shell** tab
   - Run: `git pull origin main`
   - Click **"Run"** to restart

3. **Deploy automatically** (optional):
   - Use Replit's GitHub integration for auto-deployment
   - Configure in Repl Settings → Deploy

## Team Collaboration

Replit supports:
- **Multiplayer editing**: Invite team members to code together
- **Version control**: Built-in Git integration
- **Environment**: Isolated Repl per team member or shared Repl

## Performance & Scaling

**Replit Free Tier**:
- ✅ Sufficient for development and small production use
- ✅ Always-on applications available with Replit Boosts
- ✅ 512MB RAM, 100GB storage

**For production scale-up**:
- Consider Replit Boosts for always-on hosting
- Use Replit's scaling features for higher traffic
- Monitor database performance with Neon dashboards

## Cost

- **Replit Free**: $0/month (may have activity timeouts)
- **Replit Boosts**: $20/month (always-on, recommended for production)
- **Neon Database**: $0-200/month (pay-as-you-go, starts free)
- **Total**: $0-220/month for production

## Next Steps

1. ✅ Import repository to Replit
2. ✅ Add environment variables (DATABASE_URL, SESSION_SECRET)
3. ✅ Click "Run"
4. ✅ Test your app at `https://your-repl-name.replit.dev`
5. ✅ Share the link with your team

## Support

- **Replit Docs**: https://docs.replit.com
- **Project Docs**: See `docs/` folder in repository
- **GitHub Issues**: Report bugs at https://github.com/akshayktt/workforce-manager

---

**Status**: ✅ Ready for production on Replit. No additional configuration needed.
