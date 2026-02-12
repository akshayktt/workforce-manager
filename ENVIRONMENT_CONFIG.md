# Environment Configuration Guide

## How to Set EXPO_PUBLIC_DOMAIN for Different Environments

The app now uses `EXPO_PUBLIC_DOMAIN` to determine the API server location. Here's how to configure it:

### For Local Development
```bash
npm run start  # Uses: EXPO_PUBLIC_DOMAIN=localhost:4000 
```

### For Production Deployment
```bash
# Set environment variable before starting
export EXPO_PUBLIC_DOMAIN=api.yourproductiondomain.com
npm run start:prod
```

### For Replit Development
```bash
npm run expo:dev  # Uses: EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOMAIN:4000
```

## Protocol Selection
The app automatically selects the correct protocol:
- `localhost` or `127.0.0.1` → `http://`
- All other domains → `https://`

## Examples
- Development: `http://localhost:4000`
- Production: `https://api.yourapp.com` 
- Replit: `https://yourapp.replit.dev:4000`

## Production Environment Variables
When deploying to production, make sure to set:
```bash
EXPO_PUBLIC_DOMAIN=your-api-domain.com
DATABASE_URL=your-production-database-url
SESSION_SECRET=your-secure-session-secret
PORT=4000
ALLOWED_ORIGINS=https://yourfrontend.com,https://www.yourfrontend.com
```