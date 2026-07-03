# SEVA 🚑 — Smart Emergency Vehicle Allocation

SEVA is a premium, real-time emergency medical response platform designed to bridge the gap between patients, ambulance dispatchers, and receiving hospitals. Utilizing automated nearest-responder routing, live GPS tracking, and Gemini-powered first aid instructions, SEVA ensures medical help arrives in seconds.

---

## 🚀 Key Features

* **Command Center Dashboard:** A unified, real-time map displaying available emergency response units, live user coordinates, and traffic-aware OSRM driving paths.
* **Automated Dispatch Matching:** An server-side routing engine that instantly matches incoming emergency calls to the nearest available ambulance based on real-time distance calculations.
* **Driver Console:** A dedicated, interactive console for emergency responders to log shifts, view patient details, start en-route transit tracking, and verify arrival OTPs.
* **First Aid AI Assistant:** A Gemini-integrated conversational tutor offering structured, immediate triage instructions for cardiac pain, burns, bleeding, choking, and fractures, with robust offline safety fallbacks.
* **Hospital Directory:** Interactive split-view map detailing verified emergency rooms, specialty filters (cardiology, trauma, pediatrics), and one-click call routing.

---

## 🛠️ Technology Stack

* **Front-end:** React (TypeScript), Vite, Tailwind CSS, Leaflet Maps, Wouter SPA router.
* **Back-end:** Node.js, Express, MySQL (mysql2 driver).
* **AI Engine:** Google Gemini AI API (`gemini-2.5-flash`).
* **Map Routing:** OpenStreetMap (OSRM API).
* **Data Streams:** Server-Sent Events (SSE) for real-time ambulance coordinate telemetry.

---

## 📦 Local Setup & Installation

### 1. Prerequisites
Ensure you have the following installed on your machine:
* **Node.js** (v18 or higher)
* **MySQL** (v8.0 or higher, running locally on port `3306`)
* **Git**

### 2. Clone & Install Dependencies
```bash
# Clone the repository
git clone <your-repo-link>
cd SEVA

# Install project packages
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=seva
JWT_SECRET=super_secret_jwt_key
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Note:** Create the `seva` database in MySQL before starting: `CREATE DATABASE seva;`

### 4. Running the Project
```bash
# Run database check & launch development server
npm run dev
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser.

---

## 🔑 Test Credentials (Driver Portal)
To access the Driver Console at `/driver`, use either of these pre-seeded paramedic logins:

| Email | Password | Driver Name |
|---|---|---|
| `driver1@seva.com` | `driver123` | Rajesh Kumar |
| `driver2@seva.com` | `driver123` | Priya Sharma |

---

## 📤 Publishing to your GitHub Repository

Once you have installed Git, you can push this project to your personal GitHub account by running these commands in your shell:

```bash
# 1. Initialize local repository
git init

# 2. Add files and make initial commit
git add .
git commit -m "feat: complete SEVA emergency portal restructure"

# 3. Rename branch to main
git branch -M main

# 4. Link your personal GitHub repository (create a blank repository on github.com first)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 5. Push code to your branch
git push -u origin main
```
