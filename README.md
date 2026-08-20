# 🚨 RoadRescue - 24x7 Emergency Vehicle Assistance Platform

RoadRescue is a full-stack emergency roadside assistance platform designed to connect stranded vehicle owners on highways and city roads with nearby verified mechanics in real-time.

![RoadRescue Architecture](https://img.shields.shields.io/badge/Platform-Web%20%7C%20Node.js%20%7C%20Leaflet-orange)
![License](https://img.shields.shields.io/badge/License-MIT-blue)

---

## 🌟 Key Features

- **🚨 Floating Red Emergency SOS Button**: 1-tap emergency dispatch across the entire application with GPS location detection and multi-mechanic radar broadcast.
- **📍 GPS Location Detection & Nominatim Geocoding**: Real browser geolocation reverse-geocoded into city and locality names (*e.g., Kovur, Guntur, Hyderabad*) without fake hardcoded locations.
- **📲 Real SMS OTP Authentication (MSG91 Widget / Fast2SMS / Twilio)**: Production-ready 6-digit OTP verification system. Accounts are auto-created upon SMS verification with zero friction.
- **🛵 Clean Vehicle Category Selection**: Dedicated modern cards for Bikes, Cars, Trucks, Autos, and Electric Vehicles (EVs).
- **🤖 Smart Diagnostic Assistant**: Interactive diagnostic questionnaire for breakdown issues (*Battery Dead, Fuel Empty, Flat Tyre, Engine Failure*) that attaches a diagnostic summary to the mechanic request.
- **⛽ Smart Petrol Pump Suggestions**: On-demand locator for nearby petrol stations when selecting "Fuel Empty".
- **🛠️ Mechanic Partner Console**: Incoming emergency dispatch radar, availability toggle (Online / Busy / Offline), and active navigation HUD.
- **💯 Zero Fake Data Policy**: Clean initial user state with zero dummy vehicles, zero placeholder stats, and dynamic price estimates shared upon mechanic request acceptance.

---

## 🛠️ Technology Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | HTML5, Vanilla CSS3 (Glassmorphism), Client-side JavaScript (ES6+) |
| **Mapping Engine** | Leaflet.js + OpenStreetMap + Nominatim Reverse Geocoding API |
| **Backend** | Node.js HTTP REST API Server |
| **SMS Gateway** | MSG91 OTP Widget API / Fast2SMS / Twilio Verify API |
| **State Store** | Centralized Reactive Event Store (`localStorage` persistence) |

---

## 📁 Repository Structure

```text
roadrescue-vehicle-assistance-platform/
├── css/
│   ├── main.css          # Core design tokens, CSS variables & glassmorphism
│   ├── home.css          # Landing page hero, location banner & OTP card styles
│   ├── owner.css         # Customer dashboard, vehicle cards & diagnostic HUD
│   ├── partner.css       # Mechanic partner console & availability toggle
│   └── admin.css         # Admin command map & KPI grid
├── js/
│   ├── location.js       # LocationService class (Nominatim reverse geocoding & Haversine math)
│   ├── store.js          # AppStore reactive central state management
│   ├── map.js            # Leaflet map controller & marker rendering
│   ├── owner.js          # Customer portal controller & diagnostic wizard
│   ├── partner.js        # Mechanic portal controller & dispatch radar
│   └── app.js            # Main application orchestrator & navigation UI router
├── server/
│   ├── index.js          # Native Node.js REST API backend server (port 5000)
│   └── package.json      # Backend dependencies
├── index.html            # Main SPA HTML structure & MSG91 OTP Widget SDK
├── .env.example          # Environment variables template
├── .gitignore            # Excluded files configuration
└── README.md             # Project documentation
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Browser**: Modern web browser (Chrome, Edge, Firefox, Safari) with Location permissions enabled.

### 2. Setup Environment Variables
Copy `.env.example` to `.env` in the `server/` directory and configure your credentials:

```bash
cp .env.example .env
```

Set your MSG91 credentials in `.env`:
```env
PORT=5000
MSG91_WIDGET_ID=your_msg91_widget_id
MSG91_TOKEN_AUTH=your_msg91_token_auth
```

### 3. Run the Backend API Server
Start the Node.js API server on port `5000`:

```bash
node server/index.js
```

### 4. Run the Web Application
Serve the web files using any HTTP static server (e.g. `serve` or VS Code Live Server):

```bash
npx serve -p 8080
```

Open your browser and navigate to:
👉 **[http://localhost:8080](http://localhost:8080)**

---

## 🔒 Security Best Practices

- **Zero API Key Exposure**: Credentials are loaded securely via `process.env`.
- **Backend Verified OTP**: All OTP requests and verifications are processed server-side via MSG91 HTTPS APIs.
- **Git Safety**: Sensitive `.env` files, log files, and credentials are excluded via `.gitignore`.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
