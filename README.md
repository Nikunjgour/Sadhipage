# 💒 ShaadiPage - AI-Powered Royal Wedding Platform

ShaadiPage ek modern, full-stack platform hai jo couples ko AI-generated, responsive aur luxurious digital wedding websites banane ki suvidha deta hai. Guests custom shareable link ke zariye couple ki prem kahani, photos aur event details dekh sakte hain.

---

## 🏗️ Project Architecture & Tech Stack

```
c:/sadhipage/
├── backend/                  # Node.js + Express REST API Server
│   ├── .env.example          # Environment variables template with Hinglish docs
│   ├── .gitignore            # Git ignore rule for secrets
│   ├── package.json
│   └── server/
│       ├── config/           # MongoDB Atlas connection (Mongoose)
│       ├── controllers/      # Auth, Wedding CRUD, Admin & Gemini AI
│       ├── middleware/       # JWT Protect, Admin guard, Multer upload
│       ├── models/           # User & Wedding schemas
│       ├── routes/           # REST endpoints
│       └── server.js         # Express app entry point & CORS
│
└── fronted/                  # React 19 + Vite Frontend SPA
    ├── .env.example          # Frontend environment variables template
    ├── .gitignore            # Git ignore rule for secrets
    ├── package.json
    ├── vite.config.js        # Vite + Tailwind v4 config
    └── src/
        ├── api/api.js        # Centralized Axios client with JWT interceptor
        ├── context/          # AuthContext & ToastContext
        ├── components/       # Reusable UI (Navbar, Sidebar, Modal, etc.)
        └── pages/
            ├── public/       # Landing, Login, Register, Public Wedding, 404
            ├── user/         # Dashboard, Details Form, AI Generate, Preview
            └── admin/        # Admin Analytics, Users, Weddings Directory
```

### 💻 Technologies Used
- **Backend:** Node.js (ES Modules), Express.js v4.21, MongoDB Atlas + Mongoose, JSON Web Token (JWT), bcryptjs, Cloudinary v2, Google Gemini AI SDK (`gemini-3.8-flash`), Multer, CORS.
- **Frontend:** React 19, Vite v8, Tailwind CSS v4, TanStack Query v5 (`@tanstack/react-query`), Axios, React Router DOM v7.

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js version 18 ya higher (`node -v`)
- npm version 9 ya higher (`npm -v`)
- Free MongoDB Atlas Cluster
- Free Cloudinary Account
- Google Gemini API Key

---

### Step 1: Backend Setup
1. Backend directory me jayein:
   ```bash
   cd backend
   ```
2. Dependencies install karein:
   ```bash
   npm install
   ```
3. `.env` file create karein (`.env.example` se copy karein):
   ```bash
   cp .env.example .env
   ```
4. Apne credentials fill karein (MongoDB URI, Cloudinary, Gemini Key).
5. Backend server start karein:
   ```bash
   npm run dev
   # Ya:
   node server/server.js
   ```
   Server `http://localhost:8080` par run hoga.

---

### Step 2: Frontend Setup
1. Naye terminal me frontend folder me jayein:
   ```bash
   cd fronted
   ```
2. Dependencies install karein:
   ```bash
   npm install
   ```
3. `.env` file create karein (`.env.example` se copy karein):
   ```bash
   cp .env.example .env
   ```
   Verify karein ki `VITE_API_URL=http://localhost:8080/api` set hai.
4. Frontend development server start karein:
   ```bash
   npm run dev
   ```
   Frontend `http://localhost:5173` par launch hoga.

---

## 🔑 Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Sample Value | Kahan se milega? (Source) |
|---|---|---|
| `PORT` | `8080` | Local machine port ya Render dwara auto-assigned |
| `NODE_ENV` | `development` | `development` (local) ya `production` (deploy) |
| `CLIENT_URL` | `http://localhost:5173,http://localhost:8080` | Frontend allowed URLs (comma-separated) CORS ke liye |
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/shaadipage-db` | **MongoDB Atlas**: Cluster -> Connect -> Drivers -> Connection String |
| `JWT_SECRET` | `your_super_secret_jwt_key_here` | 32+ character random string token hashing ke liye |
| `CLOUDINARY_CLOUD_NAME` | `my_cloud_name` | **Cloudinary**: Dashboard -> Cloud Name |
| `CLOUDINARY_API_KEY` | `123456789012345` | **Cloudinary**: Dashboard -> API Key |
| `CLOUDINARY_API_SECRET` | `abcdefgh12345678` | **Cloudinary**: Dashboard -> API Secret |
| `GEMINI_API_KEY` | `AIzaSy...` | **Google AI Studio**: aistudio.google.com -> Get API Key |

### Frontend (`fronted/.env`)

| Variable | Sample Value | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080/api` | Backend API ka base URL (`/api` prefix ke sath) |

---

## 🌐 Free Deployment Guide

