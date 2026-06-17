# BoastMe - AI-Driven Student Performance Prediction & Intervention System

## How to Run the Application

### 1. Prerequisites
- Node.js installed.
- MySQL database running with a database named `boostme`.
- Update `server/.env` with your database credentials if different from the default.

### 2. Run the Backend Server
1. Open a terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   node index.js
   ```
   *The server will run on http://localhost:5000*

### 3. Run the Frontend Client
1. Open a new terminal and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The client will run on http://localhost:5173*

## Current Features
- **Dynamic Profile Page**: Completely refactored role-based profile with View/Edit modes.
- **Multi-Step Registration**: Personalized onboarding for Students, Lecturers, and Mentors.
- **Predictive Dashboard**: Student performance prediction tools.
- **Admin Monitors**: Specialized dashboards for Lecturers and Mentors.
