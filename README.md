# 💒 ShaadiPage — AI-Powered Royal Wedding Platform

ShaadiPage ek full-stack web platform hai jisme couples apni shaadi ki details bharte hain aur **Google Gemini AI** unke liye ek luxurious, responsive **wedding website** generate karta hai. Couple us page ka shareable link guests ko bhej sakta hai, aur guests seedha page par **RSVP** kar sakte hain. Couple apne dashboard me saare RSVPs dekh sakta hai.

## 🔗 Live Demo

| Part | URL |
|---|---|
| Frontend (Vercel) | https://sadhipage.vercel.app |
| Backend API (Render) | https://shaadipage-backend.onrender.com |
| Source Code | https://github.com/Nikunjgour/Sadhipage |

> ⚠️ Backend Render ke free plan par hai. 15 minute inactive rehne par server so jata hai, isliye pehla request 30-50 second le sakta hai.

---

## ✨ Features

### Users (Couples)
- Register / Login (JWT based authentication)
- **Wedding Details form:** bride & groom ke naam, date, venue, love story, couple photo (Cloudinary upload)
- **AI Generator:** ek click me Gemini AI se complete wedding website generate hoti hai
- **Background generation + live status:** generation server par background me chalti hai, UI apne aap status poll karta hai (refresh ki zarurat nahi, tab badalne par bhi chalta rehta hai)
- **My Wedding Page:** desktop / mobile preview, regenerate, edit, delete, share link copy
- **Dashboard:** progress stepper (Details → AI Page → Share), public link, aur guests ke **RSVP list + stats**
- **Profile page:** naam, email, role, member since

### Guests
- Public link `/w/<share-slug>` kholkar couple ka page dekhna
- Page ke andar **RSVP form:** naam, attending / declining, guest count
- Success / error message guest ko turant dikhta hai

### Admin
- Analytics dashboard (users, weddings ki counting)
- Users manage karna (edit / delete)
- Wedding pages directory (view, edit HTML, delete)
- Admin "Switch to User View" aur wapas "Switch to Admin Panel" button

### AI Generated Page me kya hota hai
- Royal maroon + gold + ivory theme, full-width responsive layout
- Hero section (couple photo poori dikhti hai, blurred background ke saath), names, date, venue
- Live countdown timer
- Details cards, Our Love Story section (photo ke saath)
- RSVP section (host app is form ko real submission se jodta hai)

---

## 🏗️ Tech Stack

**Frontend**
- React 19, Vite 8, Tailwind CSS v4
- React Router DOM v7
- TanStack Query v5 (server state, polling)
- Axios (JWT interceptor)

**Backend**
- Node.js (ES Modules), Express 4
- MongoDB Atlas + Mongoose
- JWT (jsonwebtoken) + bcryptjs
- Cloudinary + Multer (photo upload)
- Google Gemini (`@google/generative-ai`), model `gemini-3.8-flash` with fallback `gemini-3.6-flash`
- express-rate-limit, cors, dotenv

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
│       ├── server.js              # Express app, CORS, rate limits, startup reset
│       ├── config/db.js           # MongoDB connection
│       ├── models/
│       │   ├── User.js            # name, email, password hash, role
│       │   ├── Wedding.js         # couple details, photo, generated HTML, slug, generation status
│       │   └── Rsvp.js            # guest RSVP linked to a wedding
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── weddingController.js
│       │   ├── aiController.js    # Gemini prompt + background generation job
│       │   └── adminController.js
│       ├── routes/                # auth, wedding, ai, admin routes
│       └── middleware/
│           ├── authMiddleware.js  # protect (JWT) + isAdmin
│           └── uploadMiddleware.js# Multer (images only, 5 MB)
│
└── fronted/
    ├── .env.example
    ├── vercel.json                # SPA rewrite (/w/:slug refresh fix)
    ├── package.json
    └── src/
        ├── App.jsx                # providers + routes
        ├── api/api.js             # Axios client + all API functions
        ├── context/               # AuthContext, ToastContext
        ├── utils/rsvpHtml.js      # RSVP harness injected into generated page + relay hook
        ├── components/            # Sidebar, Navbar, Modal, Toast, route guards...
        └── pages/
            ├── public/            # Landing, Login, Register, PublicWedding, Private, NotFound
            ├── user/              # Dashboard, WeddingDetailsForm, AIGeneration, Preview, Profile
            └── admin/             # AdminDashboard, AdminUsers, AdminWeddings
