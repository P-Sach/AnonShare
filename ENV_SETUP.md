# Environment Variables Setup Guide

This document explains the environment variables required for the AnonShare application.

## 📁 Files Created

### Backend Environment File
- **Location**: `backend/.env.local`
- **Purpose**: Backend server configuration

### Frontend Environment File
- **Location**: `.env` (root directory)
- **Purpose**: Frontend (Vite/React) configuration

### Example Files
- `backend/.env.example` - Template for backend environment variables
- `.env.example` - Template for frontend environment variables

---

## 🔑 Required Environment Variables

### Backend (`backend/.env.local`)

#### 1. **PORT** (Optional)
- **Description**: The port number on which the backend server will run
- **Default**: `3000`
- **Example**: `PORT=3000`

#### 2. **MONGO_URI** (Required)
- **Description**: MongoDB connection string
- **Format**: `mongodb://[username:password@]host[:port]/database`
- **Examples**:
  - Local: `mongodb://localhost:27017/anonshare`
  - MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/anonshare`
- **Setup Instructions**:
  - **Local MongoDB**: Install MongoDB locally or use Docker
  - **MongoDB Atlas**: 
    1. Create a free account at https://www.mongodb.com/cloud/atlas
    2. Create a cluster
    3. Get your connection string from the "Connect" button
    4. Replace `<username>`, `<password>`, and `<dbname>` with your credentials

#### 3. **REDIS_URL** (Required)
- **Description**: Redis connection string for session management and caching
- **Format**: `redis://[username:password@]host[:port]/[database]`
- **Examples**:
  - Local: `redis://localhost:6379`
  - Redis Cloud: `redis://username:password@your-redis-cloud.com:6379`
- **Setup Instructions**:
  - **Local Redis**: 
    - Windows: Download from https://redis.io/download or use WSL
    - Mac: `brew install redis && brew services start redis`
    - Linux: `sudo apt-get install redis-server`
  - **Redis Cloud**: 
    1. Create a free account at https://redis.com/try-free/
    2. Create a database
    3. Get your connection string from the database configuration

---

### Frontend (`.env`)

#### 1. **VITE_API_BASE** (Optional)
- **Description**: The base URL for the backend API
- **Default**: `http://localhost:3000`
- **Example**: `VITE_API_BASE=http://localhost:3000`
- **Production**: Update this to your deployed backend URL (e.g., `https://api.yourapp.com`)

---

## 🚀 Quick Start

### 1. Copy Example Files
```bash
# Backend
cd backend
cp .env.example .env.local

# Frontend (from root)
cd ..
cp .env.example .env
```

### 2. Update Values
Edit the files with your actual configuration values:
- Update MongoDB connection string
- Update Redis connection string
- Update API base URL if deploying

### 3. Install Dependencies
```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

### 4. Start Services
Make sure MongoDB and Redis are running, then:
```bash
# Backend (from backend directory)
npm start

# Frontend (from root directory)
npm run dev
```

---

## 🔒 Security Notes

- ✅ `.env.local` and `.env` files are already in `.gitignore`
- ❌ Never commit files containing real credentials to version control
- 🔄 Use `.env.example` files to share required variable names (without values)
- 🔐 For production, use secure environment variable management (e.g., cloud provider secrets)

---

## 🐳 Docker Setup (Optional)

If you want to use Docker for MongoDB and Redis:

```bash
# MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Redis
docker run -d -p 6379:6379 --name redis redis:latest
```

Then use these connection strings:
```
MONGO_URI=mongodb://localhost:27017/anonshare
REDIS_URL=redis://localhost:6379
```

---

## 🆘 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongosh` or `mongo` command should connect
- Check if the database name exists or will be created automatically
- Verify firewall settings aren't blocking port 27017

### Redis Connection Issues
- Ensure Redis is running: `redis-cli ping` should return `PONG`
- Check if port 6379 is available
- Verify firewall settings aren't blocking port 6379

### Frontend Can't Connect to Backend
- Ensure `VITE_API_BASE` matches your backend URL and port
- Check CORS settings in `backend/server.js`
- Verify the backend server is running

---

## 📝 Notes

- All `VITE_*` prefixed variables are exposed to the frontend client code
- Backend uses `dotenv` to load variables from `.env.local`
- Restart the development server after changing environment variables
