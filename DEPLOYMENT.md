# CargoTrace — Production Deployment & Operations Guide

This guide provides step-by-step instructions for deploying CargoTrace to public production infrastructure using:
- **Backend API**: Render (Node.js Express)
- **Frontend SPA**: Vercel (React 19 + Vite)
- **Database**: MongoDB Atlas
- **Evidence Storage**: Firebase Storage
- **AI Analysis**: Google Gemini API (`gemini-3.5-flash-lite`)

---

## 1. Prerequisites & Required Cloud Accounts

1. **MongoDB Atlas Account**: Database instance (`M0 Free` or `M10+ Dedicated`).
2. **Firebase Project**: Firebase Storage bucket enabled with service account JSON.
3. **Render Account**: Web Service host for the Node.js API.
4. **Vercel Account**: Static site hosting for Vite React SPA.
5. **Google AI Studio API Key**: For Gemini investigation analysis (`gemini-3.5-flash-lite`).

---

## 2. Database Setup (MongoDB Atlas)

1. Create a new cluster in MongoDB Atlas (e.g. `cargotrace-prod`).
2. Create a dedicated database user (e.g., `cargotrace_app`) with `readWrite` role on the `cargotrace` database.
3. Under **Network Access**, add the IP addresses of your Render backend (or `0.0.0.0/0` with strong authentication).
4. Obtain the connection string:
   ```
   MONGODB_URI=mongodb+srv://cargotrace_app:<PASSWORD>@cargotrace-prod.xxxx.mongodb.net/cargotrace?retryWrites=true&w=majority
   ```

---

## 3. Evidence Storage Setup (Firebase Storage)

1. Open the [Firebase Console](https://console.firebase.google.com/) and create a project (e.g. `cargotrace-production`).
2. Enable **Firebase Storage** in default private mode.
3. Navigate to **Project Settings > Service Accounts**, click **Generate new private key**, and download the JSON key.
4. Extract the following values for environment variables:
   - `FIREBASE_PROJECT_ID`: `cargotrace-production`
   - `FIREBASE_CLIENT_EMAIL`: `firebase-adminsdk-xxx@cargotrace-production.iam.gserviceaccount.com`
   - `FIREBASE_PRIVATE_KEY`: `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`
   - `FIREBASE_STORAGE_BUCKET`: `cargotrace-production.appspot.com`

---

## 4. Backend API Deployment (Render)

1. Connect your GitHub repository to Render and select **New Web Service**.
2. Settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server/src/server.js`
   - **Health Check Path**: `/api/v1/health`
3. Configure Environment Variables in Render:
   ```env
   NODE_ENV=production
   PORT=10000
   CLIENT_ORIGIN=https://cargotrace.vercel.app
   MONGODB_URI=mongodb+srv://cargotrace_app:<PASSWORD>@cargotrace-prod.xxxx.mongodb.net/cargotrace?retryWrites=true&w=majority
   SESSION_SECRET=a_very_long_secure_32_character_random_string_here
   AI_PROVIDER=google
   GEMINI_API_KEY=AIzaSyYourActualGeminiApiKeyHere
   GEMINI_MODEL=gemini-3.5-flash-lite
   FIREBASE_PROJECT_ID=cargotrace-production
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@cargotrace-production.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_STORAGE_BUCKET=cargotrace-production.appspot.com
   ```
4. Deploy the service and record your backend API URL (e.g., `https://cargotrace-api.onrender.com`).

---

## 5. Frontend SPA Deployment (Vercel)

1. Connect your GitHub repository to Vercel and select **New Project**.
2. Framework Preset: `Vite`.
3. Root Directory: `./` (or `client` if building isolated directory).
4. Configure Build Command: `npm run build`.
5. Configure Environment Variables in Vercel:
   ```env
   VITE_API_BASE_URL=https://cargotrace-api.onrender.com/api/v1
   ```
6. Click **Deploy**. Note: Any change to `VITE_API_BASE_URL` requires a new Vercel deployment.

---

## 6. Initial Administrator Registration & Operational Verification

1. Navigate to the deployed frontend URL (`https://cargotrace.vercel.app`).
2. Click **Register** to create the initial admin user and primary organization.
3. Verify System Health:
   - Request `GET https://cargotrace-api.onrender.com/api/v1/health`
   - Confirm status is `healthy` with database and storage connected.
4. Test Operational Workflows:
   - Create a shipment, record custody transfers, log inspections, report a damage incident, upload evidence photo, and trigger Gemini AI case analysis.

---

## 7. Security, Backup, and Maintenance Operations

- **Database Backups**: Enable MongoDB Atlas Automated Continuous Backups (Point-in-Time Recovery).
- **Credential Rotation**: To rotate `SESSION_SECRET` or `GEMINI_API_KEY`, update the environment variable in Render and click **Manual Deploy > Clear Build Cache & Deploy**.
- **Rollback Procedure**: Vercel and Render support 1-click rollbacks to previous deployment commits via their respective dashboards.