```

> Note: frontend folder ka naam `fronted` hai (spelling jaisi hai waisi hi rakhi gayi hai, kyunki deployment settings isi naam par hain).

---

## ⚙️ How It Works

### 1. AI Generation (background job)
1. User **Generate** dabata hai → `POST /api/ai/generate`
2. Backend turant `202 Accepted` deta hai aur wedding ka `generationStatus` `generating` kar deta hai
3. Gemini ko call background me hoti hai (503/429/network errors par 3 retries: 2s, 5s, 10s, phir fallback model)
4. Generated HTML validate hota hai (RSVP form IDs maujood hone chahiye), photo placeholder asli Cloudinary URL se replace hota hai
5. Status `done` (ya `failed` + error message) ho jata hai
6. Frontend har 4 second me status poll karta hai aur apne aap "Ready" dikha deta hai

Status values: `idle` → `generating` → `done` / `failed`. Agar server restart ho jaye to atke hue `generating` jobs startup par `failed` mark ho jate hain.

### 2. RSVP flow (secure)
- Generated page ek **sandboxed iframe** me chalta hai (`allow-scripts allow-forms allow-popups`, `allow-same-origin` nahi)
- Generated HTML me koi network code ya backend URL nahi hota
- Host app (`rsvpHtml.js`) form validate karta hai aur **ek hi `postMessage`** parent ko bhejta hai
- Parent page API call (`POST /api/wedding/rsvp`) karta hai aur result iframe ko wapas bhejta hai
- Parent sirf apne iframe (`event.source`) ke messages sunta hai, isliye double submission ya spoofing nahi hoti

### 3. Share link
Link `window.location.origin` se banta hai, isliye jis domain par app khuli hai usi ka link banta hai (`https://sadhipage.vercel.app/w/<slug>`).

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Example | Kahan se milega |
|---|---|---|
| `PORT` | `8080` | Local ke liye. Render khud deta hai |
| `NODE_ENV` | `development` / `production` | Deploy par `production` |
| `CLIENT_URL` | `http://localhost:5173` | Frontend URL(s), comma-separated, bina space aur bina end `/` ke |
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/shaadipage-db` | MongoDB Atlas → Connect → Drivers |
| `JWT_SECRET` | 32+ character random string | Khud banao |
| `CLOUDINARY_CLOUD_NAME` | `my_cloud` | Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | `1234567890` | Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | `abcd...` | Cloudinary Dashboard |
| `GEMINI_API_KEY` | `AIza...` | Google AI Studio |

### Frontend (`fronted/.env`)

| Variable | Example |
|---|---|
| `VITE_API_URL` | `http://localhost:8080/api` (local) / `https://shaadipage-backend.onrender.com/api` (live) |

> 🔒 `.env` files kabhi GitHub par push mat karo. Repo public hai.

---

## 🚀 Local Development

**Prerequisites:** Node.js 18+, MongoDB Atlas cluster, Cloudinary account, Gemini API key.

```bash
# 1. Repo clone
git clone https://github.com/Nikunjgour/Sadhipage.git
cd Sadhipage

# 2. Backend
cd backend
npm install
cp .env.example .env      # phir .env me apni values bharo
npm run dev               # http://localhost:8080

# 3. Frontend (naye terminal me)
cd fronted
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:8080/api
npm run dev               # http://localhost:5173
```

Windows PowerShell me `cp` ki jagah `copy .env.example .env` use karo.

### Admin account banana
Register API hamesha role `user` banati hai (security ke liye). Admin banane ke liye:
1. Site par normal register karo
2. MongoDB Atlas → Browse Collections → `users` me apna user kholo
3. `role` ko `"admin"` kar do aur logout / login karo

---

## 🌐 Deployment Guide (Free)

### 1. MongoDB Atlas
1. Free M0 cluster banao
2. **Database Access:** read/write user banao
3. **Network Access:** `0.0.0.0/0` add karo (Render ka IP fixed nahi hota)
4. Connection string copy karo (password me `@`, `#` jaise characters ho to URL-encode karo)

### 2. Backend → Render
1. Render me **New + → Web Service**, GitHub repo `Sadhipage` chuno (Render GitHub app ko repo ka access dena zaroori hai)
2. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
3. Environment variables: `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_*` (3), `GEMINI_API_KEY`, `CLIENT_URL`
   (`PORT` mat daalo, Render khud deta hai)
4. Deploy karo aur URL ko browser me kholkar health JSON check karo

### 3. Frontend → Vercel
1. Vercel me **Add New → Project**, wahi repo import karo
2. Settings:
   - **Root Directory:** `fronted`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`, **Output Directory:** `dist`
3. Environment variable: `VITE_API_URL` = `https://<tera-backend>.onrender.com/api`
   - Type **Config** rakho (Secret nahi, `VITE_` variables browser me jate hi hain)
   - End me `/api` zaroor, aakhir me `/` nahi
4. Deploy karo

### 4. Last step (zaroori): CORS
Render me `CLIENT_URL` ko Vercel ke URL se update karo (jaise `https://sadhipage.vercel.app`), Save karo aur Render ke redeploy hone do. Ye step chhoot gaya to login/register par CORS error aata hai.

