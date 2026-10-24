# 🏆 WinArena - Skill-Based Tournament Platform & Guaranteed E-Commerce Rewards

> Full-stack skill challenge application where users join skill contests (Retro Nokia Snake II), compete on audited live leaderboards for luxury grand prizes, and receive 100% guaranteed apparel delivery.

---

## 🚀 Features

- 🎮 **Nokia Snake II Arcade Engine**: Skill-based arcade game with anti-cheat token validation, dynamic speed acceleration, and golden bonus fruit.
- 🏆 **Live Audited Leaderboards**: Real-time rank calculation and high score tracking with instant updates.
- 👑 **Grand Prize Winner Showcase**: Concluded challenges highlight the certified champion's avatar, crown, verified score, location, and dispatched prize.
- 📦 **100% Guaranteed Apparel Logistics**: Integrated delivery management with automated BlueDart express tracking and size/color preferences.
- ⏳ **Upcoming Challenges Scheduler**: Challenges support launch dates with countdown timers and pre-registration locks.
- 🛡️ **Comprehensive Admin & Manager Portal**:
  - Live contest creation & start-time/duration scheduler
  - Snake II mechanics fine-tuning (speed, apple points, duration)
  - One-click Grand Prize Winner Declaration
  - User role management & fraud prevention blocking
  - Logistics & order dispatch lifecycle management

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Lucide Icons, Vanilla CSS
- **Backend**: Node.js, Express.js, JWT Authentication, bcryptjs
- **Database**: PostgreSQL (pg pool, ACID transactions, relational foreign keys)

---

## 📁 Repository Structure

```
ChallengeTask/
├── client/              # React + Vite frontend application
│   ├── src/             # Components, services, assets
│   ├── index.html
│   └── package.json
├── server/              # Express + PostgreSQL backend API
│   ├── routes/          # Tournaments, game, auth, orders, admin
│   ├── schema.sql       # PostgreSQL database schema
│   ├── seed.js          # Initial sample data & test accounts
│   ├── db.js            # PostgreSQL connection pool
│   └── package.json
├── package.json         # Root workspace scripts (concurrent dev)
└── .gitignore           # Git ignore rules for node_modules and .env
```

---

## ⚙️ Local Setup Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14.0 or higher
- **Git**

### 2. Clone Repository
```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd ChallengeTask
```

### 3. Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
cd ..
```

### 4. Database Setup
1. Create a PostgreSQL database named `ChallengeDB` (or your preferred name):
```sql
CREATE DATABASE "ChallengeDB";
```
2. Run the database schema:
```bash
cd server
psql -U postgres -d ChallengeDB -f schema.sql
```
3. Seed sample challenges, apparel gifts, and test users:
```bash
npm run seed
cd ..
```

### 5. Environment Variables
Create a `.env` file inside the `server/` folder based on `.env.example`:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=ChallengeDB
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
```

### 6. Run the Application
From the root directory:
```bash
npm run dev
```
- **Backend API**: `http://localhost:5000`
- **Frontend App**: `http://localhost:5175` (or Vite's assigned port)

---

## 👥 Default Demo Roles & Credentials (from seed)
- **Super Admin**: `admin@winarena.com` / `Admin@123`
- **Player**: `player@winarena.com` / `Player@123`

---

## 📄 License
ISC License
