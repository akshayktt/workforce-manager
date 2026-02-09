# 🚀 Detailed Hosting Setup Guides

## TABLE OF CONTENTS

1. [Vercel Setup](#vercel-setup) (RECOMMENDED)
2. [Railway Setup](#railway-setup)
3. [AWS EC2 Setup](#aws-ec2-setup)
4. [Docker VPS Setup](#docker-vps-setup)

---

## VERCEL SETUP ⭐

### Prerequisites
- GitHub account (repo must be on GitHub)
- Vercel account (free)
- Your Neon PostgreSQL credentials

### Step-by-Step Guide

#### 1. Prepare Your Repository

```bash
# Make sure all changes are committed to GitHub
cd c:\Users\Megha\OneDrive\Desktop\Workforce-manager\Workforce-Manager
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

#### 2. Create vercel.json

Create `vercel.json` in project root:

```json
{
  "buildCommand": "npm run server:build && npm run expo:static:build",
  "outputDirectory": ".",
  "env": {
    "DATABASE_URL": "@database_url",
    "SESSION_SECRET": "@session_secret",
    "NODE_ENV": "production"
  },
  "envFile": ".env.production"
}
```

#### 3. Sign Up on Vercel

```bash
# Option A: Visit vercel.com and sign up with GitHub
# Option B: Use CLI
npm install -g vercel
vercel login
```

#### 4. Deploy Project

```bash
# Using CLI
vercel deploy --prod

# Or just:
vercel

# Follow prompts:
# 1. Link existing project? No (new project)
# 2. Project name? workforce-manager
# 3. Directory? . (current)
# 4. Build command? npm run server:build
# 5. Output directory? .
# 6. Environment variables? (add them in next step)
```

#### 5. Set Environment Variables

```bash
# Option A: Using CLI
vercel env add DATABASE_URL
vercel env add SESSION_SECRET
vercel env add EXPO_PUBLIC_DOMAIN

# Option B: In Vercel Dashboard
# 1. Go to Settings → Environment Variables
# 2. Add:
#    - DATABASE_URL: your_neon_db_url
#    - SESSION_SECRET: generate_strong_random_string
#    - EXPO_PUBLIC_DOMAIN: your-project.vercel.app
```

#### 6. Redeploy with Environment Variables

```bash
vercel deploy --prod
```

#### 7. Set Custom Domain (Optional)

```bash
# In Vercel Dashboard:
# 1. Go to Settings → Domains
# 2. Add your domain
# 3. Update DNS records as shown
# 4. Wait 24 hours for DNS propagation
```

### Verify Deployment

```bash
# Your app will be at:
https://workforce-manager.vercel.app

# API endpoints at:
https://workforce-manager.vercel.app/api/*

# Update your frontend:
EXPO_PUBLIC_DOMAIN=workforce-manager.vercel.app
```

### Configuration Files Needed

Create `.env.production`:

```env
DATABASE_URL=postgresql://neondb_owner:...@ep-patient-dust-air2gcev-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
SESSION_SECRET=your-very-long-random-string-here
EXPO_PUBLIC_DOMAIN=workforce-manager.vercel.app
NODE_ENV=production
```

### Important Notes

⚠️ **Serverless Cold Starts**: First request may take 2-5 seconds  
✅ **Auto Scaling**: Handles traffic spikes automatically  
✅ **Auto HTTPS**: SSL certificate provided automatically  
✅ **Auto Deployments**: Deploys when you push to GitHub

---

## RAILWAY SETUP

### Prerequisites
- GitHub account
- Railway account (free signup)
- Neon PostgreSQL credentials

### Step-by-Step Guide

#### 1. Create Railway Account

Visit `railway.app` and sign up with GitHub

#### 2. Create New Project

```bash
# In Railway Dashboard:
# 1. Click "New Project"
# 2. Select "Deploy from GitHub repo"
# 3. Authorize Railway to access GitHub
# 4. Select workforce-manager repo
```

#### 3. Configure Build Settings

```bash
# In Railway Dashboard → Settings:
# Build Command: npm run server:build && npm run expo:static:build
# Start Command: npm run server:prod
# Working Directory: ./
```

#### 4. Add Environment Variables

```bash
# In Railway Dashboard → Variables:
# Add the following:
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secure-string
EXPO_PUBLIC_DOMAIN=your-railway-domain.up.railway.app
NODE_ENV=production
```

#### 5. Deploy

```bash
# Just push to GitHub and Railway auto-deploys!
git push origin main
```

#### 6. Get Your Domain

```bash
# Railway provides a free domain:
# https://workforce-manager-prod.up.railway.app

# Or add custom domain:
# In Dashboard → Settings → Domains → Add Custom Domain
```

### Verify Deployment

```bash
# Test your API
curl https://workforce-manager-prod.up.railway.app/api/health

# Update frontend config
EXPO_PUBLIC_DOMAIN=workforce-manager-prod.up.railway.app
```

### Cost Comparison

| Component | Free Tier | Cost |
|-----------|-----------|------|
| App Deployment | $5/month credits | $0.0417/hour after |
| Database | Same as Neon | N/A (using external) |
| Bandwidth | Included | Included |

---

## AWS EC2 SETUP

### Prerequisites
- AWS account
- SSH key pair created
- Neon PostgreSQL connection string

### Step 1: Launch EC2 Instance

```bash
# In AWS Console:
# 1. Go to EC2 → Instances → Launch Instance
# 2. Choose: Ubuntu Server 22.04 LTS (Free Tier eligible)
# 3. Instance Type: t3.micro (free) or t3.small ($8/month)
# 4. Add Storage: 20 GB (free tier)
# 5. Security Group: Allow HTTP, HTTPS, SSH
# 6. Review and Launch
# 7. Download key pair (.pem file)
```

### Step 2: Connect to Instance

```bash
# Change permissions on key
chmod 400 your-key-pair.pem

# SSH into instance
ssh -i your-key-pair.pem ubuntu@your-instance-public-ip
```

### Step 3: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git
sudo apt install -y git

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

### Step 4: Clone and Setup Project

```bash
# Clone your repository
git clone https://github.com/yourusername/workforce-manager.git
cd workforce-manager

# Install dependencies
npm install

# Build server
npm run server:build

# Build frontend
npm run expo:static:build
```

### Step 5: Configure Environment

```bash
# Create production .env
nano .env.production

# Add:
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secure-random-string
EXPO_PUBLIC_DOMAIN=your-domain.com
NODE_ENV=production

# Save: Ctrl+O, Enter, Ctrl+X
```

### Step 6: Setup Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/default

# Add:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location ~ ^/(api|auth) {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}

# Restart Nginx
sudo systemctl restart nginx
```

### Step 7: Start Application with PM2

```bash
# Start server with PM2
pm2 start npm -- run server:prod

# Start another instance for static files
pm2 serve ./public 3000

# Save PM2 config
pm2 save

# Make PM2 start on boot
pm2 startup
# Follow the commands it outputs
```

### Step 8: Setup SSL Certificate

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d your-domain.com

# Update Nginx to use SSL
sudo nano /etc/nginx/sites-available/default

# Add:
server {
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # ... rest of config
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### Step 9: Setup Domain

```bash
# In your domain registrar:
# Point domain to EC2 instance's Elastic IP
# A record: your-domain.com → xxx.xxx.xxx.xxx (Elastic IP)
```

### Monitoring Commands

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs

# Monitor real-time
pm2 monit

# Restart app
pm2 restart all

# Stop app
pm2 stop all
```

### Cost Estimate (AWS)

| Component | Cost |
|-----------|------|
| t3.small EC2 | $8.93/month |
| Data Transfer | $1-5/month |
| Elastic IP | Free (if used) |
| Total | ~$10-15/month |

---

## DOCKER VPS SETUP

### Prerequisites
- DigitalOcean / Vultr / Linode account
- Neon PostgreSQL URL
- Basic Linux knowledge

### Step 1: Create VPS Instance

```bash
# On DigitalOcean / similar:
# 1. Create Droplet
# 2. OS: Ubuntu 22.04
# 3. Size: 1GB RAM ($5/month)
# 4. Region: Closest to you
# 5. Add SSH key
# 6. Create
```

### Step 2: Create Dockerfile

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY . .

# Build app
RUN npm run server:build && npm run expo:static:build

# Expose ports
EXPOSE 5000 3000

# Start server
CMD ["npm", "run", "server:prod"]
```

### Step 3: Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SESSION_SECRET=${SESSION_SECRET}
      - EXPO_PUBLIC_DOMAIN=${EXPO_PUBLIC_DOMAIN}
      - NODE_ENV=production
    restart: always
    networks:
      - workforce-network
  
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - app
    networks:
      - workforce-network

networks:
  workforce-network:
    driver: bridge
```

### Step 4: Connect to VPS

```bash
ssh root@your-vps-ip
```

### Step 5: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker root
```

### Step 6: Deploy Application

```bash
# Clone repository
git clone https://github.com/yourusername/workforce-manager.git
cd workforce-manager

# Create .env file
nano .env
# Add your environment variables

# Start containers
docker-compose up -d

# View logs
docker-compose logs -f app
```

### Step 7: Setup SSL

```bash
# Install Certbot
sudo apt install -y certbot

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Update nginx.conf to use SSL
# Copy certs to ./certs/

# Restart containers
docker-compose restart nginx
```

### Cost (DigitalOcean)

| Component | Cost |
|-----------|------|
| 1GB VPS | $5/month |
| Domain | $10/year |
| SSL (Let's Encrypt) | Free |
| **Total** | **$5-10/month** |

---

## COMPARISON: Setup Time & Complexity

| Platform | Setup Time | Complexity | Cost |
|----------|-----------|-----------|------|
| **Vercel** | 5 minutes | ⭐ Easy | $0-20 |
| **Railway** | 10 minutes | ⭐⭐ Easy-Medium | $5-25 |
| **AWS** | 30 minutes | ⭐⭐⭐ Medium | $25-50 |
| **Docker VPS** | 20 minutes | ⭐⭐⭐ Medium | $5-10 |

---

## Recommendation

**Start with Vercel** - Simplest setup, best for your tech stack, free tier covers initial needs.

When you need more control or have scaling requirements, move to AWS or Docker.

**Ready to deploy?** Pick one and follow the guide above! 🚀
