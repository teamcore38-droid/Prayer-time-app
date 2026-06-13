# Masjid Connect - Prayer Time & Mosque Management Platform

Masjid Connect is a complete, production-ready, dual-module software system designed to connect local Islamic centers with their congregations. 

The platform consists of:
1. **Next.js 15 Web Portal & Backend API**: An administrative dashboard for Murobis/Imams and Super Admins to manage timetables, publish announcements, and review user accounts, alongside a secure REST API.
2. **React Native Expo Mobile Client**: A beautiful, emerald-themed application for community users to follow their local mosques, view daily timetables, read bulletins, inspect special prayer schedules, and view live prayer count-downs.

---

## 📂 Project Architecture & Folder Structure

```
d:/prayer time app/
├── README.md                # Main system documentation & setup guide
├── web/                     # Next.js 15 Administrative Portal & REST API
│   ├── app/
│   │   ├── api/             # REST route handlers (Auth, Prayers, Announcements, etc.)
│   │   ├── dashboard/       # Protected dashboard pages (Emerald-themed UI)
│   │   ├── login/           # Admin/Super Admin sign in
│   │   ├── register/        # Admin registration
│   │   ├── forgot-password/ # Account recovery simulation
│   │   ├── layout.tsx       # Root layout & providers
│   │   └── page.tsx         # Platform landing page
│   ├── components/          # Dashboard components (Sidebar, stats, tables, modals)
│   ├── lib/
│   │   ├── db.ts            # Mongoose MongoDB connection pooling
│   │   ├── auth.ts          # JWT encryption & header authorization guards
│   │   └── utils.ts         # Global date & string utilities
│   ├── models/              # Mongoose DB Schemas
│   ├── .env.local           # Environment variables (template included)
│   └── package.json
└── mobile/                  # React Native Expo Mobile App
    ├── src/
    │   ├── app/             # Expo Router screens
    │   │   ├── (auth)/      # Login, Register, Forgot Password
    │   │   ├── (tabs)/      # Bottom tab navigation (Home, Prayers, Specials, Notices, Settings)
    │   │   ├── mosque-info.tsx # Mosque details modal
    │   │   └── _layout.tsx  # Root navigation stack & AuthProvider
    │   ├── components/      # UI components (prayer cards, countdown widgets)
    │   ├── context/         # AuthContext (local state and AsyncStorage)
    │   ├── types/           # TS definitions
    │   └── utils/           # prayerHelpers (Hijri calendar and live countdowns)
    ├── android-widget/      # Android home widget files (Kotlin, layout xml, bridge modules)
    ├── package.json
    └── tsconfig.json
```

---

## 🗄️ MongoDB Schemas (Mongoose)

### 1. User (`web/models/User.ts`)
- Role-based design supporting: `super_admin`, `mosque_admin`, and `community_user`.
- Associated to a specific mosque via `mosqueId` (applicable to `mosque_admin`).

### 2. Mosque (`web/models/Mosque.ts`)
- Manages name, address, coordinates (`latitude`, `longitude`), and contact info.
- Stores default Friday congregation schedules under `jumuahSessions: [{ sessionNumber, khutbah, iqamah }]`.

### 3. PrayerTime (`web/models/PrayerTime.ts`)
- Stores Adhan and Iqamah times for the 5 daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha) and Sunrise.
- Uses a unique compound index on `{ mosqueId: 1, date: 1 }` to prevent date collisions.

### 4. SpecialPrayer (`web/models/SpecialPrayer.ts`)
- Customized prayer events (e.g. Taraweeh, Tahajjud, Eid congregations, Janazas, Qiyam-ul-Layl).

### 5. Announcement (`web/models/Announcement.ts`)
- Publishes notices grouped by categories: `Quran Class`, `Event`, `Fundraiser`, `Ramadan Notice`, `General`. Supports image URLs.

### 6. NotificationDevice (`web/models/NotificationDevice.ts`)
- Registers mobile app push tokens (`fcmToken`) mapped to platforms (`android` | `ios`) and subscribed mosques.

---

## 🌐 API Route Specifications

All protected routes require a `Bearer <token>` in the request `Authorization` header.

