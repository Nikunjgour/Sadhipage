# 💒 ShaadiPage — AI-Powered Wedding Website Platform

ShaadiPage is a full-stack web platform where couples enter their wedding details and **Google Gemini AI** generates a beautiful, responsive **wedding website** for them. The couple shares a public link with guests, guests **RSVP** directly on the page, and the couple sees every response on their dashboard.

## 🔗 Live Demo

| Part                 | URL                                     |
| -------------------- | --------------------------------------- |
| Frontend (Vercel)    | https://sadhipage.vercel.app            |
| Backend API (Render) | https://shaadipage-backend.onrender.com |
| Source Code          | https://github.com/Nikunjgour/Sadhipage |

> ⚠️ The backend runs on Render's free plan. After 15 minutes without requests the server sleeps, and the first request afterwards can take 30-50 seconds. An uptime monitor (see "Keeping the server awake") avoids this.

---

## ✨ Features

### Couples (Users)

- Register and log in (JWT authentication)
- **Wedding Details form:** bride and groom names, date, venue, love story, couple photo (Cloudinary upload)
- **AI Generator:** one click generates a complete wedding website with Gemini
- **Background generation with live status:** generation runs on the server in the background and the UI polls the status automatically. No refresh needed, and it keeps running if you switch tabs or reload
- **My Wedding Page:** desktop and mobile preview, regenerate, edit details, delete, copy share link
- **Dashboard:** progress stepper (Details → AI Page → Share), public link and the list of **RSVPs with stats**
- **Profile page:** name, email, role, member since

### Guests

- Open the public link `/w/<share-slug>` to view the couple's wedding page
- Submit an **RSVP** inside the page: name, attending or declining, number of guests
- Instant success or error message after submitting

### Admin

- **Analytics:** Total Users, Total Wedding Pages, Pages This Week, Pages This Month
- **Manage Users:** view all accounts, edit and delete normal users
- **Wedding Pages directory:** view, edit and delete any wedding page
- Switch between Admin Panel and User View from the sidebar
- **Admin protection rules:** admin accounts can never be deleted or edited from the panel (not even by themselves). Admins are created or removed only directly in the database

### What the AI generated page contains

- Slim "ShaadiPage" brand strip at the top (not a navbar, no links)
- Hero with couple names, date and venue (the couple photo is shown fully, over a blurred background)
- Live countdown timer
- Details cards and "Our Love Story" section with the photo
- RSVP form (connected to the backend by the host app)
- Footer: "Made with love on ShaadiPage"
- Maroon, gold and ivory theme, fully responsive

---

## 🏗️ Tech Stack

**Frontend**

- React 19, Vite 8, Tailwind CSS v4
- React Router DOM v7
- TanStack Query v5 (server state and polling)
- Axios (JWT interceptor)

**Backend**

- Node.js (ES Modules), Express 4
- MongoDB Atlas with Mongoose
- JWT (`jsonwebtoken`) and `bcryptjs`
- Cloudinary and Multer (photo upload)
- Google Gemini (`@google/generative-ai`), model `gemini-3.8-flash` with fallback `gemini-3.6-flash`
- `express-rate-limit`, `cors`, `dotenv`

**Hosting**

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas
- Images: Cloudinary

---

## 📁 Project Structure

