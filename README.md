codee# Online Objective + Coding Examination Platform (ExamiQ)

A full-stack, production-ready assessment and examination system built with Node.js, Express, MongoDB, React, Bootstrap 5, and Monaco Editor. Featuring automated code judging across 5 programming languages, proctored anti-cheating monitoring, real-time leaderboards, performance analytics, and downloadable QR-verified certificates.

---

## Features Summary

### 🎓 Student Portal
- **Dashboard**: View available, upcoming, and completed exams, average scores, and ranks.
- **Distraction-Free Live Exam**: Integrated split-view MCQ question viewer and Monaco Code Editor.
- **Proctored Anti-Cheating Engine**: Monitors window blur, tab switching, exiting fullscreen, and blocks unauthorized copy-paste operations.
- **Server-Authoritative Timer**: Synchronized countdown timer preventing client-side clock tampering.
- **Auto-Save**: Automatic answer saving on selection.
- **Instant Evaluation & Breakdown**: Detailed question-wise analysis, MCQ score (with negative marking calculation), and test-case breakdown.
- **Global & Exam Leaderboards**: Filterable rank tables.
- **Verified Certificates**: Automated PDF certificate generation equipped with unique verification IDs and QR codes.

### 👨‍🏫 Faculty / Instructor Portal
- **Dashboard**: Overview of created exams, question bank repository, student attempts, and submission stats.
- **Question Bank**: Manage MCQs (single/multiple choice, true/false with explanations & negative marks) and Sandboxed Coding Problems (with starter code templates, public test cases, and hidden test cases).
- **Exam Builder**: Configure title, duration, category, scheduling window, negative marking rules, and assign questions.
- **Analytics & Graphs**: Recharts visualization of score distributions, pass/fail ratios, and candidate performance.

### 🛡 System Administrator Console
- **User Governance**: View user directory, search, filter by role, and toggle active/inactive account status.
- **Courses & Categories**: Create and manage subject domains and course codes.
- **Security Audit Logs**: Track administrative modifications, logins, resource updates, and IP addresses.
- **System Analytics**: Platform-wide usage stats.

---

## 💻 Tech Stack

- **Frontend**: React.js (Vite), React Router v6, Axios, Bootstrap 5, Monaco Editor (`@monaco-editor/react`), Recharts, React Toastify, Lucide Icons, Canvas Confetti, HTML2Canvas, jsPDF, QRCode.react.
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), JWT, bcryptjs, Nodemailer, Express Validator, Helmet, CORS, Express Rate Limit.
- **Code Execution Sandbox**: Multilingual code judge supporting JavaScript (`node`), Python 3 (`python`), C++ (`g++`), C (`gcc`), and Java (`javac`/`java`) with execution timeouts and memory limits.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- MongoDB running locally at `mongodb://127.0.0.1:27017` or MongoDB Atlas URI.

### 1. Installation
```bash
npm run setup
```

### 2. Environment Configuration
Use the single project-root `.env` for backend, frontend configuration, and database scripts:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/online_exam_db
JWT_SECRET=super_secret_jwt_key_exam_platform_2026_secure
JWT_EXPIRES_IN=7d
REQUIRE_EMAIL_VERIFICATION=false
REQUIRE_PHONE_VERIFICATION=true
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+10000000000
```

When phone verification is enabled, new accounts receive a six-digit SMS code. Configure the Twilio values with production secrets before enabling it.

### 3. Database Seeding (Demo Credentials)
```bash
npm run seed
```
Set `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and optional `SEED_ADMIN_NAME` in the root `.env`, then run `npm run seed`. This creates the real Super Admin account; demo login is disabled.

### 4. Running the Platform
```bash
# From the project root: starts backend and frontend together
npm run dev
```

Visit `http://localhost:5173` in your browser. Press Ctrl+C to stop both services.

On Windows PowerShell, use `npm.cmd run dev` if script execution policy blocks `npm`.

### 5. Netlify Deployment (Frontend)

Create a Netlify site from this repository with these build settings:

- Base directory: `client`
- Build command: `npm ci && npm run build`
- Publish directory: `dist`

In the Netlify site environment variables, set `VITE_API_URL` to your Render backend URL followed by `/api`, for example `https://examiq-backend.onrender.com/api`. Redeploy after adding or changing the variable. Netlify serves the React app's client-side routes through the included `netlify.toml` redirect.

After Netlify assigns the site URL, set the Render backend's `CLIENT_URL` environment variable to that exact origin, for example `https://your-site.netlify.app`. If you use a custom domain too, include both origins separated by a comma. Redeploy the backend after changing the value.

### 6. Render Deployment (Backend)
Deploy the backend as a standalone Render Web Service from the `server` directory:

```yaml
# render.yaml
services:
  - type: web
    name: examiq-backend
    env: node
    rootDir: server
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: MONGO_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: CLIENT_URL
        sync: false
```

Set `CLIENT_URL` in Render to your deployed Netlify frontend URL (or a comma-separated list of allowed frontend origins).

### Validation checks

```bash
npm test
npm run test:flows
npm run build
```

`test:flows` requires MongoDB and runs real HTTP tests against a separate temporary database, which it removes afterward. It covers role login, registration, profile updates, college administrators, groups, question validation, exam assignment/start/resume/submission, scoring, certificates, Excel export, notifications, JavaScript execution, recruiter data, and password reset. Normal tests also cover college isolation, result release rules, and retake limits.

Email/SMS delivery, external AI responses, and browser camera/microphone/screen-sharing permissions require separate integration checks. Python, C, C++, and Java execution require their respective runtimes/compilers to be installed.

---

## 🚢 Docker Deployment

Build and spin up the complete environment using Docker Compose:
```bash
docker-compose up --build
```
- Client: `http://localhost:5173`
- API Server: `http://localhost:5000`
- MongoDB: `localhost:27017`

---

## 🔒 Security Architecture

- **Role-Based Access Control (RBAC)**: Enforced via `protect` and `authorize('student', 'faculty', 'admin')` middleware.
- **Hidden Test Case Isolation**: Hidden test case inputs and expected outputs are evaluated server-side and never returned in API payloads to students.
- **Anti-Cheat Monitoring**: Tracks window blur, tab switches, and blocks copy-paste events during active exam attempts.
- **Rate Limiting & Headers**: Configured with `express-rate-limit` and `helmet` security headers.
