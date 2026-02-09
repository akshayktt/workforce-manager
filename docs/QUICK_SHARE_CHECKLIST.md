# 🚀 Quick Start Checklist - Share Your App Now!

## ⏱️ Takes 2 Minutes!

### Step 1: Find Your IP Address
```powershell
ipconfig
```
Look for **IPv4 Address** (e.g., `192.168.1.100`)

### Step 2: Update `.env.local`
Edit `.env.local` file and replace with:
```
EXPO_PUBLIC_DOMAIN=YOUR_IP_ADDRESS:5000
```

Example:
```
EXPO_PUBLIC_DOMAIN=192.168.1.100:5000
```

### Step 3: Open Two Terminals

**Terminal 1 - Backend Server:**
```bash
npm run server:dev
```

Wait for:
```
✅ Server running on http://0.0.0.0:5000
```

**Terminal 2 - Expo Dev Server:**
```bash
npm start
```

Wait for QR code to appear in terminal.

### Step 4: Share QR Code
1. Screenshot the QR code from Terminal 2
2. Send screenshot to others
3. They scan with Expo Go app
4. App opens! 🎉

---

## 📱 What Others Need to Do

1. **Download Expo Go:**
   - iPhone: Search "Expo Go" on App Store
   - Android: Search "Expo Go" on Google Play

2. **Open Expo Go**

3. **Scan QR code** (or type `exp://YOUR_IP:19000` in Expo Go search)

4. **App loads automatically** ✅

---

## 🌐 For Remote Access (Different Networks)

If they're not on your WiFi, use Ngrok:

### Step 1: Install Ngrok
Download from: https://ngrok.com/download

### Step 2: Run Ngrok
```bash
ngrok http 19000
```

### Step 3: Share Link
Share the link it shows (e.g., `exp://abc123xyz.ngrok.io`)

They paste it in Expo Go → App opens!

---

## ✅ Troubleshooting

| Problem | Solution |
|---------|----------|
| QR code won't scan | Make sure Expo Go is open, good lighting |
| "Cannot connect to server" | Check backend running, correct IP in `.env.local` |
| Different network | Use Ngrok: `ngrok http 19000` |
| App is slow/not loading | Backend server might not be running |

---

## 💡 Pro Tips

- Keep both terminals running while others use the app
- The QR code is only valid while your dev server is running
- For production, use EAS Build: `eas build --platform all`
- Always test locally first before sharing

---

**Ready? Start with Terminal 1! 🎬**
