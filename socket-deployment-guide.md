# Socket Server Deployment Guide

## The Problem
Vercel (and most serverless platforms) don't support persistent WebSocket connections. Your socket server needs to run on a platform that supports persistent connections.

## Solution 1: Deploy Socket Server Separately (Recommended)

### Option A: Railway (Easiest)
1. Go to [Railway.app](https://railway.app)
2. Create a new project
3. Connect your GitHub repo
4. Select `server.js` as the entry point
5. Set these environment variables:
   ```
   JWT_SECRET=your_jwt_secret
   DB_HOST=your_database_host
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_NAME=your_database_name
   PORT=3001
   NEXT_PUBLIC_ALLOWED_ORIGIN=https://your-frontend-domain.vercel.app
   ```
6. Deploy and get the URL (e.g., `https://your-socket-server.railway.app`)

### Option B: Render
1. Go to [Render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repo
4. Set build command: `npm install`
5. Set start command: `npm run start:socket`
6. Set environment variables (same as above)

### Option C: Heroku
1. Install Heroku CLI
2. Create a new app: `heroku create your-socket-app`
3. Set environment variables: `heroku config:set JWT_SECRET=your_secret`
4. Deploy: `git push heroku main`

## Solution 2: Use Vercel with Server-Sent Events (Alternative)

If you want to keep everything on Vercel, you can replace WebSockets with Server-Sent Events, but this is more complex and less real-time.

## Configuration

After deploying your socket server separately:

1. **Set environment variable in your Next.js app (Vercel):**
   ```
   NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.railway.app
   ```

2. **Update your frontend** (already done in SocketContext.jsx)

3. **Test the connection** by checking browser console for socket connection logs

## Quick Fix for Testing

For immediate testing, you can run both servers locally:
```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start Socket Server
npm run socket
```

Then visit `http://localhost:3000` and check if socket connects.
