# SURYA E.M High School - Online Admission Portal

A premium, mobile-first, digital admission web application for SURYA E.M High School, NANDIGAMPADU, UNAGATLA. Designed for optimal performance, responsiveness on Android devices, and a high-end luxury feel.

---

## Technical Features
- **Frontend**: Clean semantic HTML5, CSS3 Custom Variables, and modular JavaScript.
- **Animations**: GSAP (GreenSock) for loader, welcome text, form slide-up, staggered input reveals, and success alerts.
- **Background**: Soft HTML5 `<canvas>` floating particle system, optimized for low-end devices.
- **Offline / PWA**: Web Manifest (`manifest.json`) and Service Worker (`sw.js`) cache static assets for fast reloading.
- **Local Auto-Save**: Real-time form fields draft auto-saving to `localStorage` to prevent data loss.
- **Backend Service**: Serverless-ready API (`/api/submit`) integrating Google Sheets (sequence indexing) and Nodemailer SMTP (HTML templates for school admins & parent confirmations).
- **Fallback Mock Mode**: Automatically enabled out of the box so that the site is fully testable without API credentials.

---

## Directory Structure
```text
surya-admission-app/
├── api/
│   └── submit.js         # Backend serverless handler (Vercel compatible)
├── public/
│   ├── assets/
│   │   └── logo.png      # Background-removed enhanced school logo
│   ├── css/
│   │   └── style.css     # Premium blue & gold light-theme styles
│   ├── js/
│   │   └── app.js        # Particles, GSAP timelines, localStorage, validation
│   ├── index.html        # Responsive viewport semantic structure
│   ├── manifest.json     # PWA app setup
│   └── sw.js             # PWA service worker cache
├── .env                  # Local environment settings (MOCK_MODE enabled by default)
├── .env.example          # Environment variables template
├── package.json          # Node dependency configurations
├── server.js             # Local Express developer environment
└── README.md             # This instructions document
```

---

## Getting Started

### 1. Prerequisite
Ensure you have [Node.js](https://nodejs.org/) (version 18 or higher) installed.

### 2. Installation
Open your terminal inside the project directory and run:
```bash
npm install
```

### 3. Running Locally
Run the developer environment server:
```bash
npm run dev
# OR: node server.js
```
Open [http://localhost:3000](http://localhost:3000) in your web browser. Enable "Responsive Mode" in your developer tools and simulate an Android/mobile device to preview the premium mobile-first look.

---

## Backend Configurations (.env)

To connect the application to real services, rename `.env.example` to `.env`, set `MOCK_MODE=false`, and configure the following variables:

### A. Google Sheets API Configuration
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and enable the **Google Sheets API**.
3. Create a **Service Account** and download the credentials JSON key.
4. Copy the service account email (e.g., `account-name@project.iam.gserviceaccount.com`) and paste it as `GOOGLE_SERVICE_ACCOUNT_EMAIL`.
5. Open the downloaded JSON file, copy the private key (starting with `-----BEGIN PRIVATE KEY-----`), and paste it as `GOOGLE_PRIVATE_KEY` (keep the quotes and ensure `\n` newlines are preserved).
6. Create a Google Sheet, name the first tab `Sheet1`, and add headers in the first row:
   * **Row 1 headers**: `Admission Number`, `Student Name`, `Surname`, `Mobile`, `Email`, `DOB`, `Aadhar Number`, `Father Name`, `Class`, `Occupation`, `Address`, `Status`, `Timestamp`
7. Copy the spreadsheet ID from the URL (e.g., `docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit`) and paste it as `GOOGLE_SPREADSHEET_ID`.
8. **Share the Google Sheet** with your service account email address, granting it **Editor** permissions.

### B. SMTP / Email Settings
Configure your mail server details so Nodemailer can send alerts:
- `SMTP_HOST`: Host address (e.g., `smtp.gmail.com` or `smtp.resend.com`).
- `SMTP_PORT`: Port (usually `587` for TLS or `465` for SSL).
- `SMTP_USER`: Sender username/email.
- `SMTP_PASS`: App password or SMTP password.
- `SCHOOL_EMAIL`: The recipient email address of school admissions office (e.g. `admissions@suryaschool.edu.in`).

---

## Production Deployment

### 1. Vercel
Vercel supports serverless Node.js endpoints out-of-the-box inside the `/api` directory.
- Install the Vercel CLI or link your repository to Vercel.
- Configure all environment variables in your Vercel Project settings.
- Deploy. Vercel will automatically route traffic to your static frontend and run `/api/submit` as a Serverless Function.

### 2. Netlify
- Create a `netlify.toml` file in the root directory to direct serverless functions if needed:
```toml
[build]
  publish = "public"
  functions = "api"
```
- Define the submission endpoint route adjustments if necessary or use Netlify Functions.
