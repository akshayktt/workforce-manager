# Workforce Manager - Deployment & Sharing Guide

## Overview
This is a full-stack application with:
- **Frontend**: Expo/React Native (runs on web/mobile)
- **Backend**: Node.js Express server on port 5000
- **Database**: PostgreSQL (Neon serverless)

For sharing with another person, **both the server and Expo app need to run**. The app won't work without the backend server.

---

## 📋 Prerequisites for Both Users

### System Requirements
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** - comes with Node.js
- **PostgreSQL Database URL** - Get this from your database provider (Neon)

### Environment Variables
Create a `.env` file in the project root:
```bash
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your-secret-key-here
NODE_ENV=development
```

---

## 🚀 Step-by-Step Setup

### Step 1: Install Dependencies
Both users should run:
```bash
npm install
```

### Step 2: Create `.env.local` (Frontend Configuration)
The frontend needs to know where the backend is running.

**For Local Testing (Same Machine):**
```bash
# .env.local file
EXPO_PUBLIC_DOMAIN=localhost:5000
```

**For Sharing Over Network (Different Machines):**
```bash
# .env.local file
EXPO_PUBLIC_DOMAIN=YOUR_IP_ADDRESS:5000
```

Replace `YOUR_IP_ADDRESS` with the server machine's IP address (e.g., `192.168.1.100:5000`)

To find your IP address:
- **Windows**: Open Command Prompt and run `ipconfig` → Look for "IPv4 Address"
- **Mac/Linux**: Run `ifconfig` or `hostname -I`

---

## 🔧 Running the Application

### **Terminal 1: Start the Backend Server**
```bash
npm run server:dev
```

Output should show:
```
✅ Server running on http://0.0.0.0:5000
✅ Database connected
```

**Important**: Keep this terminal open. The server must run 24/7 while using the app.

---

### **Terminal 2: Start the Expo App**

**Option A: On Same Machine**
```bash
npm start
```
Then press `w` to open in browser (or `i` for iOS simulator, `a` for Android emulator)

**Option B: On Different Machine**
```bash
npm start
```
Then press `w` to open in browser using the other person's machine.

The Expo dev server will show a QR code. The other person can scan it with their phone using Expo Go app.

---

## 🌐 Network Sharing Scenarios

### **Scenario 1: Same Computer, Local Development**
```
User: Megha
Machine: Windows PC
Server: npm run server:dev → localhost:5000
App: npm start → localhost:3000 (browser)
.env.local: EXPO_PUBLIC_DOMAIN=localhost:5000
```

### **Scenario 2: Two Computers on Same Network**
```
Server Machine (Megha's PC):
  → Run: npm run server:dev
  → Server IP: 192.168.1.100:5000
  → Keep this running

Client Machine (Other Person):
  → Create .env.local: EXPO_PUBLIC_DOMAIN=192.168.1.100:5000
  → Run: npm install
  → Run: npm start
  → Open app in browser or phone
```

### **Scenario 3: Different Networks (Remote Access)**
For accessing from a different network, you need:
1. **Port Forwarding** on server machine's router
2. **Cloud/VPN Solution** (recommended: use Ngrok for tunneling)

**Using Ngrok (Simple):**
```bash
# Install Ngrok: https://ngrok.com/
ngrok http 5000

# This gives you a public URL like: https://abc123.ngrok.io
# Update .env.local: EXPO_PUBLIC_DOMAIN=abc123.ngrok.io
```

---

## 📱 Sharing with Another Person

### **Quick Start Guide for Other User:**

1. **Get the code:**
   ```bash
   # Clone or copy the project folder
   cd Workforce-Manager
   npm install
   ```

2. **Create `.env` file** with database credentials:
   ```bash
   DATABASE_URL=postgresql://...
   SESSION_SECRET=your-secret
   NODE_ENV=development
   ```

3. **Create `.env.local` file** with server address:
   ```bash
   EXPO_PUBLIC_DOMAIN=MEGHA_IP:5000
   # Ask Megha for her IP address
   ```