```
sadhipage/
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── server/
│       ├── server.js              # Express app, CORS, rate limits, trust proxy, startup reset
│       ├── config/db.js           # MongoDB connection
│       ├── models/
│       │   ├── User.js            # name, email, password hash, role
│       │   ├── Wedding.js         # couple details, photo, generated HTML, slug, generation status
│       │   └── Rsvp.js            # guest RSVP linked to a wedding
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── weddingController.js
│       │   ├── aiController.js    # Gemini prompt and background generation job
│       │   └── adminController.js
│       ├── routes/                # auth, wedding, ai, admin
│       ├── middleware/
│       │   ├── authMiddleware.js  # protect (JWT) and isAdmin
│       │   └── uploadMiddleware.js# Multer (images only, 5 MB)
│       ├── utils/cascadeHelper.js # deletes weddings and RSVPs together
│       └── scripts/cleanupOrphans.js # optional database cleanup script
│
└── fronted/                       # React app (the folder is spelled "fronted")
    ├── .env.example
    ├── vercel.json                # SPA rewrite so /w/:slug works on refresh
    ├── package.json
    └── src/
        ├── App.jsx                # providers and routes
        ├── api/api.js             # Axios client and all API functions
        ├── context/               # AuthContext, ToastContext
        ├── utils/rsvpHtml.js      # RSVP script injected into the generated page
        ├── components/            # Sidebar, Navbar, Modal, Toast, route guards
        └── pages/
            ├── public/            # Landing, Login, Register, PublicWedding, Private, NotFound
            ├── user/              # Dashboard, WeddingDetails, AIGeneration, Preview, Profile
            └── admin/             # AdminDashboard, AdminUsers, AdminWeddings
```

---

## ⚙️ How It Works

### 1. AI generation (background job)

1. The user clicks **Generate** → `POST /api/ai/generate`
2. The server immediately replies `202 Accepted` and sets the wedding's `generationStatus` to `generating`
3. Gemini is called in the background. Temporary errors (503, 429, network) are retried 3 times (2s, 5s, 10s) and then the fallback model is used
4. The returned HTML is validated (RSVP form IDs and the ShaadiPage branding must exist) and the photo placeholder is replaced with the real Cloudinary URL
5. Status becomes `done` (or `failed` with a message)
6. The frontend polls `GET /api/wedding/my-page` every 4 seconds and flips to "Ready" automatically

Status values: `idle` → `generating` → `done` / `failed`. If the server restarts while a job is running, stuck jobs are marked `failed` on startup.

### 2. RSVP flow

- The generated page runs inside a **sandboxed iframe** (`allow-scripts allow-forms allow-popups`, no `allow-same-origin`)
- The generated HTML contains no network code and no backend URL
- The host app (`rsvpHtml.js`) validates the form and sends **one** `postMessage` to the parent
- The parent makes the API call (`POST /api/wedding/rsvp`) and sends the result back to the iframe
- The parent only accepts messages from its own iframe (`event.source`)

### 3. Share link

The link is built from `window.location.origin`, so it always uses the domain the app is running on (for example `https://sadhipage.vercel.app/w/<slug>`).

### 4. Cascade delete

Deleting a user, or a wedding page, also deletes the related wedding and all of its RSVPs. The server returns how many documents were removed.

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable                | Example                                                     | Where to get it                                              |
| ----------------------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| `PORT`                  | `8080`                                                      | Local only. Render sets it automatically                     |
| `NODE_ENV`              | `development` or `production`                               | Use `production` when deployed                               |
| `CLIENT_URL`            | `http://localhost:5173`                                     | Frontend URL(s), comma-separated, no spaces, no trailing `/` |
| `MONGO_URI`             | `mongodb+srv://user:pass@cluster.mongodb.net/shaadipage-db` | MongoDB Atlas → Connect → Drivers                            |
| `JWT_SECRET`            | a random string of 32+ characters                           | Generate your own                                            |
| `CLOUDINARY_CLOUD_NAME` | `my_cloud`                                                  | Cloudinary Dashboard                                         |
| `CLOUDINARY_API_KEY`    | `1234567890`                                                | Cloudinary Dashboard                                         |
| `CLOUDINARY_API_SECRET` | `abcd...`                                                   | Cloudinary Dashboard                                         |
| `GEMINI_API_KEY`        | `AIza...`                                                   | Google AI Studio                                             |

### Frontend (`fronted/.env`)

| Variable       | Example                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------- |
| `VITE_API_URL` | `http://localhost:8080/api` (local) or `https://shaadipage-backend.onrender.com/api` (live) |

> 🔒 Never commit `.env` files. This repository is public.

---

## 🚀 Local Development

**Prerequisites:** Node.js 18+, a MongoDB Atlas cluster, a Cloudinary account and a Gemini API key.

