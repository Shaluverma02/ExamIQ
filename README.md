# Online Objective + Coding Examination Platform (ExamiQ)

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
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 2. Environment Configuration
Create `.env` in the root and in `/server`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/online_exam_db
JWT_SECRET=super_secret_jwt_key_exam_platform_2026_secure
JWT_EXPIRES_IN=7d
```

### 3. Database Seeding (Demo Credentials)
```bash
cd server
npm run seed
```
**Demo Login Credentials:**
- **Admin**: `admin@examportal.edu` / `password123`
- **Faculty**: `faculty@examportal.edu` / `password123`
- **Student**: `student@examportal.edu` / `password123`

### 4. Running the Platform
```bash
# Terminal 1: Backend Server (Port 5000)
cd server
npm run dev

# Terminal 2: React Frontend (Port 5173)
cd client
npm run dev
```

Visit `http://localhost:5173` in your browser. Quick demo login buttons are provided on the login page!

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
