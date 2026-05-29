# Hospital Management System - Vercel Deployment Guide

## Prerequisites
- MongoDB Atlas account with connection string
- Vercel account
- GitHub repository with the code (already pushed)

## Quick Start Deployment

### Step 1: Prepare Your MongoDB Connection
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Connect" on your cluster
3. Select "Connect your application"
4. Copy the connection string and save it (format: `mongodb+srv://user:password@cluster.mongodb.net/database`)

### Step 2: Deploy to Vercel
**Option A: Using GitHub (Recommended)**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Select your GitHub repository with hospital-management-system
4. Vercel will auto-detect the configuration from `vercel.json`
5. Click "Deploy"

**Option B: Using Vercel CLI**
```bash
npm install -g vercel
cd hospital-management-system
vercel --prod
```

### Step 3: Configure Environment Variables in Vercel
After deployment starts, set these environment variables in Vercel Dashboard:

1. Go to your Vercel Project Settings
2. Navigate to "Environment Variables"
3. Add these variables:

```
MONGO_URI = mongodb+srv://username:password@cluster.mongodb.net/hospital-db
JWT_SECRET = your-secret-key-here (generate a random string)
NODE_ENV = production
```

**⚠️ Important:** 
- Replace `MONGO_URI` with your actual MongoDB connection string
- Make sure to replace `<password>` in the connection string with your actual MongoDB password
- Generate a strong `JWT_SECRET` (e.g., using `openssl rand -hex 32`)

### Step 4: Configure MongoDB IP Whitelist
Your MongoDB Atlas must allow Vercel servers to connect:

1. Go to MongoDB Atlas Console
2. Navigate to "Network Access" → "IP Whitelist"
3. Click "Add IP Address"
4. Enter `0.0.0.0/0` for initial testing (allows all IPs)
5. For production, replace with Vercel's IP ranges (ask Vercel support)

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Vercel Serverless               │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────┐                   │
│  │  Static Files   │                   │
│  │  (React SPA)    │                   │
│  │  hospital-      │                   │
│  │  frontend/dist  │                   │
│  └─────────────────┘                   │
│           ↓                             │
│  ┌─────────────────┐                   │
│  │ /api/* Requests │                   │
│  │  Routed to →    │                   │
│  │  api/index.js   │                   │
│  │  (Express App)  │                   │
│  └─────────────────┘                   │
│           ↓                             │
│  ┌─────────────────┐                   │
│  │  MongoDB Atlas  │ (External DB)     │
│  └─────────────────┘                   │
│                                         │
└─────────────────────────────────────────┘
```

## What Gets Deployed

### Frontend
- **Source**: `hospital-frontend/src/`
- **Build**: `npm run build` → Vite builds to `hospital-frontend/dist/`
- **Served**: Static files from `/`
- **Routing**: React Router SPA with index.html fallback

### Backend
- **Source**: `hospital-backend/`
- **Handler**: `api/index.js` (exports Express app)
- **Routes**: `/api/v1/*` endpoints
- **Runtime**: Node.js 18.x serverless functions
- **Database**: MongoDB Atlas (external)

## Build Process on Vercel

Vercel automatically:
1. Runs `npm run build:frontend` to build React frontend
2. Runs `npm run build:backend` to install backend dependencies
3. Builds the `api/index.js` serverless function
4. Deploys both together

## API Endpoints After Deployment

### Development
```
Frontend: http://localhost:5173
Backend:  http://localhost:5000/api/v1
```

### Production (Vercel)
```
Frontend: https://your-project.vercel.app
Backend:  https://your-project.vercel.app/api/v1
```

The frontend automatically uses relative URLs, so no code changes needed!

## Troubleshooting

### "Cannot find module" error
- Check that dependencies are listed in both:
  - `/hospital-backend/package.json`
  - `/package.json` (root)

### MongoDB Connection Fails
1. Verify `MONGO_URI` environment variable is set correctly
2. Check MongoDB IP Whitelist includes Vercel IPs
3. Test connection string locally first

### API Returns 404
- Verify `vercel.json` is in the root directory
- Check that `api/index.js` properly exports the Express app
- Ensure all routes start with `/api/v1`

### Frontend Shows Blank Page
- Check browser console for errors
- Verify `hospital-frontend/dist` exists (built successfully)
- Ensure `vercel.json` rewrite rules are correct

### Cold Start Timeout
- API calls timeout on first request (cold start)
- Database connection takes 5-10 seconds initially
- This is normal; subsequent requests are faster

## File Structure for Deployment

```
hospital-management-system/
├── api/
│   └── index.js                    # ← Vercel serverless handler
├── hospital-backend/
│   ├── server.js                   # ← Express app
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── package.json                # ← Backend dependencies
├── hospital-frontend/
│   ├── src/
│   ├── dist/                       # ← Built frontend (generated)
│   ├── package.json                # ← Frontend dependencies
│   └── vite.config.js
├── package.json                    # ← Root package.json (added)
├── vercel.json                     # ← Vercel config
├── .vercelignore                   # ← Files to ignore
└── .env.example                    # ← Environment template
```

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Create Vercel project from GitHub
3. ✅ Set environment variables in Vercel dashboard
4. ✅ Configure MongoDB IP whitelist
5. ✅ Deploy!

Your Hospital Management System should now be live on Vercel! 🎉

