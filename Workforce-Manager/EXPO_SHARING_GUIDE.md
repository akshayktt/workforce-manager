# Expo Publishing & QR Code Sharing Guide

## Overview
Publishing to Expo allows anyone with the Expo Go app to scan a QR code and access your app without needing to clone the repository or set up development tools.

---

## 📋 Prerequisites

1. **Expo Account** - Create one at [https://expo.dev](https://expo.dev)
2. **Expo CLI installed** - Should already be installed via npm
3. **Logged into Expo CLI** - Run: `npx expo login`
4. **Server Running** - Backend must be accessible

---

## 🚀 Step 1: Update Configuration Files

### Update `app.json` (Expo Configuration)
The app.json file tells Expo how to build your app.

**Check your current app.json:**
```json
{
  "expo": {
    "name": "Workforce Manager",
    "slug": "workforce-manager",
    "version": "1.0.0",
    "scheme": "your-app-scheme",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "plugins": [
      "expo-router"
    ],
    "platforms": [
      "ios",
      "android",
      "web"
    ]
  }
}
```

### Make sure `.env.local` is Updated
```bash
# For local testing (same machine):
EXPO_PUBLIC_DOMAIN=localhost:5000

# For sharing with others (use your IP):
EXPO_PUBLIC_DOMAIN=YOUR_IP_ADDRESS:5000
```

---

## 🔑 Step 2: Log Into Expo

```bash
npx expo login
```

You'll be prompted to enter:
- Email address
- Password

If successful, you'll see:
```
✅ Logged in as: your-email@example.com
```

### Verify Login Status
```bash
npx expo whoami
```

---

## 🎯 Step 3: Build & Publish the Preview

### Option A: Quick Preview (Development Build - Recommended for Sharing)

This creates a QR code people can scan immediately:

```bash
npx expo start
```

Then in the terminal, you'll see:
```
› Metro waiting on exp://192.168.x.x:19000
› Scan the QR code above with Expo Go (iOS) or Expo Go (Android) to open your project
```

**The QR Code will appear in the terminal!** 📱

### Option B: EAS Build (Standalone App - Production)

For a more stable, production-ready build:

```bash
# First, install EAS CLI
npm install -g eas-cli

# Login to EAS
eas login

# Build for platforms
eas build --platform ios
eas build --platform android
eas build --platform web
```

This creates actual app files that can be distributed.

---

## 📱 Step 4: Share the QR Code

### Quick Share Method (Option A - Recommended):

1. **Start the dev server:**
   ```bash
   npm run server:dev          # Terminal 1 - Keep running
   npm start                   # Terminal 2
   ```

2. **QR Code appears in terminal** - Take a screenshot of it

3. **Share the QR Code:**
   - Email the screenshot
   - Post on Slack/Teams
   - Message on WhatsApp
   - Share on Discord

### Share with Link Method (Option B):

```bash
npx expo start

# Terminal shows something like:
# exp://192.168.1.100:19000
```

Share that link with others, they can:
- Paste it in Expo Go app
- Or scan the QR code

---

## 📲 For the Other Person to Access Your App

### They Need:
1. **Expo Go App** - Download from:
   - iOS: [App Store](https://apps.apple.com/us/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Same Network** - Must be on the same WiFi network as your computer

3. **QR Code** - From you

### Steps to Open App:
1. Install Expo Go app
2. Open Expo Go
3. Scan QR code with camera
4. App opens automatically!

---

## 🌐 For Remote Access (Different Networks)

If they're on a different network, use **Ngrok**:

### Step 1: Install Ngrok
Download from [https://ngrok.com/download](https://ngrok.com/download)

### Step 2: Expose Your Expo Server
```bash
# First, start your Expo app normally
npm start

# In another terminal:
ngrok http 19000
```

Ngrok output:
```
Forwarding     https://abc123xyz.ngrok.io -> http://localhost:19000
```

### Step 3: Share the URL
Send them: `exp://abc123xyz.ngrok.io`

They can paste this in Expo Go app or generate QR code at [qr-server.com](https://qr-server.com/)

---

## 📊 Method Comparison

| Method | Setup Time | Best For | Network |
|--------|-----------|----------|---------|
| **QR Code (Local)** | 1 min | Testing with team | Same WiFi |
| **Ngrok Link** | 5 min | Remote testing | Any network |
| **EAS Build** | 15 min | Production release | Any network |

---

## 🔧 Complete Step-by-Step (From Start)

### Terminal 1 - Start Backend Server:
```bash
cd C:\Users\Megha\OneDrive\Desktop\Workforce-manager\Workforce-Manager
npm run server:dev
```

Wait for:
```
✅ Server running on http://0.0.0.0:5000
✅ Database connected
```

### Terminal 2 - Start Expo Dev Server:
```bash
npm start
```

Wait for QR code to appear:
```
› Metro waiting on exp://192.168.x.x:19000
› Scan the QR code above with Expo Go (iOS) or Expo Go (Android) to open your project
```

### Terminal 3 - (Optional) For Remote Access with Ngrok:
```bash
ngrok http 19000
```

---

## 📝 Share This with Others

**Message Template:**

```
Hey! 👋

I'm sharing my Workforce Manager app via Expo!

📲 To access:
1. Download "Expo Go" app from your phone's app store
2. Scan this QR code with your camera:
   [INSERT QR CODE IMAGE]

Or paste this link in Expo Go:
exp://YOUR_IP:19000

The app will open automatically! 🎉

Note: You need to be on the same WiFi network for this to work.
```

---

## ⚠️ Important Notes

### Network Issues?
1. **Both devices must be on same network** (if not using Ngrok)
2. **Firewall might block connections** - Allow port 19000 in Windows Firewall
3. **Get your correct IP address:**
   ```bash
   ipconfig
   # Look for "IPv4 Address" (e.g., 192.168.1.100)
   ```

### Server Must Keep Running
- Keep Terminal 1 (server) running while others use the app
- App won't work without the backend

### Troubleshooting QR Code Not Scanning?

1. **Make sure Expo Go is open**
2. **Good lighting on QR code**
3. **Both devices on same WiFi**
4. **Try typing the exp:// link manually in Expo Go**

---

## 🎯 Publish to Expo Platform (Permanent Link)

For a permanent link that doesn't expire:

```bash
eas build --platform all
```

This creates:
- Standalone iOS app
- Standalone Android app
- Web link

Once built, you can share the link forever!

---

## 📊 Your Current Setup

Based on your project:

- **Frontend**: Expo/React Native
- **Backend**: Node.js on port 5000
- **Database**: PostgreSQL (Neon)
- **Sharing Method**: QR Code via Expo Go

**To share now:**
1. ✅ Make sure `.env.local` has your IP: `EXPO_PUBLIC_DOMAIN=YOUR_IP:5000`
2. ✅ Run `npm run server:dev` (Terminal 1)
3. ✅ Run `npm start` (Terminal 2)
4. ✅ Screenshot the QR code
5. ✅ Send to others
6. ✅ They open Expo Go and scan

---

## 🔐 Security Notes

1. **QR codes are temporary** - Only valid while your dev server is running
2. **Anyone on your network can access** - It's development mode, not protected
3. **For production**, use EAS Build with proper security
4. **Don't expose sensitive data** in dev mode

---

## 📚 Quick Reference Commands

```bash
# Check if logged in
npx expo whoami

# Start dev server with QR code
npm start

# See actual IP address
ipconfig

# For remote access
ngrok http 19000

# Build for production
eas build --platform all

# Clean rebuild
npx expo start --clear
```

---

## 🎬 Next Steps

1. Update `.env.local` with your IP address
2. Start backend server: `npm run server:dev`
3. Start Expo: `npm start`
4. Screenshot QR code
5. Share screenshot with team
6. They install Expo Go and scan
7. App opens! 🎉

---

**Questions? Common Issues Below:**

### Q: "Cannot connect to server"
A: Make sure backend is running and `.env.local` has correct IP

### Q: "QR code not working"
A: Check both devices on same WiFi, app might be cached

### Q: "Expo Go not opening the link"
A: Try typing `exp://YOUR_IP:19000` manually in Expo Go search

### Q: "Different network access needed"
A: Use Ngrok: `ngrok http 19000` and share the exp:// link

---

**Created**: February 8, 2026
**For**: Workforce Manager Expo Sharing