### 1. Database Deployment (MongoDB Atlas - 100% Free)
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) par login karein.
2. Free **M0 Sandbox** cluster create karein.
3. **Database Access:** Ek database user banayein with Read/Write permissions.
4. **Network Access:** IP Access List me `0.0.0.0/0` (Allow access from anywhere) add karein taaki Render backend connect ho sake.
5. Cluster ke 'Connect' button par click karke standard connection URI copy karein.

---

### 2. Backend Deployment (Render.com - 100% Free)
1. Code ko GitHub par push karein.
2. [Render.com](https://render.com) par free account banayein aur **New Web Service** select karein.
3. Apna GitHub repository connect karein.
4. Service settings fill karein:
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server/server.js`
   - **Plan:** Free
5. **Environment Variables** tab me saare backend `.env` variables add karein:
   - `PORT`: `8080` (ya default 10000)
   - `NODE_ENV`: `production`
   - `MONGO_URI`: Atlas connection string
   - `JWT_SECRET`: Secret key
   - `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
   - `CLOUDINARY_API_KEY`: Cloudinary API key
   - `CLOUDINARY_API_SECRET`: Cloudinary API secret
   - `GEMINI_API_KEY`: Google Gemini API key
   - `CLIENT_URL`: `https://your-shaadipage.vercel.app` (Vercel URL banane ke baad)
6. **Deploy Web Service** click karein.
7. Render aapko ek public URL dega: `https://shaadipage-backend.onrender.com`.

---

### 3. Frontend Deployment (Vercel - 100% Free)
1. [Vercel.com](https://vercel.com) par login karein aur **Add New Project** select karein.
2. Apna GitHub repository import karein.
3. Configuration settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `fronted` (Edit par click karke `fronted` chunein)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Environment Variables** section me add karein:
   - `VITE_API_URL` = `https://shaadipage-backend.onrender.com/api`
5. **Deploy** button click karein.
6. Deploy complete hone ke baad Vercel aapko live URL dega: `https://shaadipage-xyz.vercel.app`.

---

### 4. Post-Deployment URL & CORS Update (Crucial Step!)

Jab dono services deploy ho jayein:

1. **Backend CORS Update (Render):**
   - Render dashboard me apne backend Web Service par jayein -> **Environment Variables**.
   - `CLIENT_URL` ko update karke apna Vercel frontend domain daalein:
     ```
     CLIENT_URL=https://shaadipage-xyz.vercel.app
     ```
   - Save changes karein (Render auto-redeploy karega).

2. **Frontend API URL Update (Vercel):**
   - Vercel dashboard me apne project par jayein -> **Settings** -> **Environment Variables**.
   - Ensure karein ki `VITE_API_URL` ka value Render backend ke domain ke barabar ho:
     ```
     VITE_API_URL=https://shaadipage-backend.onrender.com/api
     ```
   - Agar update kiya hai toh **Deployments** tab me jaakar **Redeploy** karein.

---

## 📋 Complete API Endpoints Reference

All endpoints return a standardized JSON format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation status description"
}
```

| Method | Route | Auth Required | Description |
|---|---|---|---|
| `GET` | `/` | None | API Health Check & metadata |
| `POST` | `/api/auth/register` | None | Register new user account |
| `POST` | `/api/auth/login` | None | Authenticate credentials & return JWT |
| `GET` | `/api/auth/profile` | Bearer Token | Fetch authenticated user profile |
| `POST` | `/api/wedding/create` | Bearer Token | Save couple details & generate shareSlug |
| `GET` | `/api/wedding/my-page` | Bearer Token | Fetch user's wedding page & AI HTML |
| `PUT` | `/api/wedding/update` | Bearer Token | Update wedding ceremony details |
| `DELETE` | `/api/wedding/delete` | Bearer Token | Delete wedding project from DB |
| `POST` | `/api/wedding/upload-photo`| Bearer Token | Cloudinary multipart photo upload |
| `GET` | `/api/wedding/public/:slug` | None | Public view for wedding guests |
| `POST` | `/api/ai/generate` | Bearer Token | Gemini 3.8 Flash wedding HTML builder |
| `GET` | `/api/admin/analytics` | Admin Role | Platform metrics (Users, Weddings, etc.) |
| `GET` | `/api/admin/users` | Admin Role | List all registered users |
| `PUT` | `/api/admin/users/:id` | Admin Role | Edit user data |
| `DELETE`| `/api/admin/users/:id` | Admin Role | Delete user & cascade wedding records |
| `GET` | `/api/admin/weddings` | Admin Role | List all wedding projects |
| `PUT` | `/api/admin/weddings/:id`| Admin Role | Moderate & update wedding HTML/details |
| `DELETE`| `/api/admin/weddings/:id`| Admin Role | Delete wedding project |

---

## 🔒 Security Best Practices Implemented
- ✅ Passwords securely hashed with `bcryptjs` (salt rounds: 10) in pre-save hooks.
- ✅ Environment variables strictly protected with `.gitignore` in both frontend and backend.
- ✅ Origin-restricted CORS with credentials support.
- ✅ Centralized error handling preventing stack trace leakage in production.
- ✅ Input validation for email format, password length, and required wedding fields.
