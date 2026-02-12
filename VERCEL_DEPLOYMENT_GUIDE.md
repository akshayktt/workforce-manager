# Complete Vercel Deployment Guide

A comprehensive step-by-step guide for deploying full-stack applications to Vercel, supporting both React Native (Expo) web apps and static HTML applications with Node.js API and PostgreSQL database.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Project Structure Setup](#project-structure-setup)
- [Environment Configuration](#environment-configuration)
- [API Structure for Serverless](#api-structure-for-serverless)
- [Frontend Preparation](#frontend-preparation)
- [Deployment Process](#deployment-process)
- [Testing & Verification](#testing--verification)
- [Common Issues & Solutions](#common-issues--solutions)
- [Production Optimization](#production-optimization)

## Prerequisites

### Required Tools
```bash
# Install Vercel CLI globally
npm install -g vercel

# Ensure you have Node.js 18+ installed
node --version
npm --version
```

### Account Setup
1. Create a free Vercel account at [vercel.com](https://vercel.com)
2. Connect your GitHub account (recommended for CI/CD)

## Project Structure Setup

### 1. Organize Your Project Structure

#### For React Native (Expo) Apps:
```
your-react-native-project/
├── api/                    # Vercel serverless functions
│   ├── test.ts            # Test endpoint
│   ├── auth/
│   │   ├── login.ts       # Login endpoint
│   │   └── me.ts          # Auth check endpoint
│   └── users.ts           # Users endpoint
├── app/                   # Expo Router pages
│   ├── index.tsx          # Login screen
│   ├── admin.tsx          # Admin dashboard
│   ├── supervisor.tsx     # Supervisor dashboard
│   └── labor.tsx          # Labor dashboard
├── dist/                  # React Native web build output (generated)
├── lib/                   # Shared utilities
├── shared/                # Shared schemas/types
├── package.json
├── app.json               # Expo configuration
└── vercel.json            # Vercel configuration
```

#### For Static HTML Apps:
```
your-static-project/
├── api/                    # Vercel serverless functions
│   ├── test.ts            # Test endpoint
│   ├── auth/
│   │   ├── login.ts       # Login endpoint
│   │   └── me.ts          # Auth check endpoint
│   └── users.ts           # Users endpoint
├── static-build/          # Frontend build output
│   └── index.html         # Main frontend file
├── server/                # Original server code (for reference)
├── shared/                # Shared schemas/types
├── package.json
└── vercel.json            # Vercel configuration
```

### 2. Update package.json Scripts

#### For React Native (Expo) Apps:
```json
{
  "scripts": {
    "build": "npx expo export --platform web --output-dir dist && npm run server:build",
    "build:web": "npx expo export --platform web --output-dir dist",
    "build:vercel": "npx expo export --platform web --output-dir dist && npm run server:build",
    "server:build": "esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=server_dist",
    "start": "EXPO_PUBLIC_DOMAIN=localhost:4000 npx expo start --port 8081",
    "dev": "npm run server:dev",
    "server:dev": "cross-env NODE_ENV=development tsx server/index.ts"
  }
}
```

#### For Static HTML Apps:
```json
{
  "scripts": {
    "build": "npm run server:build",
    "build:vercel": "npm run server:build",
    "server:build": "esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=server_dist",
    "start:prod": "EXPO_PUBLIC_DOMAIN=${EXPO_PUBLIC_DOMAIN} npx expo start --port 8081"
  }
}
```

## Environment Configuration

### 1. Create vercel.json Configuration

#### For React Native (Expo) Apps:
```json
{
  "version": 2,
  "public": false,
  "outputDirectory": "dist",
  "env": {
    "NODE_ENV": "production"
  },
  "regions": ["iad1"]
}
```

#### For Static HTML Apps:
```json
{
  "version": 2,
  "public": false,
  "outputDirectory": "static-build",
  "env": {
    "NODE_ENV": "production"
  },
  "regions": ["iad1"]
}
```

### 2. Environment Variables Setup
Required environment variables for production:
- `DATABASE_URL` - Your production database connection string
- `SESSION_SECRET` - Secure session secret for authentication  
- `EXPO_PUBLIC_DOMAIN` - Your deployed domain (e.g., yourapp.vercel.app)

**For React Native Apps**: The `EXPO_PUBLIC_DOMAIN` variable is critical as it tells the app where to make API calls in production.

## API Structure for Serverless

### 1. Create Individual API Endpoints
Vercel requires individual files for each API endpoint in the `/api` directory.

#### Example: Login Endpoint (`/api/auth/login.ts`)
```typescript
// Import database components for login functionality
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import pg from "pg";
import bcrypt from "bcryptjs";
import { users } from "../../shared/schema";

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { username, password } = req.body || {};
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password required' });
      }

      // Connect to database
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        return res.status(500).json({ message: 'Database not configured' });
      }

      const pool = new pg.Pool({ connectionString: databaseUrl });
      const db = drizzle(pool);
      
      // Get user from database
      const [user] = await db.select().from(users).where(eq(users.username, username));
      
      if (!user) {
        await pool.end();
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        await pool.end();
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      await pool.end();

      return res.status(200).json({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role
      });

    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
```

#### Example: Test Endpoint (`/api/test.ts`)
```typescript
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({ 
    message: 'API is working!', 
    timestamp: new Date().toISOString(),
    method: req.method,
    environment: process.env.NODE_ENV || 'development'
  });
}
```

### 2. Key API Best Practices
- **Always include CORS headers** for frontend access
- **Handle OPTIONS requests** for preflight CORS checks
- **Close database connections** to prevent connection leaks
- **Use environment variables** for sensitive data
- **Include proper error handling** with try-catch blocks

## Frontend Preparation

### Option 1: React Native (Expo) App

#### 1. Configure Expo for Web
Ensure your `app.json` includes web configuration:
```json
{
  "expo": {
    "name": "Your App",
    "platforms": ["ios", "android", "web"],
    "web": {
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      [
        "expo-router",
        {
          "origin": "https://yourapp.vercel.app"
        }
      ]
    ]
  }
}
```

#### 2. Create App Structure
Organize your React Native screens in the `/app` directory:
```typescript
// app/index.tsx - Login screen
import React from "react";
import { View, Text } from "react-native";

export default function LoginScreen() {
  // Your login component
  return (
    <View>
      <Text>Login Screen</Text>
    </View>
  );
}
```

#### 3. Configure API Integration
Set up your API client to use the production domain:
```typescript
// lib/query-client.ts
export function getApiUrl(): string {
  let host = process.env.EXPO_PUBLIC_DOMAIN;
  
  if (!host) {
    throw new Error("EXPO_PUBLIC_DOMAIN is not set");
  }
  
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}
```

### Option 2: Static HTML App

#### 1. Create Production-Ready Frontend
Create `/static-build/index.html` with your application interface:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Your App</title>
    <style>
      /* Your CSS styles */
      body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
    </style>
</head>
<body>
    <div id="root">
        <!-- Your app content -->
    </div>
    <script>
        // Your JavaScript code
        // API calls to your serverless functions
    </script>
</body>
</html>
```

#### 2. Frontend-API Integration
- Use relative paths for API calls: `/api/auth/login`
- Include proper error handling for network requests
- Implement loading states for better UX

## Deployment Process

### 1. Install and Login to Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login to your Vercel account
vercel login
# Follow the browser authentication flow
```

### 2. Build Your Application

#### For React Native (Expo) Apps:
```bash
# Build React Native app for web
npm run build:web
# This runs: npx expo export --platform web --output-dir dist

# Or build everything (web + server)
npm run build:vercel
```

#### For Static HTML Apps:
```bash
# Build the application for production
npm run build:vercel
```

### 3. Initial Deployment
```bash
# Deploy to production
vercel --prod

# Follow the prompts:
# ? Set up and deploy "~/your-project"? yes
# ? Which scope should contain your project? [Select your account]
# ? Found project. Link to it? yes
```

### 4. Configure Environment Variables
```bash
# Add database URL
vercel env add DATABASE_URL production
# Enter your database connection string when prompted

# Add session secret (optional for basic apps)
vercel env add SESSION_SECRET production
# Enter a secure session secret

# Add your domain (CRITICAL for React Native apps)
echo "yourapp.vercel.app" | vercel env add EXPO_PUBLIC_DOMAIN production
# Replace yourapp.vercel.app with your actual Vercel domain
```

**Note**: For React Native apps, the `EXPO_PUBLIC_DOMAIN` must match your actual Vercel deployment URL.

### 5. Redeploy with Environment Variables
```bash
# For React Native apps, rebuild with new environment variables
npm run build:web  # Rebuild with production env vars
vercel --prod      # Deploy the updated build

# For Static HTML apps
vercel --prod      # Deploy with environment variables
```

## Testing & Verification

### 1. Test API Endpoints
```bash
# Test your deployed API
curl https://yourapp.vercel.app/api/test

# Test login functionality
curl -X POST https://yourapp.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}'
```

### 2. Frontend Testing
- Visit your deployed URL: `https://yourapp.vercel.app`
- Test all user interactions
- Verify API integration works
- Check browser console for errors

### 3. Database Connection Verification
- Test login with real database credentials
- Verify data is being read/written correctly
- Monitor Vercel function logs for database errors

## Common Issues & Solutions

### Issue 1: React Native App Not Loading APIs
**Symptoms**: Login fails, API calls return network errors in browser console
**Solution**: Verify `EXPO_PUBLIC_DOMAIN` environment variable is set correctly
```bash
# Check current environment variables
vercel env ls

# Update the domain (replace with your actual Vercel URL)
echo "your-app.vercel.app" | vercel env add EXPO_PUBLIC_DOMAIN production

# Rebuild and redeploy
npm run build:web
vercel --prod
```

### Issue 2: "Functions property cannot be used with builds property"
**Solution:** Remove conflicting configuration in `vercel.json`
```json
{
  "version": 2,
  "outputDirectory": "static-build",
  "env": { "NODE_ENV": "production" }
}
```

### Issue 2: "Serverless Functions limited to 1024mb memory for Hobby plan"
**Solution:** Reduce memory allocation or upgrade plan
```json
// Remove or reduce memory settings for Hobby plan
// Vercel automatically allocates appropriate memory
```

### Issue 3: "No Output Directory found"
**Symptoms**: Build succeeds but deployment fails with output directory error
**Solution**: Ensure your `vercel.json` points to the correct build directory
```json
// For React Native apps:
{ "outputDirectory": "dist" }

// For Static HTML apps:
{ "outputDirectory": "static-build" }
```

### Issue 4: "API routes returning 404"
**Solution:** 
- Ensure API files are in `/api` directory
- Use individual files instead of catch-all routes
- Check file naming matches URL structure

### Issue 5: "Database connection issues"
**Solution:**
- Verify `DATABASE_URL` environment variable is set
- Ensure database allows connections from Vercel IPs
- Always close database connections in serverless functions

### Issue 6: "CORS errors"
**Solution:** Include proper CORS headers in all API functions:
```typescript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
```

## React Native Specific Considerations

### 1. Build Process
- React Native apps require `expo export --platform web` to generate web-compatible bundles
- The build outputs to `dist/` directory by default
- Assets, fonts, and icons are automatically optimized for web

### 2. Environment Variables
- React Native apps can only access `EXPO_PUBLIC_*` prefixed variables in the frontend
- Set `EXPO_PUBLIC_DOMAIN` to your production Vercel URL for API calls
- Rebuild the app after changing environment variables

### 3. Routing
- Use Expo Router for file-based routing in React Native apps
- Routes like `/admin`, `/supervisor`, `/labor` work automatically
- Navigation between screens happens client-side

### 4. Performance
- React Native web bundles are larger than static HTML
- First load may be slower due to JS bundle size
- Consider code splitting for production apps

## Production Optimization

### 1. Monitoring & Logs
- Use Vercel dashboard to monitor function performance
- Check function logs for errors: `vercel logs --follow`
- Set up error tracking (Sentry, LogRocket, etc.)

### 2. Performance Optimization
- Minimize bundle sizes for faster cold starts
- Use connection pooling for database connections
- Implement caching where appropriate
- Optimize images and static assets

### 3. Security Best Practices
- Use environment variables for all secrets
- Implement rate limiting on API endpoints
- Add input validation and sanitization
- Use HTTPS everywhere (automatic with Vercel)

### 4. Scaling Considerations
- Monitor function execution time and memory usage
- Consider upgrading to Pro plan for higher limits
- Implement database connection pooling for high traffic
- Use Vercel Edge Functions for better global performance

## Useful Vercel CLI Commands

```bash
# List all deployments
vercel ls

# Check deployment status
vercel inspect [deployment-url]

# View function logs
vercel logs

# Remove deployment
vercel remove [deployment-name]

# List environment variables
vercel env ls

# Pull environment variables to local
vercel env pull

# Link local project to Vercel project
vercel link
```

## Summary

This guide covers deployment of both React Native (Expo) web apps and static HTML applications to Vercel. Key success factors:

**For React Native Apps:**
1. **Proper Expo web export** using `npx expo export --platform web`
2. **Correct outputDirectory** set to `dist` in vercel.json
3. **Environment variable setup** especially `EXPO_PUBLIC_DOMAIN`
4. **Rebuild after env changes** to embed variables in the bundle

**For All Applications:**
1. **Individual API endpoints** in `/api` directory for serverless functions
2. **Environment variable management** for sensitive data
3. **CORS configuration** for frontend-backend communication
4. **Database connection handling** with proper cleanup
5. **Thorough testing** of both frontend and API functionality

Following these steps will result in a fully functional, production-ready application deployed on Vercel's global edge network.