### 5. Sleep se bachana (optional)
[UptimeRobot](https://uptimerobot.com) me HTTP monitor banao (Render URL, 5 minute interval) taaki free server so na jaye.

> Code update ke liye bas `git push` karo. Vercel aur Render dono apne aap redeploy karte hain. `VITE_API_URL` jaisa env variable badalne par Vercel me manual **Redeploy** zaroori hai.

---

## 📋 API Endpoints

Sab responses standard format me aate hain:

```json
{ "success": true, "data": { }, "message": "..." }
```

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/` | None | API health check |
| POST | `/api/auth/register` | None | Naya user (role hamesha `user`) |
| POST | `/api/auth/login` | None | Login, JWT return |
| GET | `/api/auth/profile` | JWT | Logged-in user ki profile |
| GET | `/api/auth/me` | JWT | Profile ka alias |
| POST | `/api/wedding/create` | JWT | Wedding details save + share slug banana |
| GET | `/api/wedding/my-page` | JWT | Apna wedding page, generation status aur RSVPs |
| PUT | `/api/wedding/update` | JWT | Wedding details update |
| DELETE | `/api/wedding/delete` | JWT | Wedding aur uske RSVPs delete |
| POST | `/api/wedding/upload-photo` | JWT | Cloudinary photo upload (image, max 5 MB) |
| GET | `/api/wedding/public/:shareSlug` | None | Guests ke liye public page |
| POST | `/api/wedding/rsvp` | None | Guest RSVP submit |
| GET | `/api/wedding/rsvps` | JWT | Owner ke RSVPs |
| POST | `/api/ai/generate` | JWT | AI generation start (202, background job) |
| GET | `/api/admin/analytics` | Admin | Platform stats |
| GET | `/api/admin/users` | Admin | Saare users |
| PUT | `/api/admin/users/:id` | Admin | User edit |
| DELETE | `/api/admin/users/:id` | Admin | User, uske weddings aur RSVPs delete |
| GET | `/api/admin/weddings` | Admin | Saare wedding pages |
| PUT | `/api/admin/weddings/:id` | Admin | Wedding details / HTML edit |
| DELETE | `/api/admin/weddings/:id` | Admin | Wedding aur RSVPs delete |

---

## 🗄️ Database Models

- **User:** `name`, `email` (unique), `password` (bcrypt hash), `role` (`user` / `admin`), `createdAt`
- **Wedding:** `user`, `brideName`, `groomName`, `weddingDate`, `venue`, `story`, `photoUrl`, `generatedHTML`, `isPublic`, `shareSlug` (unique), `generationStatus` (`idle` / `generating` / `done` / `failed`), `generationError`, `generationStartedAt`
- **Rsvp:** `wedding`, `weddingSlug`, `name`, `attending`, `guestCount` (0-50), `email`, `note`

---

## 🔒 Security

- Passwords bcrypt se hash (10 salt rounds), JWT 30 din ke liye
- Register par role request body se nahi liya jata (sabhi naye users `user`)
- CORS sirf `CLIENT_URL` ke origins ko allow karta hai (blocked origin par 403)
- Rate limiting: login/register 20 requests / 15 min, AI generate 10 requests / ghanta
- Production me error responses me stack trace nahi jata
- AI generated HTML sandboxed iframe me chalta hai (`allow-same-origin` nahi), isliye wo app ka token ya storage nahi padh sakta
- User input (naam, venue, story) AI prompt me jane se pehle escape hota hai
- Wedding / user delete par related RSVPs bhi delete hote hain
- `.env` files `.gitignore` me hain

---

## 🧰 Troubleshooting

| Problem | Wajah / Solution |
|---|---|
| Login par "Network Error" + console me CORS error | Render me `CLIENT_URL` Vercel URL se match nahi kar raha. Spelling, `https://`, end ka `/` check karo |
| Request `/api` ke bina ja rahi hai | `VITE_API_URL` me `/api` nahi hai. Sahi karke Vercel me Redeploy karo |
| Pehla request bahut slow | Render free server so gaya tha, 30-50 sec ruko |
| "AI server abhi busy hai" | Gemini par load hai (503). 1-2 minute baad dobara Generate karo |
| Photo upload fail | Render me teeno `CLOUDINARY_*` variables check karo |
| Share link refresh par 404 | `fronted/vercel.json` (SPA rewrite) maujood hona chahiye |
| Generate ke beech page purana dikhe | Status `generating` hai to UI apne aap update hoga. Server restart hua ho to dobara Generate karo |

---

## ⚠️ Known Limitations
- Free Render plan par server sleep hota hai aur sone ke dauran chalti AI generation beech me ruk sakti hai
- Profile edit (naam / password badalna) abhi available nahi hai
- `isPublic` (page private karna) ka toggle UI me nahi hai
- Password reset aur email verification abhi nahi hain

## 🔮 Future Scope
- Custom domain (`shaadipage.in`) aur multiple themes
- Guest list export (CSV), RSVP email notifications
- Profile edit, password reset
- Multi-language wedding pages

---

## 👨‍💻 Author
**Nikunj Gour** — [GitHub](https://github.com/Nikunjgour)