| Method | Endpoint | Access | Description |
|:---|:---|:---|:---|
| **POST** | `/api/auth/register` | Public | Registers user. First user defaults to `super_admin`. |
| **POST** | `/api/auth/login` | Public | Authenticates credentials and returns a JWT. |
| **GET** | `/api/auth/me` | User | Decodes token and returns current profile & mosque info. |
| **GET** | `/api/mosques` | Public | Fetches mosque registry. Optional filters: `city`, `search`. |
| **POST** | `/api/mosques` | Super Admin | Registers new mosque into system. |
| **PUT** | `/api/mosques/[id]` | Admin / Super | Edits mosque credentials or Jumuah schedules. |
| **GET** | `/api/prayers` | Public | Fetches prayer timetable by `mosqueId` and `date` / `month`. |
| **PUT** | `/api/prayers` | Admin / Super | Upserts daily schedules (supports bulk arrays). |
| **GET** | `/api/special-prayers` | Public | Lists special prayer events for a mosque. |
| **POST** | `/api/special-prayers` | Admin / Super | Schedules a special prayer congregation. |
| **DELETE**| `/api/special-prayers/[id]`| Admin / Super | Deletes special prayer event. |
| **GET** | `/api/announcements` | Public | Retrieves announcements bulletin for a mosque. |
| **POST** | `/api/announcements` | Admin / Super | Publishes announcement banner. |
| **DELETE**| `/api/announcements/[id]` | Admin / Super | Deletes announcement bulletin. |
| **GET** | `/api/dashboard-stats` | Admins | Returns statistics scoped to Mosque (Mosque Admin) or Platform (Super Admin). |
| **GET** | `/api/users` | Super Admin | Lists registered users. |
| **PUT** | `/api/users` | Super Admin | Updates user role permissions and mosque assignments. |
| **POST** | `/api/notifications/register` | Public | Registers mobile app token for push notifications. |

---

## 📱 Mobile App Screens & Features

- **Splash Screen**: Handled natively by Expo.
- **Login / Register / Recover**: Full admin entry flows with AsyncStorage state caching.
- **Home Dashboard**:
  - Displays followed mosque details, Gregorian, and Hijri calendar dates.
  - Live count-down to next prayer event (adhan or iqamah) updating every second.
  - Highlighted row on the prayer card for the upcoming prayer.
  - List of Jumuah congregations.
- **Prayers Tab**: 30-day horizontal or list schedule representation.
- **Specials Tab**: Lists custom scheduled events with descriptive tags.
- **Notices Tab**: Bulletin board showcasing classes, fundraisers, and alerts.
- **Settings Tab**: Follow mosque selector directory (instant updates), push notifications toggles, and admin portal buttons.

---

## 📲 Android Home Widget Configuration

The mobile app includes an Android Home Widget supporting:
- Displaying current followed Mosque Name
- Next Prayer Title
- Countdown clock
- Scheduled Salah Time

### Bridge Implementation
The React Native app updates shared preferences that the widget reads.
- **Kotlin Receiver**: [`mobile/android-widget/PrayerWidget.kt`](file:///d:/prayer%20time%20app/mobile/android-widget/PrayerWidget.kt)
- **Layout Layout XML**: [`mobile/android-widget/prayer_widget.xml`](file:///d:/prayer%20time%20app/mobile/android-widget/prayer_widget.xml)

For detailed native compilation steps and folder allocations, review the [Widget Implementation Guide](file:///d:/prayer%20time%20app/mobile/android-widget/WidgetImplementation.md).

---

## ⚙️ Local Setup Guide

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)

### 1. Web Portal & REST API
1. Navigate to the `web/` directory:
   ```bash
   cd web
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Copy environment configuration:
   Rename `.env.local` or create it, then update values:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_signing_secret
   NEXTAUTH_SECRET=your_nextauth_signing_secret
   FCM_SERVER_KEY=firebase_push_messaging_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   The portal will run at `http://localhost:3000`.

### 2. Mobile App (Expo)
1. Navigate to the `mobile/` directory:
   ```bash
   cd ../mobile
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Update `API_URL` in [`mobile/src/context/AuthContext.tsx`](file:///d:/prayer%20time%20app/mobile/src/context/AuthContext.tsx):
   - For local development on physical devices or emulators, set it to your computer's IP address: `http://<your-computer-ip>:3000`.
   - For production, set it to your Vercel deployment URL: `https://masjid-connect-web.vercel.app`.
4. Start Expo:
   ```bash
   npm run android  # For Android emulator
   # or
   npm run ios      # For iOS simulator
   # or
   npm run start    # Generates a QR code to run on physical devices via Expo Go app
   ```

---

## 🚀 Production Deployment Guide

### Web Dashboard & API (Vercel)
1. Create a repository on GitHub and push the code.
2. Sign in to [Vercel](https://vercel.com).
3. Import your repository. Select the **Root Directory** as `web/`.
4. Configure Environment Variables in the project settings matching `web/.env.local` (`MONGODB_URI`, `JWT_SECRET`, `NEXTAUTH_SECRET`, `FCM_SERVER_KEY`).
5. Click **Deploy**. Vercel will build and host your Next.js application.

### Database (MongoDB Atlas)
1. Register on MongoDB Atlas and create a new cluster.
2. Under "Database Access", create a database user with read/write privileges.
3. Under "Network Access", allow access from all IPs (`0.0.0.0/0`) since Vercel utilizes serverless IPs.
4. Copy the connection string, replace `<password>` with your user password, and add it to your environment variables (`MONGODB_URI`).

### Mobile App (Expo EAS Build)
1. Log in to your Expo account in terminal: `npx expo login`.
2. Configure EAS: `npm install -g eas-cli && eas build:configure`.
3. Trigger Android build: `eas build --platform android`.
4. Trigger iOS build: `eas build --platform ios`.