4. **Run the app:**
   ```bash
   # Megha runs this first (Terminal 1):
   npm run server:dev

   # Other user runs this (Terminal 2):
   npm start
   # Then press 'w' to open in browser
   ```

---

## ⚠️ Common Issues & Fixes

### Issue 1: "Failed to fetch" / CORS Error
**Cause**: `.env.local` has wrong IP/port
**Fix**: 
- Make sure server is running on port 5000
- Check IP address is correct: `ping YOUR_IP_ADDRESS`
- Update `.env.local` with correct address
- Restart both server and Expo

### Issue 2: "Cannot connect to database"
**Cause**: `DATABASE_URL` in `.env` is wrong
**Fix**:
- Verify database URL from Neon
- Check database is online
- Verify credentials are correct
- Restart server

### Issue 3: "Port 5000 already in use"
**Cause**: Another process is using port 5000
**Fix**:
```bash
# Windows: Kill the process
taskkill /F /IM node.exe

# Mac/Linux: Kill the process
lsof -ti:5000 | xargs kill -9
```

### Issue 4: App shows blank screen
**Cause**: Server not running or network unreachable
**Fix**:
- Verify server is running: `npm run server:dev`
- Check if IP/port in `.env.local` is correct
- Try refreshing the browser: Ctrl+R (or Cmd+R on Mac)

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│           SHARED DATABASE (Neon PostgreSQL)         │
│        (Both server and users access this)          │
└─────────────────────────────────────────────────────┘
                    ▲        ▲
                    │        │
        ┌───────────┘        └───────────┐
        │                                 │
┌───────▼──────────────┐     ┌──────────▼────────────┐
│   SERVER (Node.js)   │     │   EXPO APP (Browser)  │
│   Port: 5000         │────▶│   Port: 8081/3000     │
│ npm run server:dev   │     │   npm start           │
│                      │     │                       │
│ Must be running ✅   │     │ Connects via         │
└──────────────────────┘     │ EXPO_PUBLIC_DOMAIN   │
                             └──────────────────────┘
```

---

## ✅ Checklist for Sharing

- [ ] `.env` file created with `DATABASE_URL` and `SESSION_SECRET`
- [ ] `.env.local` file created with `EXPO_PUBLIC_DOMAIN`
- [ ] `npm install` completed
- [ ] Server can start: `npm run server:dev` ✅
- [ ] Expo can start: `npm start` ✅
- [ ] App can connect to server (no CORS errors)
- [ ] Login works with test credentials
- [ ] Can create labor requests and approve them

---

## 🔐 Security Notes

1. **Never commit `.env` files to git** - These contain secrets!
2. **Use strong `SESSION_SECRET`** for production
3. **For remote access, use HTTPS** (Ngrok does this automatically)
4. **Change database password** if sharing the project code
5. **Use different `DATABASE_URL` per environment** (dev/prod)

---

## 📞 Troubleshooting Quick Links

- **Server won't start**: Check if port 5000 is available
- **CORS errors**: Verify `.env.local` EXPO_PUBLIC_DOMAIN
- **Database errors**: Check `DATABASE_URL` in `.env`
- **App is slow**: Check network latency between machines

---

## 📝 Example Configuration Files

### `.env` (Backend)
```
DATABASE_URL=postgresql://user:password@neon.tech/dbname
SESSION_SECRET=your-very-secure-secret-key-min-32-chars
NODE_ENV=development
```

### `.env.local` (Frontend - Local)
```
EXPO_PUBLIC_DOMAIN=localhost:5000
```

### `.env.local` (Frontend - Network)
```
EXPO_PUBLIC_DOMAIN=192.168.1.100:5000
```

---

## 🎯 Commands Reference

```bash
# Install dependencies
npm install

# Development
npm run server:dev        # Start backend server (Terminal 1)
npm start                 # Start Expo app (Terminal 2)

# Production build
npm run server:build      # Build server
npm run server:prod       # Run production server
npm run expo:start:static:build  # Build static Expo app

# Database
npm run db:push          # Update database schema
```

---

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Neon](https://neon.tech/)
- [Ngrok Tunneling](https://ngrok.com/)

---

**Last Updated**: February 8, 2026
**For**: Workforce Manager Application