```bash
# 1. Clone
git clone https://github.com/Nikunjgour/Sadhipage.git
cd Sadhipage

# 2. Backend
cd backend
npm install
cp .env.example .env      # fill in your values
npm run dev               # http://localhost:8080

# 3. Frontend (new terminal)
cd fronted
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:8080/api
npm run dev               # http://localhost:5173
```

On Windows PowerShell use `copy .env.example .env` instead of `cp`.

### Creating an admin account

Registration always creates a normal user (for security). To make an admin:

1. Register normally on the site
2. Open MongoDB Atlas → Browse Collections → `users`
3. Change that user's `role` to `"admin"`, then log out and log in again

---

## 🌐 Deployment Guide (Free)

### 1. MongoDB Atlas

1. Create a free M0 cluster
2. **Database Access:** create a user with read/write access
3. **Network Access:** add `0.0.0.0/0` (Render's IP is not fixed)
4. Copy the connection string (URL-encode special characters in the password such as `@` or `#`)

### 2. Backend → Render

1. Render → **New + → Web Service** and select the GitHub repo (the Render GitHub app needs access to the repository)
2. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
3. Environment variables: `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, the three `CLOUDINARY_*` values, `GEMINI_API_KEY`, `CLIENT_URL` (do not set `PORT`)
4. Deploy and open the Render URL to see the health JSON

### 3. Frontend → Vercel

1. Vercel → **Add New → Project** and import the same repo
2. Settings:
   - **Root Directory:** `fronted`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`, **Output Directory:** `dist`
3. Environment variable `VITE_API_URL` = `https://<your-backend>.onrender.com/api`
   - Choose type **Config** (not Secret). `VITE_` variables are public by design
   - Must end with `/api`, with no trailing `/`
4. Deploy

### 4. Final step: CORS

Update `CLIENT_URL` on Render with the Vercel URL (for example `https://sadhipage.vercel.app`, no trailing `/`), save, and wait for Render to redeploy. Without this step login and register fail with a CORS error.

### 5. Keeping the server awake (optional)

Create an HTTP(s) monitor on [UptimeRobot](https://uptimerobot.com) for the Render URL with a 5-minute interval, so the free server does not sleep.

> To update the app just `git push`. Vercel and Render redeploy automatically. After changing `VITE_API_URL` on Vercel, trigger a manual **Redeploy**.

---

## 📋 API Endpoints

All responses use this shape:

```json
{ "success": true, "data": {}, "message": "..." }
```

| Method | Route                            | Auth  | Description                                                                  |
| ------ | -------------------------------- | ----- | ---------------------------------------------------------------------------- |
| GET    | `/`                              | None  | API health check                                                             |
| POST   | `/api/auth/register`             | None  | Create a user (role is always `user`)                                        |
| POST   | `/api/auth/login`                | None  | Log in and receive a JWT                                                     |
| GET    | `/api/auth/profile`              | JWT   | Logged-in user's profile                                                     |
| GET    | `/api/auth/me`                   | JWT   | Alias of profile                                                             |
| POST   | `/api/wedding/create`            | JWT   | Save wedding details and create the share slug                               |
| GET    | `/api/wedding/my-page`           | JWT   | Own wedding page, generation status and RSVPs                                |
| PUT    | `/api/wedding/update`            | JWT   | Update wedding details                                                       |
| DELETE | `/api/wedding/delete`            | JWT   | Delete own wedding and its RSVPs                                             |
| POST   | `/api/wedding/upload-photo`      | JWT   | Upload a photo to Cloudinary (image, max 5 MB)                               |
| GET    | `/api/wedding/public/:shareSlug` | None  | Public page for guests                                                       |
| POST   | `/api/wedding/rsvp`              | None  | Guest RSVP                                                                   |
| GET    | `/api/wedding/rsvps`             | JWT   | RSVPs of the logged-in couple                                                |
| POST   | `/api/ai/generate`               | JWT   | Start AI generation (returns 202)                                            |
| GET    | `/api/admin/analytics`           | Admin | Platform statistics                                                          |
| GET    | `/api/admin/users`               | Admin | List all users                                                               |
| PUT    | `/api/admin/users/:id`           | Admin | Edit a normal user (name and email only; admins cannot be edited)            |
| DELETE | `/api/admin/users/:id`           | Admin | Delete a normal user with their wedding and RSVPs (admins cannot be deleted) |
| GET    | `/api/admin/weddings`            | Admin | List all wedding pages                                                       |
| PUT    | `/api/admin/weddings/:id`        | Admin | Edit wedding details or HTML                                                 |
| DELETE | `/api/admin/weddings/:id`        | Admin | Delete a wedding page and its RSVPs                                          |

---

## 🗄️ Database Models

- **User:** `name`, `email` (unique), `password` (bcrypt hash), `role` (`user` or `admin`), `createdAt`
- **Wedding:** `user`, `brideName`, `groomName`, `weddingDate`, `venue`, `story`, `photoUrl`, `generatedHTML`, `isPublic`, `shareSlug` (unique), `generationStatus` (`idle`, `generating`, `done`, `failed`), `generationError`, `generationStartedAt`
- **Rsvp:** `wedding`, `weddingSlug`, `name`, `attending`, `guestCount` (0-50), `email`, `note`

### Optional cleanup script

Finds weddings whose user no longer exists and RSVPs whose wedding no longer exists. It runs in dry-run mode by default and deletes nothing until you pass `--apply`.

```bash
cd backend
npm run cleanup:orphans            # dry run, only prints counts
npm run cleanup:orphans -- --apply # actually deletes
```

---

## 🔒 Security

- Passwords hashed with bcrypt (10 salt rounds), JWT valid for 30 days
- The role is never read from the request body on register (every new user is `user`)
- Admin accounts cannot be edited or deleted through the API
- CORS allows only the origins listed in `CLIENT_URL` (blocked origins get 403)
- Rate limits: login and register 20 requests per 15 minutes, AI generate 10 requests per hour
- `trust proxy` is enabled so rate limiting works correctly behind Render's proxy
- Stack traces are never returned in production
- AI-generated HTML runs in a sandboxed iframe without `allow-same-origin`, so it cannot read the app's token or storage
- User input (names, venue, story) is escaped before it goes into the AI prompt
- Deleting a user or wedding also removes the related RSVPs
- `.env` files are listed in `.gitignore`

---

## 🧰 Troubleshooting

| Problem                                                        | Cause and fix                                                                                         |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Login shows "Network Error" and the console shows a CORS error | `CLIENT_URL` on Render does not match the Vercel URL. Check spelling, `https://` and the trailing `/` |
| Requests go to `/auth/login` instead of `/api/auth/login`      | `VITE_API_URL` is missing `/api`. Fix it on Vercel and redeploy                                       |
| First request is very slow                                     | The free Render server was asleep. Wait 30-50 seconds or use an uptime monitor                        |
| "The AI server is busy right now"                              | Gemini is overloaded (503). Try again in 1-2 minutes                                                  |
| Photo upload fails                                             | Check the three `CLOUDINARY_*` variables on Render                                                    |
| Share link shows 404 on refresh                                | `fronted/vercel.json` (SPA rewrite) must exist                                                        |
| Vercel will not save `VITE_API_URL`                            | The variable type is Secret. Delete it and recreate it as Config                                      |

---

## ⚠️ Known Limitations

- Free Render plan: the server sleeps when idle, and a generation running while it sleeps can be interrupted
- No profile editing (name or password change) yet
- No toggle to make a wedding page private in the UI (`isPublic` exists in the database)
- No password reset or email verification

## 🔮 Future Scope

- Custom domain and multiple page themes
- Guest list export (CSV) and RSVP email notifications
- Profile editing and password reset
- Multi-language wedding pages

---

## 👨‍💻 Author

**Nikunj Gour** — [GitHub](https://github.com/Nikunjgour)
