# Hospital Management System - Vercel Deployment Guide

## Prerequisites
- MongoDB Atlas account with connection string
- Vercel account
- GitHub repository with the code (already pushed)

## Deployment Steps

### 1. Set Environment Variables in Vercel

Go to your Vercel project settings and add these environment variables:

```
MONGO_URI=your_mongodb_atlas_connection_string
NODE_ENV=production
JWT_SECRET=your_jwt_secret_key
```

**Finding your MongoDB URI:**
1. Go to MongoDB Atlas console
2. Click "Connect" on your cluster
3. Select "Connect your application"
4. Copy the connection string and replace `<password>` with your password

### 2. Deploy to Vercel

**Option A: Using Vercel CLI**
```bash
npm install -g vercel
vercel
```

**Option B: Using GitHub**
1. Connect your GitHub repository to Vercel
2. Vercel will auto-detect the configuration
3. Set environment variables in Vercel dashboard
4. Deploy

### 3. How It Works

- **Frontend**: Built with Vite and served from `hospital-frontend/dist`
- **Backend**: Express API running as Vercel serverless functions
- **API Routes**: All `/api/*` requests are routed to the backend handler
- **Rewrites**: All other routes serve `index.html` for React Router SPA

### 4. API Endpoints

All API calls use relative URLs when deployed:
- Development: `http://localhost:5000/api/v1`
- Production (Vercel): `https://your-domain.vercel.app/api/v1`

### 5. Troubleshooting

**404 Error:**
- Make sure `vercel.json` is in the root directory
- Check that environment variables are set in Vercel dashboard
- Verify MongoDB URI is correct

**CORS Issues:**
- Backend already has CORS enabled
- Check that your frontend domain is accessible

**Database Connection:**
- MongoDB must be accessible from Vercel (check IP whitelist in MongoDB Atlas)
- Add `0.0.0.0/0` to IP Whitelist for initial testing (less secure, more permissive)

### 6. Performance Notes

- Vercel serverless functions have a default 10-second timeout (set to 30s in config)
- Database connections may take time on first cold start
- Consider using connection pooling for production

### 7. File Structure

```
hospital-management-system/
├── api/
│   └── index.js                 # Serverless function handler
├── hospital-backend/
│   ├── server.js
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── package.json
├── hospital-frontend/
│   ├── src/
│   ├── dist/                    # Built frontend (generated on deploy)
│   ├── package.json
│   └── vite.config.js
├── vercel.json                  # Vercel configuration
├── .vercelignore               # Files to ignore during deployment
└── .env.example               # Environment variable template
```
