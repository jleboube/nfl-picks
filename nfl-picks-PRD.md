# 🏈 NFL Picks Web Application — Production Requirements Document

## 📘 Title
**NFL Weekly Picks Web App (2025–2026 Season)**

## 🔍 Purpose
Develop a web app allowing users to make weekly NFL game predictions, track accuracy throughout the 2025–2026 season, and view a leaderboard. Picks are locked at a set deadline and scored automatically based on real NFL results.

## 🧑 Target Users
- NFL fans who enjoy weekly pick'em contests
- Users who want to compete with friends or a public leaderboard

## 🧭 Key Features

### 1. User Registration and Login
- Secure signup/login with hashed passwords
- JWT or session-based authentication
- Optional OAuth (Google, etc.)

### 2. NFL 2025–2026 Schedule Integration
- Full 18-week regular-season schedule
- Weekly game listing with:
  - Team names
  - Logos
  - Records (updated weekly)

### 3. Weekly Pick Submission
- Picks open Tuesday 6:00 AM CT
- Deadline: Thursday 12:00 PM CT
- UI for selecting winners per game
- Partial picks saved automatically
- Confirmation message on save
- Deadline warning for incomplete picks

### 4. Auto-Scoring System
- Active game window: Thursday 7:00 PM CT to Sunday 11:59 PM CT
- Score checking via NFL or sports API
- 1 point per correct prediction
- 0 points for incorrect or missed

### 5. Leaderboard
- Displays:
  - Username
  - Total correct picks
- Optional weekly breakdown
- Sorted by total correct picks (tiebreaks optional)

### 6. Data Persistence
- All data stored in a persistent database
- Backups weekly
- No data loss tolerated during the season

### 7. User Experience
- Responsive design
- Intuitive UX
- Alerts and reminder messages
- Optional email notifications

## 🧱 Technical Requirements

### Stack (Flexible)
- Frontend: React / Vue / Svelte + Tailwind CSS
- Backend: Node.js (Express), Django, or FastAPI
- Database: PostgreSQL / MySQL / MongoDB
- Auth: JWT or sessions
- Hosting: Vercel, Netlify (frontend); Render, Fly.io, AWS, etc. (backend)
- Cron jobs or scheduled functions for score updates
- Real-time NFL data API (e.g., SportdataAPI, TheSportsDB)

## 🗂️ Database Schema (High-Level)

### Users
- id, username, email, password_hash, created_at

### Picks
- id, user_id, week_number, game_id, selected_team, is_correct, submitted_at

### Games
- id, week_number, home_team, away_team, home_score, away_score, game_time

### Leaderboard View
- user_id, username, total_correct

## 📅 Timeline (Suggested)
| Date         | Milestone                        |
|--------------|----------------------------------|
| Aug 15, 2025 | Auth + Frontend MVP              |
| Aug 25, 2025 | NFL Schedule + UI                |
| Sep 1, 2025  | Scoring engine + API integration |
| Sep 5, 2025  | Testing + Leaderboard            |
| Sep 8, 2025  | Launch before Week 1             |

## ⚠️ Risks & Mitigations
- **NFL API reliability** → use SLA-backed provider
- **Deadline confusion** → user alerts and optional emails
- **Load spikes** → caching and scheduled batch jobs

## ✅ Success Criteria
- All users can register, pick, and view scores
- 100% accuracy in scoring
- No data loss or missed scoring updates



